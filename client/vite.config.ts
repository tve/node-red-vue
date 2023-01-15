import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import visualizer from "rollup-plugin-visualizer"
import { MasterCSSVitePlugin } from "@master/css.vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    MasterCSSVitePlugin({
      config: "src/master.css.ts",
      //include: ["src/**/*.{ts,js,vue}"],
    }),
    visualizer({
      filename: "stats/stats.html",
      title: "Node-RED-Vue Rollup",
      brotliSize: false,
      gzipSize: true,
    }),
  ],
  assetsInclude: ["resources/node-red-vue/*"],
  build: {
    outDir: "../resources",
    assetsDir: "client",
    cssCodeSplit: false,
    manifest: true,
    emptyOutDir: true,
    //: { external: ["resources/node-red-vue/ems-config.js"] },
  },
})
