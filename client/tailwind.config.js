// NOTE: using the tailwindcss cdn this is found as script element in node-red-vue.html
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,vue,html}"],
  theme: {
    extend: {},
  },
  important: ".tw-root.tw-root", // scope to those elements, doubled to match base.css nesting
  corePlugins: {
    //preflight: false, // Node-RED doesn't like it...
  },
}
// Notes:
// - npm install -D prettier prettier-plugin-tailwindcss
