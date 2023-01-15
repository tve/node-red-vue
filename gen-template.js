// Generate a flow-editor node-type template from a Vue component's AST.
// Copyright ©2023 by Thorsten von Eicken, see LICENSE

module.exports = function (nodeType, scriptAst, source) {
  if (!scriptAst || !source) return { tmpl: "", error: "no Vue script" }
  for (const node of scriptAst) {
    if (node.type !== "ExportDefaultDeclaration") continue
    let optionProperties
    if (node.declaration.type === "ObjectExpression") {
      // handle 'export default { ... }'
      optionProperties = node.declaration.properties
    } else if (
      // handle 'export default defineComponent({ ... })'
      node.declaration.type === "CallExpression" &&
      node.declaration.arguments[0].type === "ObjectExpression"
    ) {
      optionProperties = node.declaration.arguments[0].properties
    }
    if (!optionProperties)
      return { tmpl: "", error: "default export is not Object or defineComponent call" }
    // locate the Options API properties, i.e., "the big {}"
    let props, node_red, help
    for (const s of optionProperties) {
      // console.log("===== s =====\n", s, "\n===== END s =====")
      if (
        s.type === "ObjectProperty" &&
        s.key.type === "Identifier" &&
        s.value?.type === "ObjectExpression"
      ) {
        if (s.key.name === "props") {
          props = source.substring(s.value.start, s.value.end)
          //console.log("===== props =====\n" + props, "\n===== END props =====")
        } else if (s.key.name === "node_red") {
          node_red = source.substring(s.value.start, s.value.end)
          //console.log("===== node_red =====\n" + node_red, "\n===== END node_red =====")
        }
      } else if (
        s.type === "ObjectProperty" &&
        s.key.type === "Identifier" &&
        s.key.name === "help"
      ) {
        if (s.value?.type === "StringLiteral") {
          help = s.value.value
        } else if (s.value?.type === "TemplateLiteral") {
          // s.value.quasis holds the content of the original `...` strings. To get that
          // content back with the right \ processing we need to surround each quasi with
          // backticks and eval them.
          //console.log(s.value.quasis)
          const tmpl = s.value.quasis.map(q => "`" + q.value.raw + "`").join(" + ")
          help = new Function("return " + tmpl)()
        }
        // console.log("===== help =====\n" + help, "\n===== END help =====")
      }
    }
    if (!props) return { tmpl: "", error: "default export is missing 'props' property" }
    if (!node_red) return { tmpl: "", error: "default export is missing 'node_red' property" }
    // load props and node_red
    props = new Function("'use strict'; return " + props)()
    nr_obj = new Function("'use strict'; return " + node_red)()
    if (!props || typeof props !== "object") return { tmpl: "", error: "props is not an object" }
    if (!nr_obj || typeof nr_obj !== "object")
      return { tmpl: "", error: "node_red is not an object" }
    // generate the template
    const isConfig = nr_obj.category == "config"
    return {
      // red-ui-editor-node-configs
      tmplJs: generateRegistration(nodeType, props, node_red),
      tmplData: generateTemplate(nodeType, props, isConfig),
      tmplHelp: generateHelp(nodeType, help),
      error: null,
    }
  }
  return { tmpl: "", error: "no 'export default' declaration" }
}

// register the node template type with Node-RED, which makes it show up in the palette and
// allows the flow editor to create instances of it.
function generateRegistration(name, props, node_red) {
  // FIXME: need more general conversion
  const defaults = {}
  for (const p in props) {
    const v = props[p]
    if (typeof v == "object") {
      defaults[p] = { value: v.default }
      if ("config_type" in v) defaults[p].type = v.config_type
      if ("required" in v) defaults[p].required = v.required
    } else {
      defaults[p] = { value: v }
    }
  }
  node_red =
    `{
    defaults: ${JSON.stringify(defaults)},
    vue_props_debug: ${JSON.stringify(props)},
    oneditprepare() { return window.vueOnEditPrepare.apply(this) },` + node_red.substring(1)
  let script = `
(function() {
  const typedef = ${node_red}
  console.log("Registering Vue-based type '${name}':", typedef)
  RED.nodes.registerType("${name}", typedef)
})();\n`
  return script
}

// generate a data template for the flow editor consisting of a hidden string input for
// every prop in the component
function generateTemplate(name, props, isConfig) {
  // The odd height calc below compensates for #dialog-form height calc being off...
  let tmpl = `<div id="${name}-edit-root" class="vue-root"
    style="position:relative; width:100%; height:calc(100% + 25px)">\n` // no master-css here
  const prefix = isConfig ? "node-config-input-" : "node-input-"
  const inputs = Object.keys(props).map(prop => `<input type="hidden" id="${prefix + prop}">`)
  tmpl += `<div style="display:none">\n${inputs.join("\n")}\n</div>\n</div>\n`
  return tmpl
}

// generate a help template for the flow editor with the help text
function generateHelp(name, help) {
  // create the script element for Node-RED
  return `<script type="text/markdown" data-help-name="${name}">\n${help}\n</script>\n`
}

// generate a data template for the flow editor consisting of a hidden string input for
// every prop in the component
function generateTemplateFun(name, props, isConfig) {
  // remove any existing script element for this type
  let script = `(function() {
  const oldEl = document.querySelector('script[data-template-name="${name}"]')
  if (oldEl) oldEl.remove()`
  // create the edit script tag for Node-RED to populate with values
  script += `
  const scriptEl = document.createElement("script")
  scriptEl.type = "text/html"
  scriptEl.setAttribute("data-template-name", "${name}")`
  // The odd height calc below compensates for #dialog-form height calc being off...
  script += `
  const html =
    '<div id="${name}-edit-root" class="vue-root" ' +
    'style="position:relative; width:100%; height:calc(100% + 25px)"></div>'` // no master-css here
  const prefix = isConfig ? "node-config-input-" : "node-input-"
  const inputs = Object.keys(props).map(prop => `<input type="hidden" id="${prefix + prop}">`)
  script += `
  scriptEl.innerText = html + '<div style="display:none">' + \`\n${inputs.join("\n")}\n\` + "</div>"
  document.body.appendChild(scriptEl); console.log("Inserted data template for ${name}");`
  return script + "\n})();\n\n"
}

// generate a help template for the flow editor with the help text
function generateHelpFun(name, help) {
  let script = `(function() {
  const oldEl = document.querySelector('script[data-help-name="${name}"]')
  if (oldEl) oldEl.remove()`
  // create the script element for Node-RED
  script += `
  const helpEl = document.createElement("script")
  helpEl.type = "text/markdown"
  helpEl.setAttribute("data-help-name", "${name}")
  helpEl.textContent = \`${help.replace(/`/g, "\\`")}\`
  document.body.appendChild(helpEl)`
  return script + "\n})();\n\n"
}
