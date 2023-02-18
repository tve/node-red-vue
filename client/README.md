# node-red-vue flow editor code

This sub-tree contains the code loaded into the Node-RED flow editor in order to manage all
the Vue components for all nodes that use node-red-vue.

The code is organized as a regular Vue app using Vite for bundling as well as for HMR.
The overall process is as follows:

- `node-red-vue.html` is the parent directory that is pushed by the Node-RED run-time into the flow
  editor using the std mechanism
- this sets-up `esm-module-shim` to enable the import of ES modules via an importmap, this is
  the foundation of all import statements in the code
- it also loads `node-red-vue.ts`, which is a flow editor plugin that communicates with its
  counter-part in the Node-RED runtime (server side)
- the run-time sends the list of Vue components to the plugin and the plugin fetches them
  and registers them with the flow-editor as if they were std stuff

When the user clicks on a node in the flow editor to edit it:

- the `oneditprepare` in `node-red-vue.ts` is called, which uses `mountEditApp` in `vue-app.ts`,
  this mounts a Vue app in the DOM where usually the std node template would be placed
- the root component of the Vue app is `edit-panel.vue`

About stacked edit panels:

- when the user chooses to edit a config ndoe while editing another node the edit panels get stacked,
  this is the how the flow editor works
- stacking means that the current edit panel's DOM elements are moved off-screen and the new edit
  panel is instantiated
- from the Vue perspective, this is invisible: no unmount or anything happens, the DOM elements are
  simply now shown
- in node-red-vue what happens is that a new Vue app is instantiated for the new congig node and
  is mounted in the DOM, so there is now more than one Vue app mounted at the same time, which is
  totally OK

What's where:

- `../node-red-vue.html` is the std "node template" that is loaded by the flow editor
- `node-red-vue.ts` is the flow editor plugin that is loaded indirectly by `../node-red-vue.html`
- `vue-app.ts` is the code that mounts the Vue app in the flow editor, i.e., it is _not_ Vue code
  itself
- `components/edit-panel.vue` is the root component of the Vue app that is mounted for editing
  a node
- `node-red.ts` is a sort of mix-in that makes certain Node-RED data structures usable in typescript
  and that adds additional helper functions to code that manipulates these data structures isn't
  strewn all over the place
