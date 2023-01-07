module.exports = async function (RED) {
  // use try-catch to get stack backtrace of any error
  try {
    RED.plugins.get("node-red-vue").createVueTemplate("minivue", __filename)
    RED.log.info(`minivue template created`)

    class Minimal {
      constructor(config) {
        RED.nodes.createNode(this, config)
        this.log(`minivue node created: ${config}`)

        this.on("input", msg => {
          this.log("minivue node got input")
          this.send(msg)
        })
      }
    }

    RED.nodes.registerType("minivue", Minimal)
    console.log("minivue node registered")
  } catch (e) {
    console.log(`Error in ${__filename}: ${e.stack}`)
  }
}
