<template>
  <nr-props-grid>
    <nr-label icon="fa-tag"> Name</nr-label>
    <nr-string-input
      :modelValue="name"
      @update:modelValue="$emit('update:prop', 'name', $event)"
      tip="Name of node in Node-RED, not shown in dashboard." />
    <div class="mt-2">MQTT broker</div>
    <nr-config-input
      :modelValue="broker"
      @update:modelValue="$emit('update:prop', 'broker', $event)"
      prop-name="broker"
      :configTypes="['mqtt-broker']"
      v-slot="slotProps">
      {{ format_config_node(slotProps.node) }}
    </nr-config-input>
  </nr-props-grid>
</template>

<script>
export default {
  props: {
    name: { default: "my config" },
    broker: { default: "", config_type: "mqtt-broker" },
  },
  node_red: {
    category: "common",
    color: "#F0E4B8",
    // defaults: {
    //   name: { value: "hey config again" },
    //   broker: { value: "", type: "mqtt-broker" },
    // },
    inputs: 0,
    outputs: 1,
    icon: "font-awesome/fa-th",
    label: () => "has config",
  },
  methods: {
    format_config_node(node) {
      const kind = node.kind || node.type
      const name = node.name || node.id
      return `${name} (${kind})`
    },
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
