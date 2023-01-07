module.exports = async function (RED) {
  // use try-catch to get stack backtrace of any error
  try {
    RED.plugins.get("node-red-vue").createVueTemplate("has config", __filename)
    RED.log.info(`has config template created`)

    class Minimal {
      constructor(config) {
        RED.nodes.createNode(this, config)
        this.log(`has config node created: ${config}`)

        this.on("input", msg => {
          this.log("has config node got input")
          this.send(msg)
        })
      }
    }

    RED.nodes.registerType("has config", Minimal)
    console.log("has config node registered")
  } catch (e) {
    console.log(`Error in ${__filename}: ${e.stack}`)
  }
}
