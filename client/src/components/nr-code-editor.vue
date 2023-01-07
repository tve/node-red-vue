<template>
  <div class="h-full w-full" :id="editorId"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { RED } from "/src/node-red"

export default defineComponent({
  name: "NrCodeEditor",
  props: {
    modelValue: { type: String, required: false },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      sfc_editor: null as any,
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
  },
})
</script>
