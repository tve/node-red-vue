<template>
  <nav class="flex flex:row bb:solid|1|gray-60 pr:2ex mb:1ex">
    <a
      v-for="(tab, ix) in tabs"
      key="tab"
      @click.prevent="$emit('update:modelValue', ix)"
      href="#"
      :selected="selected[ix]"
      :class="[
        'inline-block flex:1 mx:1ex px:2ex py:6 rt:0.5ex',
        'border:0.5|solid|gray-78 bb:0 bg:gray-95',
        '{bg:white;mb:-1px}.selected',
        { selected: selected[ix] },
      ]"
      xclass="{relative;bg:white;bottom:-1px}.active">
      {{ tab }}
    </a>
  </nav>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: "NrTabs",
  props: {
    tabs: { type: Array, required: true },
    modelValue: { type: Number, required: true },
  },
  emits: ["update:modelValue"],
  computed: {
    selected(): boolean[] {
      return this.tabs.map((t, ix) => this.modelValue === ix)
    },
  },
})
</script>
