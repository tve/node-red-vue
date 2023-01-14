# Node-RED Vue

Write Node-RED node templates in Vue.js.
Node templates implement the "Properties" pane when editing a node in the flow editor.
The standard way to write them is by placing a `<node-name>.html`
file in the directory with the node's `.js` file, and to write a bunch of raw HTML and JS in thet
file to implement the editing pane.
Node-RED Vue replaces this with a`.vue` file that provides
a Vue component that implements the editing pane.

**WARNING**: this is a construction zone, contact the author on the Node-RED forum for info.

## How-to

In order to write a Node-RED node using Vue:

- Do not write a `node.html` file, instead write a `node.vue` file. The `.vue` file must be in
  the same directory hand have the same base-name as the `.js` file (i.e. the same requirements
  as the former `.html` file).
- In the `node.js` file, register the `node.vue` file by placing
  after the usual call to `RED.nodes.registerType("my-node-name", ...)` the following:
  `RED.plugins.get('node-red-vue').createVueTemplate("my-node-name", __filename)`
- In the `.vue` file write a Vue component to display the node configuration interface using the
  Vue Options API, not the Vue Composition API (sorry).
- Define the configuration variables, i.e., what normall goes into the `defaults` object in the
  standard `node.html` file, as `props` in the Vue component.
  - Use the Vue types so the values are not strings where desired, e.g. Number, Array, Object, String, ...
  - Use the Vue `default` property instead of the conventional `value` property.
  - Use the Vue `required` property the same way as the conventional `required` property.
  - For variables that are references to config nodes, use a type of String and set a
    `configType` property to the type of the config node (e.g. 'mqtt-broker', 'flexdash container', ...).
  - Validations and filters are not yet supported.
- Place all other standard node type properties into a `node_red` field in the Vue options object,
  e.g., `category`, `color`, `inputs`, `outputs`, `icon`, `label`, `labelStyle`, `paletteLabel`, etc.
- Place help text for the help panel in the flow editor side-panel into a `help` field in the Vue
  options object and write the help using markdown syntax.

## Benefits

- Clean abstraction of pieces using components instead of doing JQuery DOM manipulation
  all over the place.
- Hot-module reload while developing: no more restarting Node-RED and reloading the browser to
  see changes.
- Use components for the individual properties that encapsulate all the low-level details.
  No more:
  - conversion from string to the real type of the node property
  - fiddling with initialization of typedInput in oneditprepare
  - mistakes matching the various HTML element IDs to the property names
  - saving of text editor in oneditsave
- Use TailWindCSS to style components, not more low-level CSS wrangling (unless you want to).
- For advanced programmers: write the Vue component using typescript to reduce errors

## Missing features

- validation on inputs (this needs to unify input field validation and node validation)
- support for less-common input types, such as env and credentials.

## Repo layout

There are two applications in this repository: the Node-RED runtime plugin running on the
server and the flow editor plugin running in the browser.

The runtime plugin is in node-red-vue.js, the flow editor plugin is in the `client` directory.
The node-red-vue.html file is the "traditional" flow-editor template but all it does is kick
off the loading of the real client, which is a TypeScript+Vue application.

The Vue app has its own node_modules, which are used to load dev tools as well as build a
packaged vue application.
