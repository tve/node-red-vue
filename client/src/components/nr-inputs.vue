<script lang="ts">
// Node-RED input helpers. These helpers create an HTML <input> element in Vue that gets
// displayed and interacted with by the user. They expect to find a corresponding "original"
// Node-RED input element from which the value is copied at the outset.
// Edited values are saved in a `_edited` property of the node object. Thise properties of
// `_edited` should be copied back into the node on save. This is not done in these helpers
// though.
// Note that the path through `_edited`
//

// and to which all
// changes are relayed. This way, when the edit pane closes the original NR elements have
// the changed values and can be consumed by the editor framework. This is the same strategy
// as used by the TypedInput widget.
// This file/module contains a number of Vue components, this is possible by writing the
// components in pure js using a render function, i.e., no template.
// Many of these components are "funcational components" (have no internal state) but somehow
// using FunctionalComponent<type> isn't working out well here...

import { defineComponent, h, withModifiers } from "vue"

// change the type of target so we can fetch the value
// interface InputEvent extends Event {
//   target: HTMLInputElement
// }

// format a tip string in small font and with text between backticks in monospace font
function NrFmtTip(tip: string | undefined, classes?: string) {
  if (!tip) return ""
  // hacky back-tick conversion: split on back-ticks, then alternate between
  // plain and monospace elements
  let tip_parts: any[] = tip.split("`")
  tip_parts = tip_parts.map((t, i) =>
    i % 2 ? h("span", { class: "font-mono text-yellow-900" }, t) : t
  )
  return h("div", { class: "text-sm " + (classes || "") }, tip_parts)
}
export { NrFmtTip }

// ===== NrInputTip component

// format an input (or arbitrary elements) passed in the default slot with
// a tip string underneath.
const NrInputTip = defineComponent({
  name: "NrInputTip",
  props: {
    tip: { type: String, required: false },
  },
  setup:
    (props, { slots }) =>
    () => {
      return h("div", { class: "flex flex-col" }, [
        slots.default && slots.default(),
        NrFmtTip(props.tip),
      ])
    },
})
export { NrInputTip }

// ===== NrStringInput component

// Produce a string/text input element that is a proxy for a Node-RED node-input-xxx element
// The initial value is populated from the NR element and changes are relayed to the NR element.
const NrStringInput = defineComponent({
  name: "NrStringInput",
  props: {
    modelValue: { type: String, required: false },
    tip: { type: String, required: false },
  },
  emits: ["update:modelValue"],
  setup:
    (props, { attrs, emit }) =>
    () =>
      h(NrInputTip, { tip: props.tip || "" }, () => [
        h("input", {
          type: "text",
          value: props.modelValue,
          class: "px-2",
          onInput: withModifiers(
            (ev: InputEvent) => {
              const target = ev.target as HTMLInputElement
              emit("update:modelValue", target?.value)
            },
            ["prevent"]
          ),
          ...attrs,
        }),
      ]),
})
export { NrStringInput }

// ===== NrNumberInput component

// Produce a number input element that is a proxy for a Node-RED node-input-xxx element
// The initial value is populated from the NR element and changes are relayed to the NR element.
// Changes relayed are converted to Number or null if the input is not a number.
const NrNumberInput = defineComponent({
  name: "NrNumberInput",
  props: {
    modelValue: { type: Number, required: false },
    tip: { type: String, required: false },
  },
  setup:
    (props, { emit }) =>
    () => {
      return h(NrInputTip as any, { tip: props.tip }, () => [
        h("input", {
          type: "number",
          value: props.modelValue,
          class: "px-2 w-24",
          onInput: withModifiers(
            (ev: InputEvent) => {
              const target = ev.target as HTMLInputElement
              const stringVal = target?.value
              const numVal = Number(stringVal)
              emit("update:modelValue", isNaN(numVal) ? null : numVal)
            },
            ["prevent"]
          ),
          //...props,
        }),
      ])
    },
})
export { NrNumberInput }

// ===== NrCheckboxInput component

// Produce a number input element that is a proxy for a Node-RED node-input-xxx element
// The initial value is populated from the NR element and changes are relayed to the NR element.
// Changes relayed are converted to boolean.
const NrCheckboxInput = defineComponent({
  name: "NrCheckboxInput",
  props: {
    modelValue: { type: Boolean, required: false },
    tip: { type: String, required: false },
  },
  setup:
    (props, { emit }) =>
    () => {
      return h("div", { class: "flex flex-row" }, [
        h("input", {
          type: "Checkbox",
          checked: !!props.modelValue,
          class: "mt-2",
          onInput: withModifiers(
            (ev: InputEvent) => {
              const target = ev.target as HTMLInputElement
              emit("update:modelValue", target?.checked)
            },
            ["prevent"]
          ),
          ...props,
        }),
        NrFmtTip(props.tip, "mt-2 ml-4"),
      ])
    },
})
export { NrCheckboxInput }

// ===== NrPropGrid component

// Simple grid for properties panel: 2 columns, left being narrower for labels
const NrPropsGrid = defineComponent({
  name: "NrPropsGrid",
  setup:
    (props, { slots }) =>
    () => {
      return h("div", { class: "mt-4 grid grid-cols-[100px,1fr] content-center gap-x-3 gap-y-3" }, [
        slots.default && slots.default(),
      ])
    },
})
export { NrPropsGrid }

// ===== NrLabel component

// Place label (short string + optional icon) in a NrPropsGrid cell, typ left column
const NrLabel = defineComponent({
  name: "NrLabel",
  props: {
    icon: { type: String, required: false },
  },
  setup:
    (props, { slots }) =>
    () => {
      return h("div", { class: "flex flex-row mt-2" }, [
        props.icon && h("i", { class: "fa mr-1 " + props.icon }),
        slots.default && slots.default(),
      ])
    },
})
export { NrLabel }

// hack so Vite doesn't create syntax error due to function exports
const _ = {}
export default _
</script>
