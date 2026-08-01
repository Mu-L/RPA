# Ui.Vision [RPA](https://ui.vision/rpa)

- Modern Robotic Process Automation, Selenium IDE compatible
- Ui.Vision is open-source and **free** for personal and commercial use.

Questions? Suggestions? - Meet us in the Ui.Vision [RPA user forum](https://forum.ui.vision).

Every user benefits from the questions and answers provided in the forum, that is why we would ask you to post the question [in the RPA forum](https://forum.ui.vision) first if a public forum is appropriate for your question. The forum is monitored by active users, tech support and the developers, so we would like to concentrate the discussion "over there" in one place.


# How to install Ui.Vision:

Ui.Vision RPA for Chrome, Edge and Firefox is modern cross-platform RPA software for macOS, Linux and Windows. It includes a Selenium IDE and Web Macro Recorder. You find the latest version always in the Chrome and Firefox stores. You can use it _completely free for private and commercial purposes_:

- [UI.Vision in the Google Chrome Webstore](https://chrome.google.com/webstore/detail/uivision-rpa/gcbalfbdmfieckjlnblleoemohcganoc)

- [UI.Vision in the Firefox Webstore](https://addons.mozilla.org/en-US/firefox/addon/rpa/)

- [UI.Vision in the Microsoft Edge Webstore](https://microsoftedge.microsoft.com/addons/detail/uivision-rpa/goapmjinbaeomoemgdcnnhoedopjnddd)


- [Ui.Vision Homepage](https://ui.vision/)

- List of supported [Selenium IDE commands](https://ui.vision/rpa/docs/selenium-ide/)


# The new `uiv.*` JavaScript API and the AI system prompt

Besides the classic command table, macros can be written as modern JavaScript
using the `uiv.*` API - DOM and visual finders (`uiv.$`, `uiv.findImage`,
`uiv.ocr.findText`, `uiv.ai.find`), the input tiers (`uiv.page.*`,
`uiv.browser.*`, `uiv.desktop.*`), screenshots, tabs, CSV and downloads. Every
call auto-waits and throws a real JS exception on failure, so `try/catch` works.

- [The Ui.Vision AI system prompt](https://ui.vision/ai/ai-system-prompt) - the
  complete `uiv.*` API reference plus the automation recipes the AI assistant
  works from. This is the same text the AI in the side panel uses, and it is the
  best hand-written reference for the JS API. You can override it in
  Settings > AI > System Prompt.

- [llms-full.txt](https://ui.vision/llms-full.txt) - the same material as one
  plain-text file, for feeding into an AI assistant.

- [MCP bridge](https://ui.vision/ai/mcp-bridge) - lets Claude Code and other MCP
  clients create, edit and run Ui.Vision macros in your browser. Source and
  setup: [mcp/README.md](mcp/README.md).

- [uiv-commands.md](uiv-commands.md) (in this repo) - maps every classic
  command-table command to its `uiv.*` equivalent, or to the
  `uiv.run('command', 'target', 'value')` legacy bridge where no native method
  exists yet.

The published prompt page is generated from the source of truth in
`src/services/ai/macro_agent/service.ts` via `npm run gen:ai-prompt-page`, so
run that at release time to keep it in sync.


# Building the Chrome, Edge and Firefox Extension

Building the extension is _not_ required if you "only" want to use it.

You can [install UI.Vision directly from the Chrome, Edge or Firefox stores](https://ui.vision/rpa), which is the easiest and the recommended way of using the Ui.Vision RPA software. Older versions can be found in the [RPA software](https://ui.vision/rpa/archive) archive.

The information below is only required and intended for developers:

The project uses Node V20.11.1 and NPM V10.2.4

If you have any questions, please contact us at TEAM AT UI.VISION - Thanks!

# To build the extension bundle

```bash
npm i -f
```

```bash
npm run build
```

```bash
npm run build-ff
```

`npm run build` creates the Chrome/Edge build in `dist`, `npm run build-ff` creates the Firefox build in `dist_ff`.

# To develop

```bash
npm i -f
```

```bash
npm start
```

Use `npm run start-ff` for the Firefox variant. Both run webpack in watch mode, so the bundles in `dist` (Chrome/Edge) and `dist_ff` (Firefox) are rebuilt on every change.

Once done, the ready-to-use extension code appears in the `/dist` directory (Chrome, Edge) or `/dist_ff` directory (Firefox). Load it via `chrome://extensions` → "Load unpacked" (Chrome/Edge) or `about:debugging` → "Load Temporary Add-on" (Firefox).

# Repository layout

- `src/` - the extension source (React UI, side panel, macro player, commands)
- `extension/` - static extension assets and `manifest.json` (Manifest V3)
- `mcp/` - the Ui.Vision MCP bridge, which lets Claude Code and other MCP clients create, edit and run macros. See [mcp/README.md](mcp/README.md)
- `dist/`, `dist_ff/` - build output for Chrome/Edge and Firefox
