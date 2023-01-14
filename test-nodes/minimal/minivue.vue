<template>
  <nr-props-grid>
    <nr-label icon="fa fa-tag mr-1"> Name</nr-label>>
    <nr-string-input
      :node="node"
      prop-name="name"
      tip="Name of node in Node-RED, not shown in dashboard." /> </nr-props-grid
  >>
</template>

<script>
export default {
  props: {
    name: { default: "my minivue" },
    node: { default: null },
  },
  node_red: {
    category: "common",
    color: "#F0E4B8",
    inputs: 0,
    outputs: 1,
    icon: "font-awesome/fa-th",
    label: () => "minivue",
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
