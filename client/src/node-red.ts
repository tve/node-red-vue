// nodes.ts -- selected definitions and extensions for Node-RED objects and API

import { reactive } from "vue"

export interface NrNodeDef {
  category: string
  type: string
  color?: string
  icon?: string
  inputs?: number
  outputs?: number
  label?: () => string
  labelStyle?: () => string
  paletteLabel?: string
  set?: any // which Node set it belongs to
  defaults: Record<string, any>
  //vue_props_debug: Record<string, Record<string, any>> // injected by us, do not use in code
  oneditprepare?: (this: NrNodeRaw) => void
  oneditsave?: (this: NrNodeRaw) => boolean
  oneditcancel?: (this: NrNodeRaw) => void
  oneditresize?: (this: NrNodeRaw, size: { width: number; height: number }) => void
  //oneditdelete -- not sure who has that, subflows? config nodes?
}

export interface NrNodeRaw {
  id: string // node-red id
  name: string
  type: string
  changed: boolean // true if node props have been changed and need to be saved (deployed)
  dirty: boolean // true if node needs to be redrawn
  valid: boolean // true if all properties pass validation
  z: string // id of parent flow
  outputs: number // number of output ports
  d?: boolean // true if node is disabled
  _def: NrNodeDef
  [key: string]: any // accessing props on the node
}
export interface NrNode extends NrNodeRaw {
  getPropNames: () => string[] // get array of prop names from the node's definition
  prop: (propName: string) => any // get prop value by name
  setEdited: (propName: string, value: any) => void // set prop value for possible saving
  saveEdited: () => void // save edited node and mark it as changed, should be called in oneditsave
  editedProp: (propName: string) => any // get the current (edited or saved) value of a prop
  _edited: Record<string, any> // edited props
  inputId: (propName: string) => string // get the id of the editor pane input element for a prop
  inputValue: (propName: string, newValue?: any) => string // get/set the value of the editor pane input element for a prop
  deleteInput: (propName: string) => void // remove the editor pane input element for a prop
  isConfig(): boolean // true if this is a config node
  _raw: NrNodeRaw // get the raw node to pass back to Node-RED
  _editState: Record<string, any> // state for oneditprepare, oneditsave, onedit... methods
}

// convert a play Node-RED Node to one for our purposes by adding some convenient methods
// if this gets out of hand should use a different mix-in approach, see
// https://dzone.com/articles/fresh-look-javascript-
// TODO: should we make the whole node object reactive? that would give us a distinct object too...
export function asNrNode(rawNode: NrNodeRaw): NrNode {
  const node = rawNode as NrNode
  node._edited = reactive({}) // reactive so views can update when edited props change
  // get the list of properties defined
  node.getPropNames = () => Object.keys(node._def.defaults)
  // get a property value dealing with typescript...
  node.prop = propName => (node as Record<string, any>)[propName]
  // get the current value of a prop, either edited or saved
  node.editedProp = propName =>
    propName in node._edited ? node._edited[propName] : node.prop(propName)
  // accumulate an editing change to a prop
  node.setEdited = (propName, value) => (node._edited[propName] = value)
  // is this a config node?
  node.isConfig = () => node._def.category === "config"
  // get the raw node to pass back to Node-RED
  node._raw = rawNode

  // save the edited props and mark the node as changed if values have changed
  node.saveEdited = () => {
    const editedKeys = Object.keys(node._edited)
    const changed = editedKeys.some(p => node._edited![p] !== node.prop(p))
    if (changed) {
      // update the "users" field of any config nodes that have changed
      for (const propName of editedKeys) {
        if (!node._def.defaults[propName]?.type) continue // not a config node
        const oldConfigId = node.prop(propName)
        const newConfigId = node._edited[propName]
        if (oldConfigId == newConfigId) continue // no change
        const oldConfig = RED.nodes.node(oldConfigId)
        if (oldConfig) {
          // remove this node from the old config node
          const ix = oldConfig.users.indexOf(node)
          if (ix >= 0) {
            oldConfig.users.splice(ix, 1)
            RED.events.emit("nodes:change", oldConfig)
          }
        }
        const newConfig = RED.nodes.node(newConfigId)
        if (newConfig) {
          // add this node to the new config node
          newConfig.users.push(node)
          RED.events.emit("nodes:change", newConfig)
        }
      }
      // copy the new values into the node
      //console.log("Old values:", Object.keys(node).join(","))
      Object.assign(node, node._edited)
      node._edited = reactive({})
      node.changed = true
      //console.log("New values:", Object.keys(node).join(","))
      RED.nodes.dirty(true) // has to be redrawn to get blue circle
    }
    // remove all node-red input elements so NR doesn't save over us
    node.getPropNames().forEach(p => node.deleteInput(p))
  }

  node.inputId = (propName: string) => {
    return (node.isConfig() ? " node-config-input-" : "node-input-") + propName
  }

  // get or set the value of the original node-red input element
  node.inputValue = (propName: string, newValue?: any) => {
    // FIXME: need to pass configNode somewhere somehow
    const el = document.getElementById(node.inputId(propName)) as HTMLInputElement
    if (newValue !== undefined) {
      if (el) el.value = newValue
      return newValue
    }
    return el?.value
  }

  // remove the original node-red input element
  node.deleteInput = (propName: string) => {
    const el = document.getElementById(node.inputId(propName))
    if (el) el.remove()
  }

  return node
}

// remove the fields and methods we added to a node  TODO: how to improve this?
export function cleanNrNode(node: NrNode) {
  const rawNode = node as Record<string, any>
  delete rawNode._edited
  delete rawNode.getPropNames
  delete rawNode.prop
  delete rawNode.editedProp
  delete rawNode.setEdited
  delete rawNode.saveEdited
  delete rawNode.inputId
  delete rawNode.inputValue
}

// ======= Node-RED API

// API provided by RED.nodes.registry
interface REDNodesRegistry {
  getNodeTypes(): string[]
  getNodeType(type: string): NrNodeDef
}
// API provided by RED.nodes
interface REDNodes {
  node(id: string): NrNodeRaw
  eachConfig(cb: (node: NrNodeRaw) => void): void
  getType(type: string): NrNodeDef // same as registry.getNodeType
  registry: REDNodesRegistry
  dirty: (dirty: boolean) => void // tell NR that some nodes are dirty and thus a redraw is needed
  registerType(name: string, def: NrNodeDef): void
}
// API provided by RED.editor
interface REDEditor {
  validateNode(node: NrNodeRaw): void
  createEditor(options: Record<string, any>): any
  editConfig(
    propName: string,
    configNodeType: string,
    configNodeId: string,
    inputPrefix: string,
    callingNode: NrNodeRaw
  ): void
}
// API provided by RED.events
interface REDEvents {
  on(event: string, cb: (...args: any[]) => void): void
  off(event: string, cb: (...args: any[]) => void): void
  emit(event: string, ...args: any[]): void
}
// API provided by RED.plugins
interface REDPlugins {
  registerPlugin(name: string, plugin: Record<string, any>): void
}
// API provided by RED.comms
interface REDComms {
  subscribe(topic: string, cb: (topic: string, object: any) => void): void
}

declare global {
  var RED: {
    nodes: REDNodes
    editor: REDEditor
    events: REDEvents
    plugins: REDPlugins
    comms: REDComms
  }
  function $(...args: any[]): any
}

export const RED = window.RED
export const $ = window.$
