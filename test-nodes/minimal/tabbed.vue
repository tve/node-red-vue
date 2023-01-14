<template>
  <div class="flex:col h:full">
    <nr-tabs :tabs="['General', 'Code', 'Config']" v-model="tab" />
    <!-- General tab -->
    <fade-in-out>
      <fd-general-tab v-show="tab === 0" class="general-tab bg:blue-80" />
    </fade-in-out>

    <!-- Widget Code tab -->
    <fade-in-out>
      <nr-code-editor v-show="tab === 1" class="code-tab flex:1" :modelValue="code" />
    </fade-in-out>

    <!-- Config tab -->
    <fade-in-out>
      <div v-show="tab === 2" class="config-tab w:full pt:2ex bg:red-80">
        <nr-props-grid>
          <nr-label>Title</nr-label>
          <nr-string-input
            :modelValue="title"
            tip="Text to display in the widget header. Change using `msg.title`." />

          <nr-label>Import Map</nr-label>
          <nr-kv-input
            :modelValue="import_map"
            tip="Map of import specifier to URL for the resolution of import statements." />
        </nr-props-grid>
      </div>
    </fade-in-out>
  </div>
</template>

<script>
import { defineComponent, h, Transition } from "vue"

const FadeInOut = (_props, context) =>
  h(
    Transition,
    {
      "leave-active-class": "~duration:1000ms abs", // switch to absolute so both can be ...
      "enter-active-class": "~duration:1000ms abs", // in the same spot at the same time
      "enter-from-class": "opacity:0",
      "leave-to-class": "opacity:0",
      // "leave-active-class": "dur-1000", // "~duration:1000ms", // switch to absolute so both can be ...
      // "enter-active-class": "dur-1000", // "~duration:1000ms", // in the same spot at the same time
      // "enter-from-class": "opa-0", //"opacity:0",
      // "leave-to-class": "opa-0", //"opacity:0",
    },
    context.slots?.default ? context.slots.default : []
  )

export default {
  props: {
    name: { default: "my tabbed" },
    title: { type: String, required: false },
    import_map: { type: Object, required: false },
    code: { type: String, required: false },
    // required fields for FlexDash Widget nodes
    fd_container: { default: "", config_type: "flexdash container", required: true }, // grid/panel
    fd_cols: { default: 1, type: Number }, // widget width
    fd_rows: { default: 1, type: Number }, // widget height
    fd_array: { default: false, type: Boolean }, // create array of this widget
    fd_array_max: { default: 10, type: Number }, // max array size
  },
  data: () => ({
    tab: 0,
  }),
  components: { FadeInOut },

  node_red: {
    category: "common",
    color: "#F0E4B8",
    inputs: 0,
    outputs: 1,
    icon: "font-awesome/fa-th",
    label: () => "tabbed",
  },
}
</script>

<!--
<script type="text/html" data-template-name="xyz">
  <div class="form-row">
    <label for="node-input-name"><i class="fa fa-tag"></i> Name</label>
    <input type="text" id="node-input-name" placeholder="Name" />
  </div>
</script>

<script type="text/html" data-help-name="xyz">
  <p>Hello</p>
</script>
-->
