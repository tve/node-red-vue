import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import visualizer from "rollup-plugin-visualizer"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      filename: "stats/stats.html",
      title: "Node-RED-Vue Rollup",
      brotliSize: false,
      gzipSize: true,
    }),
  ],
  assetsInclude: "resources/node-red-vue/*",
  build: {
    outDir: "../resources",
    assetsDir: "client",
    cssCodeSplit: false,
    manifest: true,
    emptyOutDir: false,
  },
})
