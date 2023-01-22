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
      const prefix = node?.isConfig() ? "node-input-config" : "node-input"
      RED.editor.editConfig(this.propName, configType, "_ADD_", prefix, node?._raw)
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

    // onNodeAdded: a new config node was added to Node-RED, may need to update our select
    onNodeAdded(node: NrNodeRaw) {
      if (!node || !this.configTypes.includes(node._def.type)) return
      this.configNodes.push(node)
      this.configNodes.sort((a, b) => a.name.localeCompare(b.name))
      this.selected = node.id
      console.log("Added config node", node.name)
    },
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
