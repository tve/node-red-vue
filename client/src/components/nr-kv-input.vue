<!-- NrInputKV -- Node-Red input field for key-value pairs 
     FIXME: currently limited to values being strings, should use a slot for values
-->

<template>
  <div class="mt-3 flex w-full min-w-0 flex-col">
    <nr-fmt-tip :tip="tip" />
    <div v-for="(r, ix) in rows" :key="r[0]" class="my-2 mt-2 flex justify-between">
      <input
        type="text"
        :value="r[0]"
        @change="onUpdateKey(ix, $event)"
        class="mr-2 min-w-[6em] shrink grow basis-16 px-2" />
      <i class="fa fa-long-arrow-right mt-2 mr-2 grow-0" />
      <input
        type="text"
        :value="r[1]"
        @change="onUpdateValue(ix, $event)"
        class="mr-2 min-w-[12em] shrink grow-[3] basis-32 px-2" />
      <button class="w-8 grow-0 rounded border border-neutral-300" @click="onDeleteRow(ix)">
        <i class="fa fa-minus" />
      </button>
    </div>
    <button class="my-2 h-[34px] w-10 rounded border border-neutral-300" @click="onAddRow()">
      <i class="fa fa-plus" />
    </button>
  </div>
</template>

<style scoped lang="postcss"></style>

<script lang="ts">
import { defineComponent, h } from "vue"
import { NrFmtTip } from "/src/components/nr-inputs.vue"

const nrFmtTip = defineComponent({
  name: "NrFmtTip",
  props: {
    tip: { type: String, required: false },
  },
  setup(props) {
    return () => (props.tip ? h("div", { class: "text-xs text-neutral-500" }, props.tip) : null)
  },
})

export default defineComponent({
  name: "NrKvInput",
  components: { nrFmtTip },
  props: {
    modelValue: { type: Object, default: {} },
    tip: { type: String, required: false },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      // represent the data as an array of 2-tuples so we can control the order
      rows: [] as [string, string][],
    }
  },
  mounted(): void {
    try {
      var val = this.modelValue as any
      if (typeof val === "string") {
        // FIXME: do we really want/need this conversion?
        if (val && val.trim().startsWith("{")) {
          const kv = JSON.parse(val)
          this.rows = Object.entries(kv)
          console.log(`Converted KV from string "${val}""`)
        } else {
          console.warn(`Invalid value for prop '${val}':`, val)
        }
      } else if (typeof val === "object") {
        this.rows = Object.entries(val)
      } else {
        console.warn(`Invalid value for prop '${val}':`, val)
      }
    } catch (err) {
      console.error(`Failed to parse JSON value for prop '${val}':`, val)
    }

    // register onSave so we can save the data to the node props
    // this.$bus.on("onSave", () => {
    //   const kv = Object.fromEntries(this.rows)
    //   console.log("onSave", kv)
    //   ;(this.node as Record<string, any>)[this.propName] = kv
    // })
  },
  methods: {
    onUpdateValue(ix: number, ev: Event): void {
      console.log("onUpdateValue", ix, EvalError)
      const target = ev.target as HTMLInputElement
      this.rows[ix][1] = target.value
      this.$emit("update:modelValue", Object.fromEntries(this.rows))
    },
    onUpdateKey(ix: number, ev: Event): void {
      console.log("onUpdateKey", ix, ev)
      const target = ev.target as HTMLInputElement
      this.rows[ix][0] = target.value
      this.$emit("update:modelValue", Object.fromEntries(this.rows))
    },
    onDeleteRow(ix: number): void {
      console.log("onDeleteRow", ix)
      this.rows.splice(ix, 1)
      this.$emit("update:modelValue", Object.fromEntries(this.rows))
    },
    onAddRow(): void {
      console.log("onAddRow")
      this.rows.push(["", ""])
      this.$emit("update:modelValue", Object.fromEntries(this.rows))
    },
  },
})
</script>
