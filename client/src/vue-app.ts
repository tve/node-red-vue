// Vue app factory
// Copyright ©2022-2023 by Thorsten von Eicken, see LICENSE

import { createApp, Component, App } from "vue"
import mitt from "mitt"
import { BusEvents } from "./env"
import { NrNodeRaw, asNrNode } from "/src/node-red"
import EditPanel from "./components/edit-panel.vue"

// Registry of component names to Vue components (default export of the module)
const components: Record<string, Component> = {}

// add a component to our registry
export function addComponent(name: string, component: Component) {
  components[name] = component
}

// Load everything in the components directory into the registry
// async function loadComponent(
//   name: string,
//   modFun: () => Promise<Record<string, Component>>,
//   path: string
// ) {
function loadComponent(name: string, mod: Record<string, Component>, path: string) {
  if ("default" in mod && Object.keys(mod.default).filter(k => !k.startsWith("_")).length > 0) {
    const name = mod.default.name as string
    if (name && name.match(/^[A-Z][A-Z0-9a-z]*$/)) {
      addComponent(name, mod.default)
    } else {
      console.warn(`Default export of ${path} has no/invalid name field`, mod.default)
      //addComponent(name, mod.default)
    }
  }
  for (const name in mod) {
    if (name.match(/^[A-Z][A-Z0-9a-z]*$/)) {
      addComponent(name, mod[name]) // typescript inference snafu...
    }
  }
}
{
  const modules = import.meta.glob<Record<string, Component>>("/src/components/*.vue", {
    eager: true,
  })
  for (const path in modules) {
    const name = path.replace(/.*\/([^/]+)\.vue$/, "$1")
    loadComponent(name, modules[path], path) // .then(() => {}) // launch async
  }
}

// Create a Vue app with all the components registered
export function createVueApp(
  rootComponent: Component,
  rootProps: Record<string, unknown>
): { app: App; $bus: any } {
  const app = createApp(rootComponent, rootProps)
  const $bus = mitt<BusEvents>()
  app.config.globalProperties = {
    $bus,
  }
  console.log("Available components:", Object.keys(components).join(","))
  for (const c in components) {
    app.component(c, components[c])
  }
  return { app, $bus }
}

export function makeComponentName(name: string) {
  name = name.toLocaleLowerCase()
  name = name.replace(/[^_a-z0-9]/g, "-")
  return name
}

// Mount a FlexDash property editing component on an HTML element on the page
export function mountEditApp(nr_obj: NrNodeRaw, el: HTMLElement) {
  const component = "edit-" + makeComponentName(nr_obj._def.type)
  console.log(
    `*** Mounting Vue app ${component} on "#${el.id}" for ${nr_obj.id} type='${nr_obj._def.type}'`,
    nr_obj
  )
  // props for the Vue root component
  const rootProps = {
    node: asNrNode(nr_obj),
    type: nr_obj._def.type,
    component,
    propDefs: (components[component] as Record<string, any>)?.props,
  }

  // create and mount the Vue app
  const { app, $bus } = createVueApp(EditPanel, rootProps)
  app.mount(el)
  return { $bus, unmount: app.unmount }

  // unmounting the vue app when it's parent element gets unmounted is not a good idea because
  // when the flow editor switches between editing a node and a config node it unmounts one
  // without deleting the DOM elements, and then mounts the other. It later swaps back by remounting
  // the previously unmounted elements. (Why doesn't it just hide them???)

  // const redEditorMainId = "red-ui-main-container"
  // const redEditorMain = document.getElementById(redEditorMainId)
  // if (redEditorMain) {
  //   // register a MutationObserver so we can unmount the vue app when the el gets removed
  //   // https://stackoverflow.com/a/45763238/3807231
  //   // first construct list of parents up to redEditorMainId
  //   const parents: Node[] = []
  //   for (let p = el.parentNode; p && !p.isSameNode(redEditorMain); p = p.parentNode) parents.push(p)
  //   // register observer on redEditorMain and watch for removal of any of the parents
  //   const observer = new MutationObserver(mutations => {
  //     mutations.forEach(mutation => {
  //       if (mutation.type !== "childList") return
  //       const r = parents.find(p => Array.from(mutation.removedNodes).some(r => r.isSameNode(p)))
  //       if (r) {
  //         console.log(`Unmounting vue app ${component} for ${nr_obj.id}`)
  //         app.unmount()
  //         observer.disconnect()
  //       }
  //     })
  //   })
  //   observer.observe(redEditorMain, { childList: true, subtree: true })

  //   return { $bus, unmount: () => {} }
  // } else {
  //   console.error(`Vue shim: Could not find RED editor element #${redEditorMainId}`)
  //   return { $bus, unmount: () => setTimeout(app.unmount, 300) }
  // }
}
