module.exports = async function (RED) {
  // use try-catch to get stack backtrace of any error
  try {
    RED.plugins.get("node-red-vue").createVueTemplate("tabbed", __filename)
    RED.log.info(`tabbed template created`)

    class Minimal {
      constructor(config) {
        RED.nodes.createNode(this, config)
        this.log(`tabbed node created: ${config}`)

        this.on("input", msg => {
          this.log("tabbed node got input")
          this.send(msg)
        })
      }
    }

    RED.nodes.registerType("tabbed", Minimal)
    console.log("tabbed node registered")
  } catch (e) {
    console.log(`Error in ${__filename}: ${e.stack}`)
  }
}
