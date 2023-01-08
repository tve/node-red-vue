// Vue plugin for Node-RED - implement Node-RED flow-editor node templates using Vue & TailwindCSS
// Copyright ©2022-2023 by Thorsten von Eicken, see LICENSE

import { RED, NrNodeRaw, asNrNode, NrNodeDef, cleanNrNode } from "/src/node-red"
import { addComponent, mountEditApp, makeComponentName } from "./vue-app"
import "./index.css"
//import dynImport from "./dynimport"

// ====== Import shims

const global = globalThis as any

// Initialize es-module-shims, used when importing Vue components to point to Vue.
// It may be overkill, but enables importing additional packages in the future.
global.esmsInitOptions = {
  shimMode: true, // shimMode requird to support multiple dynamic import maps
  // Skip source analysis of certain URLs for full native passthrough
  skip: "^https?:.*/assets/index.[a-z0-9]{8}.js$", // bundled Node-RED-Vue assets
  mapOverrides: true, // Permit overrides to import maps (used by custom widget HMR)
}
import * as vue_all from "vue"
global.Vue = vue_all
const importShimReady = import("./map-import").then(mapImport => {
  mapImport.default({
    vue: "Vue",
  })
  console.log("Import map defined")
})

// ====== Plugin data structures

// Array of node-red templates that use vue. New templates are appended and
// a message is pushed with the new index to all connected flow editors. (I don't think types
// can be updated). The flow editor fetches all templates at start-up providing for an initial
// sync, thereafter it pulls new templates incrementally.
enum TemplateState {
  failed, // fetch failed, should be retried
  fetching, // fetching, don't mess with it
  waiting, // fetched, waiting for node-type-added event
  done, // type done, template created
  dead, // fatal error while generating component or template
}
type Component = { url: string; styles: string; hash: string }
const templates: {
  ix: number
  name: string | null
  state: TemplateState
  url?: string // where to fetch component javascript module
  styles?: string // CSS to inject
  hash?: string // hash of component (for HMR?)
}[] = []

// ====== Plugin registration with Node-RED

RED.plugins.registerPlugin("node-red-vue", {
  type: "node-red-vue",
  onadd: function () {
    console.log("Adding Node-RED Vue plugin")

    // Subscribe to notifications from the runtime that a new node type has been registered.
    RED.comms.subscribe("vue-add-type", (topic, object) => {
      // topic == 'vue-add-type'
      if (object && typeof object == "object") {
        const { ix, name } = object
        if (name && typeof name == "string" && Number.isFinite(ix) && ix >= 0) {
          // check whether it's OK to fetch this template
          const err = checkTemplate(ix, name)
          if (err) {
            console.log(err)
            return
          }
          // fetch the template and any we may have missed
          let start = ix
          while (start > 0 && checkTemplate(start - 1, null) == null) start--
          fetchTemplates(start, ix).then(() => {}) // launch async
          return
        }
      }
      console.log("node-red-vue: invalid vue-add-type message:", object)
    })

    // Fetch the already-registered templates from the server
    fetchTemplates(0, -1).then(() => {}) // launch async

    console.log("Node-RED Vue plugin added")
  },
})

// ====== Fetching and processing of Vue templates

// Fetch Vue type, i.e. component
async function fetchTemplates(start_ix: number, end_ix: number): Promise<void> {
  for (let ix = start_ix; ix <= end_ix; ix++)
    templates[ix] = { ix, name: null, state: TemplateState.fetching }

  // perform fetch
  try {
    const url =
      "_vue/templates?" +
      new URLSearchParams({ start: start_ix.toString(), end: end_ix.toString() })
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP status ${res.status}: ${res.statusText}`)
    var data = (await res.json()) as ({ name: string; component: Component } | null)[]
    if (!data || !Array.isArray(data)) throw new Error("invalid data")
  } catch (err) {
    console.error(`node-red-vue: failed to fetch vue templates ${start_ix}..${end_ix}:`, err)
    for (let ix = start_ix; ix <= end_ix; ix++) templates[ix].state = TemplateState.failed
    return
  }

  // if end_ix is -1, mark everything we got as "fetching" and remove any items that are already
  // in fetching, which can happen due to race conditions
  if (end_ix == -1) {
    end_ix = data.length - 1
    for (let ix = 0; ix <= end_ix; ix++) {
      if (templates[ix]?.state >= TemplateState.fetching) {
        data[ix - start_ix] = null
      } else {
        templates[ix] = { ix, name: null, state: TemplateState.fetching }
      }
    }
  }

  // process what we got
  data.forEach((d, ix) => {
    if (d) processTemplate(ix + start_ix, d).then(() => {}) // launch async
  })
}

// check whether to fetch a template, return error string if not, or null to fetch
function checkTemplate(ix: number, name: string | null) {
  if (name) {
    const old_ix = templates.findIndex(t => t.name == name)
    if (old_ix >= 0 && old_ix != ix) {
      return `node-red-vue: vue template index mismatch: ${name} ${old_ix} ${ix}`
    }
  }
  switch (templates[ix]?.state) {
    case TemplateState.failed:
      return `node-red-vue: vue template fetch failed: ${name}`
    case TemplateState.fetching:
      return `node-red-vue: vue template already fetching: ${name}`
    case TemplateState.waiting:
      return `node-red-vue: vue template awaiting registration: ${name}`
    case TemplateState.done:
      return `node-red-vue: vue template already installed: ${name}`
    case TemplateState.dead:
      return `node-red-vue: vue template failed to install: ${name}`
    default:
      return null
  }
}

async function processTemplate(ix: number, data: Record<string, any>) {
  var name = "unknown"
  try {
    // sanity checks
    if (!data || typeof data != "object" || !["ix", "name", "url"].every(f => f in data))
      throw new Error(`invalid data: ${JSON.stringify(data)}`)
    name = data.name
    // async import of component module and sanity checks
    await importShimReady
    //const mod = await dynImport(document.location.origin + data.url) // import(/*@vite-ignore*/ data.url)
    const loc = document.location
    const modUrl = loc.origin + loc.pathname + data.url
    console.log("Importing", modUrl)
    const mod = await global.importShim(modUrl)
    const component = mod.default // Vue SFCs are expected to export default
    if (!component || typeof component != "object") throw new Error("invalid component")
    if (!["props", "node_red"].every(f => f in component))
      throw new Error("missing props and/or node_red field in component")
    // generate stuff for flow
    const cn = makeComponentName(name)
    addComponent("edit-" + cn, component)
    if ("help" in component) generateHelp(name, component.help)
    const isConfig = component.node_red.category == "config"
    generateTemplate(name, component.props, isConfig)
    registerType(name, component.props, component.node_red)
  } catch (err) {
    console.error(`node-red-vue: failed to load vue template for ${name}:`, err)
    templates[ix].state = TemplateState.dead
  }
}

// generate a help template for the flow editor with the help text
function generateHelp(name: string, help: string) {
  // remove any existing script element for this type
  const oldEl = document.querySelector(`script[data-template-name="${name}"]`)
  if (oldEl) oldEl.remove()
  // create the script element for Node-RED
  const helpEl = document.createElement("script")
  helpEl.type = "text/markdown"
  helpEl.setAttribute("data-help-name", name)
  helpEl.textContent = help
  document.body.appendChild(helpEl)
}

// generate a data template for the flow editor consistsing of a hidden string input for
// every prop in the component
function generateTemplate(name: string, props: Record<string, any>, isConfig: boolean) {
  // remove any existing script element for this type
  const oldEl = document.querySelector(`script[data-template-name="${name}"]`)
  if (oldEl) oldEl.remove()
  // create the edit script tag for Node-RED to populate with values
  const scriptEl = document.createElement("script")
  scriptEl.type = "text/html"
  scriptEl.setAttribute("data-template-name", name)
  const html = `<div id="${name}-edit-root" style="width:100%;height:100%" class="tw-root tw-root"></div>`
  const prefix = isConfig ? "node-config-input-" : "node-input-"
  const inputs = Object.keys(props).map(prop => `<input type="hidden" id="${prefix + prop}">`)
  scriptEl.innerText = html + '<div style="display:none">' + inputs.join("") + "</div>"
  document.body.appendChild(scriptEl)
  //console.log("Created edit script element:", scriptEl)
}

// register the node template type with Node-RED, which makes it show up in the palette and
// allows the flow editor to create instances of it.
function registerType(name: string, props: Record<string, any>, node_red: Record<string, any>) {
  const typedef = Object.assign({}, node_red) as Record<string, any>
  // FIXME: need general conversion
  if (!("defaults" in typedef)) {
    typedef.defaults = {}
    for (const p in props) {
      const v = props[p]
      if (typeof v == "object") {
        typedef.defaults[p] = { value: v.default }
        if ("config_type" in v) typedef.defaults[p].type = v.config_type
      } else {
        typedef.defaults[p] = { value: v }
      }
    }
  }
  typedef.oneditprepare = oneditprepare
  console.log(`Registering Vue-based type ${name}:`, typedef)
  RED.nodes.registerType(name, typedef as NrNodeDef)

  // console.log(`${name}: ${JSON.stringify(RED.nodes.getType(name))})}`)
  // console.log(`minimal: ${JSON.stringify(RED.nodes.getType("minimal"))})}`)
}

function oneditprepare(this: NrNodeRaw) {
  // Mount the Vue app on the root element of the edit form
  const node = asNrNode(this)
  const nodeType = node.type
  const attach = document.getElementById(nodeType + "-edit-root")
  if (!attach) {
    console.error(`Could not find element #${nodeType}-edit-root`)
    return
  }
  const { $bus, unmount } = mountEditApp(node, attach)

  // oneditsave needs to save the edited
  const nodeDef = node._def
  nodeDef.oneditsave = function () {
    $bus.emit("onSave")
    unmount()
    node.saveEdited()
    cleanNrNode(node)
    setTimeout(() => {
      console.log("Saved node", node)
    }, 500)
    return false
  }
  // oneditcancel just calls unmount
  nodeDef.oneditcancel = function () {
    $bus.emit("onCancel")
    unmount()
    cleanNrNode(node)
  }
}
