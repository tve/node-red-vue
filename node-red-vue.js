// Vue plugin for Node-RED - implement Node-RED node HTML files using Vue & TailwindCSS
// Copyright ©2022 by Thorsten von Eicken, see LICENSE

// In a node's .js file, use the following to register it corresponding .vue template:
// - const nr_vue = RED.plugins.get('node-red-vue')
// - nr-vue.createVueTemplate(__filename) - when called from my-node.js will read my-node.vue in the
//   same directory and register it in the flow editor as "template" to edit my-node nodes.
//   I.e. this replaces having a .html file.

const path = require("path")
const fs = require("fs")
const fsp = require("fs/promises")
const sfc_compiler = require("./sfc-compiler.js")

module.exports = function (RED) {
  // use try-catch to get stack backtrace of any error
  try {
    const templates = [] // { ix: index, name: string, component: {script,styles,hash} }
    const components = {} // name -> string

    // ===== Admin API handlers to serve up flow editor Vue components

    // get templates as json array of objects, each with nodeType, script-url, styles, hash
    // query string must have start/end indexes
    RED.httpAdmin.get("/_vue/templates", (req, res) => {
      console.log("GET /_vue/templates", req.query)
      const start = parseInt(req.query.start)
      let end = parseInt(req.query.end)
      if (end == -1) end = templates.length - 1
      if (
        isNaN(start) ||
        start < 0 ||
        start >= templates.length ||
        isNaN(end) ||
        end < 0 ||
        end >= templates.length ||
        start > end
      ) {
        res.status(400).send("Bad start/end")
        return
      }
      // send all templates from start to end inclusive
      res.set("Content-Type", "application/json")
      const data = templates.slice(start, end + 1)
      res.send(JSON.stringify(data))
    })

    // get a Vue component module
    RED.httpAdmin.get("/_vue/component/:name", (req, res) => {
      console.log("GET /_vue/component", req.params)
      const name = req.params.name
      if (name && typeof name == "string" && name in components) {
        res.set("Content-Type", "application/javascript")
        res.send(components[name])
      } else {
        res.status(404).send("Not found")
      }
    })

    // ===== createVueTemplate

    async function _createVueTemplate(nodeType, filename, filePromise) {
      const data = await filePromise
      const { script, styles, hash, errors } = sfc_compiler(data, filename) // TODO: async???

      if (Array.isArray(errors) && errors.length > 0) {
        errors = errors.map(err => {
          if (err.loc?.start)
            return `line ${err.loc.start.line} col ${err.loc.start.column}: ${err.message}`
          else return `${err.message}`
        })
        this.error(`Error compiling ${filename}:\n` + errors.join("\n"))
        return
      }

      let ix = templates.findIndex(t => t.nodeType === nodeType)
      if (ix < 0) ix = templates.length
      const url = `_vue/component/${nodeType}`
      templates[ix] = { ix, name: nodeType, url, styles, hash }
      components[nodeType] = script
      RED.comms.publish("vue-add-type", ix)
      //RED.log.info(`Vue template ${nodeType} created:\n${script}\n==========`)
    }

    function createVueTemplate(nodeType, filename) {
      const vueFile = filename.replace(/\.[^.]+$/, ".vue")
      if (!fs.existsSync(vueFile)) {
        RED.log.error(`Vue template ${vueFile} not found`)
        return
      }
      RED.log.info("Creating Vue template for '" + nodeType + "' from " + vueFile)
      fsp
        .readFile(vueFile, "utf8")
        .then(data => _createVueTemplate(nodeType, vueFile, data))
        .catch(err => RED.log.error("Error loading Vue template: " + err))
    }

    // ===== Plugin registration
    const plugin = {
      type: "node-red-vue",
      onadd: () => {
        const version = require(path.join(__dirname, "package.json")).version
        RED.log.info(`Node-RED Vue version ${version}`)
      },
      // public functions
      createVueTemplate,
    }

    RED.plugins.registerPlugin("node-red-vue", plugin)
  } catch (e) {
    console.log(`Error in ${__filename}: ${e.stack}`)
  }
}
