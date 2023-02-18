// Initialize es-module-shims, used when importing Vue components to point to Vue.
window.esmsInitOptions = {
  shimMode: true, // shimMode requird to support multiple dynamic import maps
  // Skip source analysis of certain URLs for full native passthrough
  skip: "^https?:.*/assets/index.[a-z0-9]{8}.js$", // bundled Node-RED-Vue assets
  mapOverrides: true, // Permit overrides to import maps (used by custom widget HMR)
}
