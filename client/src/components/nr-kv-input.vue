<!-- NrInputKV -- Node-Red input field for key-value pairs 
     FIXME: currently limited to values being strings, should use a slot for values
-->

<template>
  <div class="mt:1ex flex flex:col w:full min-w:0">
    <nr-fmt-tip :tip="tip" />
    <div v-for="(r, ix) in rows" :key="r[0]" class="my:1ex mt:1ex flex jc:space-between">
      <input
        type="text"
        :value="r[0]"
        @change="onUpdateKey(ix, $event)"
        class="mr:1ex min-w:10ex flex-shrink:1 flex-grow:1 flex-basis:16 px:1ex" />
      <i class="fa fa-long-arrow-right mt:1ex mr:1ex flex-grow:0" />
      <input
        type="text"
        :value="r[1]"
        @change="onUpdateValue(ix, $event)"
        class="mr:1ex min-w:20ex flex-shrink:1 flex-grow:3 flex-basis:32 px:1ex" />
      <button class="w:5ex flex-grow:0 r:4 b:solid|1|gray-78" @click="onDeleteRow(ix)">
        <i class="fa fa-minus" />
      </button>
    </div>
    <button class="my:1ex h:34px w:5ex r:4 b:solid|1|gray-78" @click="onAddRow()">
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
