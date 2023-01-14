<template>
  <nr-props-grid>
    <nr-label icon="fa fa-tag mr-1"> Name</nr-label>
    <nr-string-input
      :modelValue="name"
      @update:modelValue="$emit('update:prop', 'name', $event)"
      tip="Name of config node in Node-RED." />
  </nr-props-grid>
</template>

<script>
export default {
  props: {
    name: { default: "my config" },
  },
  node_red: {
    category: "config",
    label: () => "myconfig",
  },
}
</script>
