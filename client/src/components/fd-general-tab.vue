<template>
  <div class="mt-4 grid grid-cols-[100px,1fr] content-center gap-x-3 gap-y-3">
    <div class="mt-2"><i class="fa fa-tag mr-1" /> Name</div>
    <nr-string-input
      :modelValue="node.name"
      @update:modelValue="$emit('update:prop', 'name', $event)"
      tip="Name of node in Node-RED, not shown in dashboard." />

    <div class="mt-2">Container</div>
    <nr-config-input
      :modelValue="node.fd_container"
      @update:modelValue="$emit('update:prop', 'fd_container', $event)"
      prop-name="fd_container"
      :configTypes="['flexdash container']"
      tip="Dashboard Grid or Panel in which widget is shown."
      v-slot="slotProps">
      {{ format_config_node(slotProps.node) }}
    </nr-config-input>

    <div class="mt-2">Size</div>
    <nr-input-tip tip="Widget dimensions in grid units.">
      <div class="flex">
        <div class="mt-2 mr-2">Rows</div>
        <nr-number-input
          :modelValue="node.fd_rows"
          @update:modelValue="$emit('update:prop', 'fd_rows', $event)" />
        <div class="mt-2 mr-2 ml-6">Columns</div>
        <nr-number-input
          :modelValue="node.fd_cols"
          @update:modelValue="$emit('update:prop', 'fd_cols', $event)" />
      </div>
    </nr-input-tip>

    <hr class="col-span-2" />

    <div class="mt-2">Widget Array</div>
    <nr-checkbox-input
      :modelValue="node.fd_array"
      @update:modelValue="$emit('update:prop', 'fd_array', $event)"
      tip="Generate an array of widgets based on distinct msg.topic values." />

    <div class="mt-2">Max widgets</div>
    <nr-number-input
      :modelValue="node.fd_array_max"
      @update:modelValue="$emit('update:prop', 'fd_array_max', $event)"
      tip="Prevent run-away arrays by limiting the max number of widgets generated." />

    <hr class="col-span-2" />

    <div class="mt-2">Output topic</div>
    <nr-string-input
      v-if="!node.editedProp('fd_array')"
      :modelValue="node.output_topic"
      @update:modelValue="$emit('update:prop', 'output_topic', $event)"
      tip="Optional string to output in `msg.topic`" />
    <div v-else class="mt-2">
      <span class="font-mono text-yellow-900">msg.topic</span>
      is set to the topic of the array element producing the message.
    </div>

    <div class="mt-2">Loopback</div>
    <nr-checkbox-input
      :modelValue="node.fd_loopback"
      @update:modelValue="$emit('update:prop', 'fd_loopback', $event)"
      tip="Loop `msg.payload` node output back to its input." />

    <hr class="col-span-2" />
    <div class="col-span-2 ml-auto text-sm">Node ID: {{ node.id }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue"
import type { NrNode } from "/src/node-red"
import { NrStringInput, NrNumberInput, NrCheckboxInput, NrInputTip } from "./nr-inputs.vue"
import NrConfigInput from "./nr-config-input.vue"

export default defineComponent({
  name: "FdGeneralTab",
  components: { NrInputTip, NrStringInput, NrNumberInput, NrCheckboxInput, NrConfigInput },
  emits: ["update:prop"],
  setup() {
    return { node: inject("node") as NrNode }
  },
  data() {
    return {
      props: {} as any,
    }
  },
  methods: {
    format_config_node(node: { kind?: string; type: string; name: string; id: string }) {
      const kind = node.kind || node.type
      const name = node.name || node.id
      return `${name} (${kind})`
    },
  },
})
</script>
