<template>
  <nav class="flex flex-row border-b border-solid border-neutral-300 pr-2">
    <a
      v-for="(tab, ix) in tabs"
      key="tab"
      @click.prevent="$emit('update:modelValue', ix)"
      href="#"
      :class="classes[ix]">
      {{ tab }}
    </a>
  </nav>
</template>

<style scoped lang="postcss">
.tw-root.tw-root a {
  @apply mx-1 inline-block grow px-2 py-1;
  @apply rounded-t border border-b-0 border-solid border-neutral-300;
  @apply bg-neutral-100 hover:bg-neutral-200;
}
.tw-root.tw-root a.selected {
  @apply relative -bottom-px border-b-0;
  @apply bg-white;
}
</style>

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
    classes(): string[] {
      return this.tabs.map((t, ix) => (this.modelValue === ix ? "selected" : ""))
    },
  },
})
</script>
