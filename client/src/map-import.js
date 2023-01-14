// dynamic-import -- Allow bundled libraries to be dynamically imported
// Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file

import "es-module-shims"

// This module deals with dynamically loaded components, specifically, their imports
// using import maps courtesy of es-module-shims.

const createBlob = (source, type = "text/javascript") =>
  URL.createObjectURL(new Blob([source], { type }))

// ImportMap accepts a map of import specifiers (what importers specify in the "from" clause
// of an import statement) to global variables (type constructed using "import * from").
// It uses es-module-shims to construct a blob URL that re-exports the global variable as
// a module with the desired name, and adds that to the browser's import map.
// The intended use is for the caller to import the foreign module from whatever URL (possibly
// using a dynamic import) and then call ImportMap to make the module available to the rest
// of the app using some canonical name.
export default function (/*ImportMap*/ import_map) {
  const imap = { imports: {} }
  for (const key in import_map) {
    const global_var = import_map[key]
    let source = `// Import ${key} from global ${global_var}\n`
    // create export statements
    if (window[global_var].default) {
      source += `export default ${global_var}.default\n`
    }
    for (const key in window[global_var]) {
      if (key !== "default") {
        source += `export const ${key} = ${global_var}.${key}\n`
      }
    }
    // create a blob URL for the source and add to import map
    const blobUrl = createBlob(source)
    imap.imports[key] = blobUrl
  }
  importShim.addImportMap(imap)
  console.log("Import map: ", JSON.stringify(importShim.getImportMap()?.imports))
}
