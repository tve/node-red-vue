<template>
  <component :is="component" v-bind="{ ...props, ...$attrs }" @update:prop="onUpdateProp" />
  <div class="abs right:-2ex top:-2ex fg:grass-90 f:70%">V</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue"
import type { NrNode } from "/src/node-red"

export default defineComponent({
  name: "EditPanel",
  props: {
    node: { type: Object as PropType<NrNode>, required: true }, // node to edit
    component: { type: String, required: true }, // name of component for the edit pane
    // "props" object of the component, so we can figure out the intended types of the props
    propDefs: { type: Object as PropType<Record<string, any>>, required: false },
  },
  provide() {
    return { node: { ...this.node, props: this.props } }
  },
  data() {
    return {
      props: {} as Record<string, any>,
      observers: [] as MutationObserver[],
    }
  },
  created() {
    const defaults = this.node._def.defaults
    const propNames = Object.keys(defaults)
    const conversions = []
    for (const propName of propNames) {
      // handle props that refer to config nodes specially
      if (defaults[propName].type) {
        const configTypeDef = RED.nodes.getType(defaults[propName].type)
        if (configTypeDef && configTypeDef.category == "config") {
          // NR code has something undocumented about configTypeDef.exclusive...
          this.observe(propName)
        }
      }
      // initial value: convert strings to correct types 'cause NR typ has everything as strings
      const tgtType = this.propDefs?.[propName]?.type
      if (
        typeof this.node[propName] === "string" &&
        tgtType &&
        typeof tgtType === "function" &&
        tgtType.name != String
      ) {
        conversions.push(`${propName} to ${tgtType.name}`)
        this.props[propName] = tgtType(this.node[propName])
      } else {
        this.props[propName] = this.node[propName]
      }
    }
    if (conversions.length > 0) console.log(`Converted ${conversions.join(", ")}`)
  },
  unmounted() {
    for (const observer of this.observers) observer.disconnect()
    this.observers = []
  },
  methods: {
    // for props that refer to config nodes we need to observe the select options created by
    // Node-RED 'cause that's what gets update if the user changes the config node...
    observe(propName: string): void {
      const inputId = (this.node.isConfig() ? "node-input-config-" : "node-input-") + propName
      const inputEl = document.getElementById(inputId)
      if (!inputEl) return
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.addedNodes?.forEach(node => {
            // a new option may have gotten added
            if (node instanceof HTMLOptionElement && node.selected) {
              // an option got selected, update the prop
              const val = node?.value
              if (val && this.props[propName] != val) {
                this.props[propName] = val
                this.node.setEdited(propName, val)
              }
            }
          })
        })
      })
      observer.observe(inputEl, { subtree: true, childList: true })
      this.observers.push(observer)
    },

    onUpdateProp(propName: string, val: any): void {
      this.node.setEdited(propName, val)
      this.props[propName] = val
    },
  },
})
</script>
