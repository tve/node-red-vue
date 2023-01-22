// Interface to the Vue3 SFC compiler (Single File Components)
// Adapted from https://github.com/rockboom/vue3-compiler-sfc
// Copyright ©2021-2022 by Thorsten von Eicken, see LICENSE

const { parse, compileTemplate, compileScript, compileStyle } = require("@vue/compiler-sfc")
const hash = require("hash-sum")

// compiler accepts a source string together with a name (supposed to be file name) and
// returns { render, script, styles, errors }
module.exports = function (sfc_source, filename) {
  const scope = hash(filename + "\n" + sfc_source)
  const scopeId = `data-v-${scope}`

  // parse the source code, which will produce its parts (script, template, style)
  const { descriptor, errors } = parse(sfc_source, { filename })
  if (errors && errors.length > 0) return { script: null, styles: null, errors }

  const scoped = descriptor.styles.some(e => e.scoped)
  // console.log(`SFC: ${filename} scoped=${scoped} scopeId=${scopeId}`)

  const templateOptions = {
    compilerOptions: {
      scopeId,
      sourceMap: false,
    },
    filename: filename,
    id: scopeId,
    isProd: false,
    scoped,
    slotted: descriptor.slotted,
    ssr: false,
  }

  // compile the script part into plain javascript
  let script = ""
  let scriptAst, scriptRaw
  if (descriptor.script) {
    const scriptDescr = compileScript(descriptor, {
      id: scopeId,
      isProd: false,
      inlineTemplate: false,
      // templateOptions, // not needed if inlineTemplate==false
    })
    templateOptions.compilerOptions.bindingMetadata = scriptDescr.bindings
    //console.log('===== script:\n', scriptDescr)
    script += scriptDescr.content.replace(/^\s*export\s\s*default\s/m, "const component =")
    scriptAst = scriptDescr.scriptAst
    scriptRaw = scriptDescr.content // what compileScript returned before we mangled it
  } else {
    script += "const component = {}"
  }

  // compile the template part into a render function
  if (descriptor.template) {
    templateOptions.source = descriptor.template.content
    const template = compileTemplate(templateOptions)
    // console.log('===== template options:\n', templateOptions)
    script += "\n//==== render function from template\n\n" + template.code.replace(/export\s*/, "")
  }

  // compile the style part
  let styles = null
  if (descriptor.styles) {
    styles = descriptor.styles
      .map(style => {
        const styleDescr = compileStyle({
          filename,
          source: style.content,
          isProd: false,
          id: scopeId,
          scoped,
          trim: false,
        })
        //console.log('===== style:\n', styleDescr)
        return styleDescr.code
      })
      .join("\n")
  }

  // finish up by inserting the render function into the script
  if (descriptor.template) script += "\n\ncomponent.render = render"
  script += `\ncomponent.__scopeId = "${scopeId}"`
  script += "\nexport default component"

  // return concat of render function and script&style
  return { script, scriptAst, scriptRaw, styles, hash: scope, errors: null }
}
