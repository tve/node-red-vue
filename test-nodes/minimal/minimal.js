module.exports = async function (RED) {
  // use try-catch to get stack backtrace of any error
  try {
    class Minimal {
      constructor(config) {
        RED.nodes.createNode(this, config)
        console.log("minimal node created")

        this.on("input", msg => {
          console.log("minimal node got input")
          this.send(msg)
        })
      }
    }

    RED.nodes.registerType("minimal", Minimal)
    console.log("minimal node registered")
  } catch (e) {
    console.log(`Error in ${__filename}: ${e.stack}`)
  }
}
