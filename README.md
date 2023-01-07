# Node-RED Vue

Write Node-RED node templates in Vue.js.
Node templates implement the "Properties" pane when editing a node in the flow editor.
The standard way to write them is by placing a `<node-name>.html`
file in the directory with the node's `.js` file, and to write a bunch of raw HTML and JS in thet
file to implement the editing pane.
Node-RED Vue replaces this with a`.vue` file that provides
a Vue component that implements the editing pane.

**WARNING**: this is a construction zone, contact the author on the Node-RED forum for info.

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
