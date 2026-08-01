# Vendored JS-Interpreter

Upstream: https://github.com/NeilFraser/JS-Interpreter
Pinned commit: `45d00b0c86e48cca1bb3af0f711bc4c0d626c359` (2026-06-12)

| File | Origin | License | Modified? |
|---|---|---|---|
| `acorn.js` | upstream (custom acorn build shipped by JS-Interpreter) | MIT | No — byte-identical |
| `interpreter.js` | upstream | Apache-2.0 | No — byte-identical |
| `index.js` | ours | — | CommonJS glue (see below) |

## Why vendored

Neil Fraser does not publish JS-Interpreter to npm; the intended usage is
copying `acorn.js` + `interpreter.js` into the project. We previously consumed
it via `kd-js-interpreter`, an unmaintained third-party repack pinned to an
upstream snapshot from 2021-08-11. Vendoring directly gets us five years of
upstream fixes and removes the middleman.

## How the glue works

`interpreter.js` is a plain script: it looks up acorn at parse time via
`Interpreter.nativeGlobal.acorn` (`nativeGlobal` is `globalThis`) and
self-registers `globalThis.Interpreter`. `index.js` therefore requires the UMD
`acorn.js`, assigns it to `globalThis.acorn` (only if unset), loads
`interpreter.js`, and exports `globalThis.Interpreter`. Net global-scope
effect: `acorn` and `Interpreter` appear on globalThis — same behavior as
loading the upstream files via script tags, and equivalent to what the old
kd-js-interpreter bundle did.

## Known webpack warning (benign — do not "fix" with resolve.fallback)

The build warns `Can't resolve 'vm'` in `interpreter.js`. That `require('vm')`
is Node-only fallback code for sandboxed regex evaluation (REGEXP_MODE 2), only
reached when Web Workers are unavailable, and it sits in a try/catch: in the
browser it fails gracefully and the interpreter raises a clean "Regular
expressions not supported" error in that (rare) environment. Do NOT add
`resolve.fallback: { vm: false }` to webpack — that makes `require('vm')`
return `{}`, which is truthy, so the interpreter would take the vm code path
and crash with a TypeError instead of failing cleanly.

## Updating

1. Pick the new upstream commit `<sha>`.
2. Replace both files:
   `curl -sL -o acorn.js https://raw.githubusercontent.com/NeilFraser/JS-Interpreter/<sha>/acorn.js`
   `curl -sL -o interpreter.js https://raw.githubusercontent.com/NeilFraser/JS-Interpreter/<sha>/interpreter.js`
3. Update the pinned commit above.
4. Run the smoke checks: `executeScript_Sandbox` macros must still work, and
   the Firefox regex guard in `src/common/eval.js` still introspects
   `interpreter.stateStack[n].node` — verify that internal shape survived.
