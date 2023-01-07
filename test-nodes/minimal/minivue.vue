<template>
  <div class="mt-4 grid grid-cols-[100px,1fr] content-center gap-x-3 gap-y-3">
    <div class="mt-2"><i class="fa fa-tag mr-1" /> Name</div>
    <nr-string-input
      :node="node"
      prop-name="name"
      tip="Name of node in Node-RED, not shown in dashboard." />
  </div>
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
