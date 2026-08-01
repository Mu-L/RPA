// CommonJS wrapper around the vendored upstream JS-Interpreter files.
// acorn.js and interpreter.js are byte-identical to upstream (see README.md);
// this shim exists so they can be consumed as a module without modification.
//
// interpreter.js resolves its parser via Interpreter.nativeGlobal.acorn
// (i.e. globalThis.acorn) and registers globalThis.Interpreter itself, so the
// bridge below is the minimal glue: expose acorn globally, load the
// interpreter, re-export the constructor.
var acorn = require('./acorn')

var g = typeof globalThis !== 'undefined' ? globalThis : self
if (!g.acorn) {
  g.acorn = acorn
}

require('./interpreter')

module.exports = g.Interpreter
