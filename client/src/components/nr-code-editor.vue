<!-- Component embedding a monaco editor, useful for code panels among others.
     Copyright ©2023 by Thorsten von Eicken, see LICENSE
-->

<template>
  <div
    :class="[
      'flex-grow:1 flex-shrink:1 w:full',
      '{border:1|solid|gray-70}_.red-ui-editor-text-container',
    ]"
    :id="editorId"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { RED } from "/src/node-red"

export default defineComponent({
  name: "NrCodeEditor",
  props: {
    modelValue: { type: String, required: false }, // text to be edited
  },
  emits: ["update:modelValue"],
  inject: ["$bus"],
  setup() {
    return {
      sfc_editor: null as any, // must be non-reactive or sfc_editor.destroy hangs
    }
  },
  computed: {
    editorId() {
      return `code-editor-` + Math.random().toString(36).substring(2, 11)
    },
  },
  mounted() {
    // set-up source code editor
    this.sfc_editor = RED.editor.createEditor({
      id: this.editorId,
      mode: "ace/mode/vue",
      value: this.modelValue || "",
      minimap: { enabled: false },
    })
    this.$bus.on("save", () => {
      this.$emit("update:modelValue", this.sfc_editor.getValue())
    })
  },
  beforeUnmount() {
    // clean-up source code editor
    this.sfc_editor.destroy()
    // skip removing $bus handler: PITA & the bus gets desroyed anyway
  },
})
</script>
