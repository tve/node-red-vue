// Vue plugin for Node-RED - implement Node-RED node HTML files using Vue & TailwindCSS
// Copyright ©2022 by Thorsten von Eicken, see LICENSE

// This plugin has two main roles: convert .vue files into the "templates" necessary for the
// flow-editor to be able to start rendering nodes and compile and push the Vue components to
// the flow-editor.
// Generating the templates for the flow editor is kicked of by the nodes calling createVueTemplate.
// The templates are then pushed into the runtime's regsitry so they end up being sent to
// flow-editors when they connect.
// Compilations of vue components happen at the same time and the resulting components are pushed
// to the flow-editor using notifications and API calls.
// There are two types of components: those corresponding to node types that render edit panes,
// and additional "plain" components that are used by the former components.

"use strict"
const path = require("path")
const fs = require("fs")
const fsp = require("fs/promises")
const sfc_compiler = require("./sfc-compiler.js")
const gen_template = require("./gen-template.js")

module.exports = function (RED) {
  // use try-catch to get stack backtrace of any error
  try {
    // Component registry ("is_tmpl" => is component for node template, vs. plain component)
    const registry = [] // { ix: index, name: string, is_tmpl, url, styles, hash} }
    const components = {} // name -> script code (gets served up to fulfill import)

    // ===== Admin API handlers to serve up flow editor Vue components

    // get information about components, expects query string params start and end, end=-1 -> last
    RED.httpAdmin.get("/_vue/registry", (req, res) => {
      console.log("GET /_vue/registry", req.query)
      const start = parseInt(req.query.start)
      let end = parseInt(req.query.end)
      if (end == -1) end = registry.length - 1
      if (
        isNaN(start) ||
        start < 0 ||
        start >= registry.length ||
        isNaN(end) ||
        end < 0 ||
        end >= registry.length ||
        start > end
      ) {
        res.status(400).send("Bad start/end")
        return
      }
      // send all templates from start to end inclusive
      res.set("Content-Type", "application/json")
      const data = registry.slice(start, end + 1)
      res.send(JSON.stringify(data))
    })

    // get a Vue component module, i.e. something that can be `import`ed into the browser
    // the url in the registry points here
    RED.httpAdmin.get("/_vue/component/:name", (req, res) => {
      console.log("GET /_vue/component", req.params)
      const name = req.params.name
      if (name && typeof name == "string" && name in components) {
        res.set("Content-Type", "application/javascript")
        res.send(components[name])
      } else {
        res.status(404).send("Not found")
      }
    })

    // ===== createVueComponent

    // createVueComponent creates a Vue component from a .vue file and pushes it to the flow-editor
    async function createVueComponent(name, filename, filePromise) {
      const data = await filePromise

      // compile SFC (= Vue Single File Component) and check for errors
      const sfc = sfc_compiler(data, filename)
      if (Array.isArray(sfc.errors) && sfc.errors.length > 0) {
        const errs = sfc.errors.map(err => {
          if (err.loc?.start)
            return `line ${err.loc.start.line} col ${err.loc.start.column}: ${err.message}`
          else return `${err.message}`
        })
        RED.log.error(`Error compiling ${filename}:\n` + errs.join("\n"))
        return
      }

      // add to registry
      let ix = registry.findIndex(t => t.name === name)
      if (ix < 0) {
        ix = registry.length
      } else if (registry[ix].hash === sfc.hash) {
        return sfc // no change
      }
      const url = `_vue/component/${name}`
      registry[ix] = { ix, name, url, styles: sfc.styles, hash: sfc.hash }
      components[name] = sfc.script
      RED.comms.publish("vue-add-type", { ix, name })
      return sfc
    }

    // ===== createVueTemplate

    // setNodeTypeConfig sets the "node type config and help", which is normally loaded from
    // the node's .html file.
    // It would be nice if the undocumented "opts" parameter to RED.nodes.registerType
    // would allow us to pass in the "config" and "help" fields, but it doesn't.
    // It would also be nice if RED.registray was exposed (as documented in the API docs) but it
    // isn't and getFullNodeInfo wouldn't be part of it anyway.
    // It would be nice if Node-RED wasn't so locked down.
    // Sooo... Node.js to the rescue...
    let RED_registry // would be nice if NR exposed RED.registry...
    function setNodeTypeConfig(nodeType, config, help) {
      // get access to @node-red/registry
      if (!RED_registry) {
        const registry_key = Object.keys(require.cache).filter(k =>
          k.includes("@node-red/registry/lib/registry")
        )[0]
        RED_registry = require.cache[registry_key].exports
      }
      // get the node type info, at this point the type isn't fully registered so
      // getFullNodeInfo with the nodeType doesn't find it.
      const node_info = RED_registry.getNodeList(i => i.types.includes(nodeType))
      if (!node_info || node_info.length == 0) {
        RED.log.error(`Can't find node type ${nodeType}: has RED.nodes.registerType been called?`)
        return
      }
      const node_fullInfo = RED_registry.getFullNodeInfo(node_info[0].id)
      if (!node_fullInfo) {
        RED.log.error(`Internal error getting full node type for ${nodeType}`)
        return
      }
      if (!node_fullInfo.config) node_fullInfo.config = config
      if (!node_fullInfo.help) node_fullInfo.help = {}
      if (!node_fullInfo.help.en_US) node_fullInfo.help.en_US = help
    }

    async function _createVueTemplate(nodeType, filename, filePromise) {
      try {
        const sfc = await createVueComponent(nodeType, filename, filePromise)

        // generate template for flow editor
        const { tmplJs, tmplData, tmplHelp, error } = gen_template(
          nodeType,
          sfc.scriptAst,
          sfc.scriptRaw
        )
        if (error) {
          RED.log.error(`Error generating Node-RED flow editor template for ${nodeType}:\n` + error)
          return
        }
        let config = `<script type="text/javascript">\n${tmplJs}\n</script>\n`
        config += `<script type="text/html" data-template-name="${nodeType}">\n${tmplData}</script>\n`
        setNodeTypeConfig(nodeType, config, tmplHelp)
        // console.log("Vue template", nodeType, "==== config\n" + config, "\n===== help\n" + tmplHelp)
      } catch (err) {
        RED.log.error(`Error creating Vue template for ${nodeType}:\n` + err.stack)
      }
    }

    function createVueTemplate(nodeType, filename) {
      const vueFile = filename.replace(/\.[^.]+$/, ".vue")
      if (!fs.existsSync(vueFile)) {
        RED.log.error(`Vue template ${vueFile} not found`)
        return
      }
      // TODO: check for duplicate registration

      function fileChanged() {
        RED.log.info("Creating Vue template for '" + nodeType + "' from " + vueFile)
        _createVueTemplate(nodeType, vueFile, fsp.readFile(vueFile, "utf8"))
      }

      fs.watch(vueFile, { persistent: false }, fileChanged)
      fileChanged(vueFile)

      locateComponents(vueFile)
    }

    // ===== Collect Vue components from 'components' subdirs in node directories

    const dirs = new Set() // set of dirs scanned for components

    async function locateComponents(filename) {
      const dir = path.dirname(filename)
      const componentsDir = path.join(dir, "components")
      if (dirs.has(componentsDir)) return
      dirs.add(componentsDir)
      if (!fs.existsSync(componentsDir)) return
      const files = await fsp.readdir(componentsDir)

      function fileChanged(name, filename) {
        RED.log.info("Creating Vue component '" + name + "' from " + filename)
        createVueComponent(name, filename, fsp.readFile(filename, "utf8"))
          .then(() => {})
          .catch(err => RED.log.error("Error loading Vue template: " + err.stack))
      }

      for (const file of files) {
        if (!file.endsWith(".vue")) continue
        const name = file.replace(/\.vue$/, "")
        if (components[name]) continue // already loaded
        const vueFile = path.join(componentsDir, file)
        fs.watch(vueFile, { persistent: false }, () => fileChanged(name, vueFile))
        fileChanged(name, vueFile)
      }
      // TODO: watch for new files
    }

    // ===== Node-RED plugin registration
    const plugin = { type: "node-red-vue", createVueTemplate }
    RED.plugins.registerPlugin("node-red-vue", plugin)

    const version = require(path.join(__dirname, "package.json")).version
    RED.log.info(`Node-RED Vue version ${version}`)
  } catch (e) {
    console.log(`Error in ${__filename}: ${e.stack}`)
  }
}
