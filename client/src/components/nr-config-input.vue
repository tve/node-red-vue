<!-- NrInputConfig -- Node-RED input component to select a config node
-->

<template>
  <nr-input-tip :tip="tip">
    <div class="flex w:full">
      <select class="flex:1 border:1|solid|gray-78 px:1ex w:0 flex:1" @input.prevent="onInput">
        <option value="">--</option>
        <option
          v-for="config in configNodes"
          :key="config.id"
          :value="config.id"
          :selected="config.id == selected">
          <slot :nodeName="config.name" :node="config" />
        </option>
      </select>
      <button
        class="ml:2ex mr:1ex w:5ex r:4 border:1|solid|gray-78"
        :disabled="!configSelected"
        @click="onEdit">
        <i class="fa fa-pencil" />
      </button>
      <button class="w:5ex r:4 border:1|solid|gray-78" @click="onAdd">
        <i class="fa fa-plus" />
      </button>
      <!-- hidden elements for Node-RED to populate with any change -->
      <button :id="niPrefix + '-edit-' + propName" class="hidden" />
      <input :id="niPrefix + '-' + propName" class="hidden" type="text" ref="nrInput" />
    </div>
  </nr-input-tip>
</template>

<script lang="ts">
import { defineComponent, PropType, inject } from "vue"
import { NrNode, NrNodeRaw, RED } from "/src/node-red"

export default defineComponent({
  name: "NrConfigInput",
  props: {
    modelValue: { type: String, required: true },
    propName: { type: String, required: true },
    configTypes: { type: Array as PropType<string[]>, required: true },
    tip: { type: String, required: false },
  },
  emits: ["update:modelValue"],
  setup() {
    return { node: inject<NrNode>("node") }
  },
  data: () => ({
    configNodes: [] as NrNodeRaw[],
    selected: "",
  }),

  computed: {
    configSelected(): NrNodeRaw | undefined {
      return this.configNodes.find(n => n.id == this.selected)
    },
    niPrefix(): string {
      const node = this.node as NrNode
      return node?.isConfig() ? "node-input-config" : "node-input"
    },
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(val: string) {
        this.selected = val
      },
    },
  },

  mounted(): void {
    // round-up all config nodes of the requested types
    this.configNodes = []
    RED.nodes.eachConfig(n => {
      if (this.configTypes.includes(n.type) && !n.d) this.configNodes.push(n)
    })
    this.configNodes.sort((a, b) => a.name.localeCompare(b.name))
    RED.events.on("nodes:add", this.onNodeAdded)
    RED.events.on("nodes:change", this.onNodeChanged)
    this.selected = this.modelValue
    // get a callback when the flow editor changes the nrInput
    this.observe(this.$refs.nrInput as any, this.onNRChange)
  },
  unmounted(): void {
    RED.events.off("nodes:add", this.onNodeAdded)
    RED.events.off("nodes:change", this.onNodeChanged)
  },

  methods: {
    // onInput: the user selected something in that select drop-down
    onInput(ev: Event): void {
      const target = ev.target as HTMLInputElement
      if (target) {
        const val = target.value
        this.$emit("update:modelValue", val)
      }
    },

    // onAdd: add button, need to cause the flow editor to open the add config node dialog
    onAdd(ev: Event): void {
      const configType = this.configTypes[0]
      if (!RED.nodes.getType(configType)) {
        console.warn("No config node type " + configType + " found")
        return
      }
      const node = this.node as NrNode
      RED.editor.editConfig(this.propName, configType, "_ADD_", this.niPrefix, node?._raw)
    },

    // onEdit button, need to cause the flow editor to open the edit config node dialog
    onEdit(ev: Event): void {
      if (!this.configSelected) return // button should be disabled, but...
      const configType = this.configSelected.type
      if (!RED.nodes.getType(configType)) {
        console.warn("No config node type " + configType + " found")
        return
      }
      const node = this.node as NrNode
      const prefix = node?.isConfig() ? "node-input-config" : "node-input"
      RED.editor.editConfig(this.propName, configType, this.selected, prefix, node?._raw)
    },

    // the input was changed by the flow-editor, this happens when the user adds a new config node
    onNRChange(val: any): void {
      this.$emit("update:modelValue", val)
    },

    // observe when an input element's value is assigned in javascript
    // https://stackoverflow.com/a/48528450/3807231
    observe(el: HTMLElement, callback: (value: any) => void): void {
      var descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")

      Object.defineProperty(el, "value", {
        set: function (newVal: any) {
          callback(newVal)
          descriptor!.set!.apply(this, [newVal])
        },
        get: descriptor!.get,
      })
    },

    // onNodeAdded: a new config node was added to Node-RED, may need to update our drop-down
    // list of selectable config nodes
    onNodeAdded(node: NrNodeRaw) {
      if (!node || !this.configTypes.includes(node._def.type)) return
      this.configNodes.push(node)
      this.configNodes.sort((a, b) => a.name.localeCompare(b.name))
    },

    // onNodeChanged: a config node was changed, this may affect how we display the drow-down
    // list, e.g., the name of a node may have changed
    onNodeChanged(node: NrNodeRaw) {
      if (!node || !this.configTypes.includes(node._def.type)) return
      const reactiveNode = this.configNodes.findIndex(n => n.id == node.id)
      if (reactiveNode >= 0) {
        // ugly hack: because the node is updated from outside of Vue (more specifically, without
        // traversing any reactivity proxy) we need to force Vue to notice the change.
        this.configNodes[reactiveNode] = null!
        this.configNodes[reactiveNode] = node
        this.configNodes.sort((a, b) => a.name.localeCompare(b.name))
      }
    },
  },
})
</script>
