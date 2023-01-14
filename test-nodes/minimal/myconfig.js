module.exports = async function (RED) {
  // use try-catch to get stack backtrace of any error
  try {
    RED.plugins.get("node-red-vue").createVueTemplate("myconfig", __filename)
    RED.log.info(`minivue template created`)

    class MyConfig {
      constructor(config) {
        RED.nodes.createNode(this, config)
        console.log("myconfig node created")
      }
    }

    RED.nodes.registerType("myconfig", MyConfig)
    console.log("myconfig node registered")
  } catch (e) {
    console.log(`Error in ${__filename}: ${e.stack}`)
  }
}
