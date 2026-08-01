// ES6+ support for JS script macros.
//
// The sandbox (vendored JS-Interpreter) only parses ES5, so modern syntax is
// compiled down with Babel before it reaches the interpreter. Babel is loaded
// LAZILY on the first script run — it is ~2.3 MB, and users who only run table
// macros must never pay for it (same pattern as the jimp import in the AI
// service).
//
// The debugger keeps working because every reported position is translated
// back through Babel's source map. Measured against a hand-written ES5 control
// program, the resulting step path is IDENTICAL to the pre-Babel one.
//
// What Babel does NOT provide: runtime built-ins. It compiles syntax only, so
// Map/Set/Promise and methods like Array.prototype.includes do not appear —
// the common ones are polyfilled in ES5 inside the interpreter (see
// BUILTIN_POLYFILL in script_runner.js), and async/await is rejected outright
// (it needs a real Promise; the uiv API is synchronous by design).

let babelPromise = null

// Loading is deferred AND cached: the chunk is fetched once per panel session.
function loadBabel () {
  if (!babelPromise) {
    babelPromise = import(/* webpackChunkName: "babel-standalone" */ '@babel/standalone')
      .then(mod => mod.default || mod)
  }
  return babelPromise
}

const BABEL_OPTIONS = {
  sourceMaps: true,
  sourceType: 'script',
  // ie11 is simply "no ES6 syntax", which is what the interpreter accepts
  presets: [['env', { targets: { ie: '11' }, modules: false }]],
  // These keep the output free of Symbol/iterator machinery the interpreter
  // has no way to run. iterableIsArray in particular turns `for...of` into a
  // plain index loop instead of pulling in an iterator helper.
  assumptions: {
    iterableIsArray: true,
    skipForOfIteratorClosing: true,
    setPublicClassFields: true,
    noDocumentAll: true,
    objectRestNoSymbols: true,
    privateFieldsAsProperties: true,
    constantSuper: true,
    noClassCalls: true,
    noNewArrows: true
  }
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function decodeVLQ (str) {
  const values = []
  let shift = 0
  let value = 0

  for (let i = 0; i < str.length; i++) {
    const digit = B64.indexOf(str.charAt(i))
    if (digit === -1) continue

    value += (digit & 31) << shift

    if (digit & 32) {
      shift += 5
    } else {
      const negate = value & 1
      value >>= 1
      values.push(negate ? -value : value)
      value = 0
      shift = 0
    }
  }

  return values
}

// generated line (1-based) -> source line (1-based).
//
// Deliberately per LINE, by majority vote, rather than per column: Babel gives
// synthesized code (a compiled `for` header's `var _i = 0`) the position of
// whatever preceded it, so a column-accurate lookup at column 0 of a loop
// header answers with the line ABOVE it — which made the active-line marker
// flicker between two lines on every iteration. Every generated line here
// belongs to one source statement, so the line's dominant mapping is the
// honest answer.
function buildLineMap (mappings) {
  const map = {}
  let sourceLine = 0
  let sourceColumn = 0
  let sourceIndex = 0

  mappings.split(';').forEach((lineMappings, generatedIndex) => {
    if (!lineMappings) return

    let generatedColumn = 0
    const votes = {}
    let lastColumn = -1
    let lastLine = null

    lineMappings.split(',').forEach(segment => {
      const fields = decodeVLQ(segment)
      generatedColumn += fields[0] || 0

      // a 1-field segment carries no source position
      if (fields.length < 4) return

      sourceIndex += fields[1]
      sourceLine += fields[2]
      sourceColumn += fields[3]

      const line = sourceLine + 1
      votes[line] = (votes[line] || 0) + 1

      if (generatedColumn >= lastColumn) {
        lastColumn = generatedColumn
        lastLine = line
      }
    })

    let winner = null
    let winnerVotes = -1

    Object.keys(votes).forEach(key => {
      const line = Number(key)
      const count = votes[key]
      // ties go to the right-most mapping, which is the statement that
      // actually occupies the line
      if (count > winnerVotes || (count === winnerVotes && line === lastLine)) {
        winnerVotes = count
        winner = line
      }
    })

    if (winner !== null) map[generatedIndex + 1] = winner
  })

  return map
}

// Babel only emits these when the script used async/await. Detecting them in
// the OUTPUT avoids the false positives a regex over the source would hit
// (the words "async" or "await" inside a string, a comment or a locator).
const ASYNC_MARKERS = ['_asyncToGenerator', 'regeneratorRuntime', '_regenerator']

const ASYNC_MESSAGE =
  'async/await is not supported in Ui.Vision scripts — and is not needed: ' +
  'every uiv.* call already waits for its command to finish before the next ' +
  'line runs. Remove async/await and write the calls in plain sequence.'

/**
 * Compile a user script to ES5 for the sandbox.
 *
 * Returns { code, lineMap } where lineMap translates a line of `code` back to
 * the line the user wrote. Throws an Error carrying `.scriptLine` when the
 * script cannot be compiled, so the caller can point at the offending line.
 */
export async function transpileScript (source) {
  const Babel = await loadBabel()

  let result
  try {
    result = Babel.transform(source, BABEL_OPTIONS)
  } catch (e) {
    // Babel reports positions in the USER's source (it never sees the uiv
    // polyfill), so its line numbers can be used as-is
    const err = new Error('Syntax error: ' + ((e && e.message) || e))
    if (e && e.loc && typeof e.loc.line === 'number') err.scriptLine = e.loc.line
    throw err
  }

  if (ASYNC_MARKERS.some(marker => result.code.indexOf(marker) !== -1)) {
    throw new Error(ASYNC_MESSAGE)
  }

  return {
    code: result.code,
    lineMap: result.map ? buildLineMap(result.map.mappings) : null
  }
}

// Exported for the runner's own tests / fallback path
export { buildLineMap }
