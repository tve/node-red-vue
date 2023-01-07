<template>
  <component :is="component" v-bind="props" @update:prop="onUpdateProp" />
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue"
import type { NrNode } from "/src/node-red"

export default defineComponent({
  name: "EditPanel",
  props: {
    node: { type: Object as PropType<NrNode>, required: true },
    component: { type: String, required: true },
  },
  provide() {
    return { node: this.node }
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
    for (const propName of propNames) {
      // handle props that refer to config nodes specially
      if (defaults[propName].type) {
        const configTypeDef = RED.nodes.getType(defaults[propName].type)
        if (configTypeDef && configTypeDef.category == "config") {
          // NR code has something undocumented about configTypeDef.exclusive...
          this.observe(propName)
        }
      }
      // initial value
      this.props[propName] = this.node[propName]
    }
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
    },
  },
})
</script>
