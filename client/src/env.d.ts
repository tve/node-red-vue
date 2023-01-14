/// <reference types="vite/client" />

// declare module '*.vue' {
//   import { DefineComponent } from 'vue'
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
//   const component: DefineComponent<{}, {}, any>
//   export default component
// }

// Declare the types of events we broadcast using mitt
import { Emitter } from "mitt"
type BusEvents = {
  onSave: void
  onCancel: void
}
declare module "vue" {
  // declare global properties (injected when app is created)
  interface ComponentCustomProperties {
    $bus: Emitter<BusEvents>
  }
}
