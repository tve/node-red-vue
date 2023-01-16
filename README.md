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

### Component life-cycle

- The component for a node is created and mounted when the node is edited, i.e., when the
  edit pane is to be shown. This happens within the Node-RED oneditprepare callback.
- The node properties are passed into the component's props.
- As the user changes values, the component should emit `update:prop` events with the prop
  name and new value. These values are saved in a temporary object and also fed back into the
  component's props.
- If the user clicks the Done button, the component is destroyed and the temporary object
  values saved to the component properties.
- If the user clicks the Cancel button, the component is destroyed and the temporary object is
  discarded.
- A simple event bus `$bus` is provided to the component for additional events, currently
  `OnSave` and `OnCancel` events are generated to allow edited values to be saved or discarded
  "last-minute" (this is used by the code editor component, for example).

## Benefits

- Live in 2023, not 2015...
- Clean abstraction of functionality using components instead of doing JQuery DOM manipulation
  all over the place.
- Hot-module reload while developing: no more restarting Node-RED and reloading the browser to
  see changes, they show up instantaneously
- Use components for the individual properties and have all the low-level details neatly encapsulated.
  No more:
  - conversion from string to the real type of the node property
  - fiddling with initialization of typedInput in oneditprepare
  - mistakes matching the various HTML element IDs to the property names
  - saving of text editor content in oneditsave
- Use TailWindCSS to style components, not more low-level CSS wrangling (unless you want to).
- For advanced programmers: write the Vue component using typescript to reduce errors

## Missing features

- validation of inputs (this needs to unify input field validation and node validation to avoid the
  the current total disconnect between property validation and typedInput validation)
- support for less-common input types, such as env and credentials.
- loading CSS is not implemented (but it's easy to do), I'm using Master.CSS and haven't needed
  it yet...

## Internals

### Repo layout

There are two applications in this repository: the Node-RED runtime plugin running on the
server and the flow editor plugin running in the browser.

The runtime plugin is in node-red-vue.js, the flow editor plugin is in the `client` directory.
The node-red-vue.html file is the "traditional" flow-editor template but all it does is kick
off the loading of the real client, which is a TypeScript+Vue application.

The Vue app has its own node_modules, which are used to load dev tools as well as build a
packaged vue application.

### External libraries used

This plugin leverages primarily 4 libraries:

- The Vue run-time is loaded into the flow editor, it drives the reactive rendering and manages
  the components
- The Vue compiler is used to compile the `.vue` files into javascript, this happens in the
  Node-RED run-time at start-up
- ES-module-shims is a library that facilitates dynamic loading of modules and is extensively
  used to load the Vue components, the Vue run-time, and any other dependencies into the flow editor
- Master.CSS is used to make it easier to style HTML elements without using traditional style
  sheets. It's similar to TailwindCSS but takes it to the next level and weighs in at a fraction
  of the size and implementation complexity.

### Overal functioning

The starting point for a node that uses a Vue template is:

- the traditional node `.js` file that gets loaded into the run-time
- a `.vue` "template" file that replaces the traditional node `.html` file
- optionally some components in a `components` subdir

When Node-RED starts up:

- it loads the node-red-vue plugin, which initialises things
- it loads the `.js` file and that calls createVueTemplate in the node-red-vue plugin
- the plugin looks for the `.vue` file and compiles it into a javascript module, plus the
  node descriptor that needs to be passed to `RED.nodes.registerType`, plus
  the HTML template with the `<input>` tags for all the properties of the node, plus the
  text for the help panel.
- the plugin then inserts the node descriptor, the HTML template, and the help text into
  the Node-RED node registry so they get shipped
  to the flow editor as if they had come from a traditional `.html` file
- the javascript module is saved separately and is sent to the flow editor via a different route

When the flow editor starts up:

- the javascript surrounding the node descriptor gets executed, which causes the node type to
  be registered with the descriptor (node name, category, number of inputs, etc.) generated
  from the Vue component definition
- the descriptor's oneditprepare function links into the plugin
  to load the Vue component and render it in the edit pane

In the flow editor, when a user clicks on a node to edit it:

- the flow editor calls oneditprepare, which calls into the node-red-vue plugin
- a Vue "app" is created and mounted in the edit pane, it is fed the current value of the
  node properties as (properly typed) props
- when a property value is edited by the user, the Vue component must emit an event (that's a
  Vue event that propagates up the hierarchy) with the new value
- this event is processed by the plugin and the new value is saved in a temporary object
- when the user clicks "Done", the plugin is invoked via oneditsave and saves the temporary
  object into the node properties
- if the user clicks "Cancel", the plugin is invoked via oneditcancel and the temporary
  object is discarded
- in either of the two exit cases the Vue app is unmounted and deleted
- if, during the editing of the node, the user chooses to create or edit a config node then
  the Vue app is hidden but remains alive so internal state is preserved
- if the config node also uses Vue then the same process is followed and more than one Vue app
  ends up being active at a time

If the user edits the `.vue` file:

- the plugin detects the change and recompiles the `.vue` file, it then sends a notification
  to any connected flow editors, which load the new version of the component
- the new version is currently just loaded and the user has to close the edit pane and re-open
  it to see the changes (further improvement planned...)
- the node type definition (e.g. the list of properties) cannot be changed this way, this is a
  limitation of the flow editor.)
- additional components used by the main Vue component are loaded into the flow editor using the
  same mechanism (they are sent in bulk at start-up and they can similarly be dynamically updated)
