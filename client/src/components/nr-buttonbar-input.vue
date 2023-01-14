<!-- NrButtonBarInput -- Node-Red input field showing a row of buttons to select one from  
-->

<template>
  <nr-input-tip :tip="tip">
    <div class="flex">
      <button
        v-for="o in opts"
        :key="o[0]"
        :class="[
          'px:1ex h:34px by:solid|1|gray-78 bl:solid|1|gray-78', // base formatting
          'rl:4:first rr:4:last br:solid|1|gray-78:last', // rounded corners
          { 'bg:gray-90': o[0] == modelValue }, // highlight selected button
        ]"
        @click="$emit('update:modelValue', o[0])">
        {{ o[1] }}
      </button>
    </div>
  </nr-input-tip>
</template>

<style scoped lang="postcss"></style>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: "NrButtonbarInput",
  props: {
    modelValue: { type: String, default: "" },
    options: { type: Array, required: true },
    tip: { type: String, required: false },
  },
  emits: ["update:modelValue"],
  computed: {
    // Convert options to [value,label] pairs
    opts(): [string, string][] {
      return this.options.map(o => (Array.isArray(o) ? o : [o, o])) as [string, string][]
    },
  },
})
</script>
