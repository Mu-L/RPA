#!/usr/bin/env node
// Generates the public docs page for the AI macro agent's default system prompt
// (https://ui.vision/ai/ai-system-prompt) plus the auto-generated section of
// llms-full.txt in the website repo. Run at release time so the published copy
// never goes stale:
//
//   npm run gen:ai-prompt-page               (website repo assumed at ../cf-ui.vision)
//   node scripts/generate_ai_prompt_page.js /path/to/cf-ui.vision
//
// Source of truth: DEFAULT_MACRO_AGENT_SYSTEM_PROMPT in
// src/services/ai/macro_agent/service.ts and DEPRECATED_COMMANDS in
// src/common/command.ts. The script fails loudly if the prompt gains a new
// `${...}` interpolation it does not know how to evaluate — extend it then.

const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const siteRoot = path.resolve(process.argv[2] || path.join(repoRoot, '..', 'cf-ui.vision'))

if (!fs.existsSync(siteRoot)) {
  console.error(`Website repo not found at ${siteRoot} — pass its path as the first argument.`)
  process.exit(1)
}

// ---------------------------------------------------------------- version ---
const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'extension', 'manifest.json'), 'utf8'))
const version = manifest.version
const dateStr = new Date().toISOString().slice(0, 10)

// ------------------------------------------------- deprecated command list ---
const cmdSrc = fs.readFileSync(path.join(repoRoot, 'src', 'common', 'command.ts'), 'utf8')
const listMatch = cmdSrc.match(/DEPRECATED_COMMANDS[^=]*=\s*\[([\s\S]*?)\n\]/)
if (!listMatch) {
  console.error('Could not find DEPRECATED_COMMANDS in src/common/command.ts')
  process.exit(1)
}
const deprecatedEntries = [...listMatch[1].matchAll(/\{\s*cmd:\s*'([^']+)',\s*replacement:\s*'([^']+)'\s*\}/g)]
if (deprecatedEntries.length === 0) {
  console.error('DEPRECATED_COMMANDS parsed to zero entries — format changed?')
  process.exit(1)
}
const deprecatedText = deprecatedEntries.map((m) => `${m[1]} (use ${m[2]})`).join(', ')

// ------------------------------------------------------- extract the prompt ---
const svcSrc = fs.readFileSync(path.join(repoRoot, 'src', 'services', 'ai', 'macro_agent', 'service.ts'), 'utf8')
const startMarker = 'DEFAULT_MACRO_AGENT_SYSTEM_PROMPT = `'
const startIdx = svcSrc.indexOf(startMarker)
if (startIdx === -1) {
  console.error('Could not find DEFAULT_MACRO_AGENT_SYSTEM_PROMPT in service.ts')
  process.exit(1)
}
let rest = svcSrc.slice(startIdx + startMarker.length)

// evaluate the one known interpolation before scanning for the terminator
// (its expression contains nested backticks)
const interpolationRe = /\$\{DEPRECATED_COMMANDS[\s\S]*?\.join\(', '\)\}/
if (!interpolationRe.test(rest)) {
  console.error('Expected the DEPRECATED_COMMANDS interpolation in the prompt — not found. Prompt format changed?')
  process.exit(1)
}
rest = rest.replace(interpolationRe, deprecatedText)

// find the closing backtick, honoring backslash escapes
let raw = null
for (let i = 0; i < rest.length; i++) {
  const ch = rest[i]
  if (ch === '\\') { i++; continue }
  if (ch === '`') { raw = rest.slice(0, i); break }
  if (ch === '$' && rest[i + 1] === '{') {
    console.error(`Unhandled interpolation in the prompt near: ...${rest.slice(Math.max(0, i - 60), i + 40)}\nExtend scripts/generate_ai_prompt_page.js to evaluate it.`)
    process.exit(1)
  }
}
if (raw === null) {
  console.error('Could not find the closing backtick of the prompt template.')
  process.exit(1)
}

// resolve template-literal escapes: \` \$ \\ -> ` $ \
const promptText = raw.replace(/\\([`$\\])/g, '$1')

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ---------------------------------------------------------------- the page ---
const page = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content="The complete system prompt of the Ui.Vision AI macro assistant, including the full uiv.* JavaScript API for JS script macros - published for transparency, prompt customization and as a compact RPA best-practices handbook.">
    <title>The Ui.Vision AI System Prompt - AI Macro Assistant Docs</title>
    <link rel="icon" href="/content/images/ui.vision.favicon32.webp" />
    <link href="/content/themes/basic/bootstrap.css" rel="stylesheet" />
    <link href="/content/fontawesome/css/font-awesome.css" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,300i,400,400i,500,500i,700,700i,900" rel="stylesheet">
    <link href="/content/main/base.css" rel="stylesheet" />
    <link href="/content/main/elements.css" rel="stylesheet" />
    <link href="/content/main/grid.css" rel="stylesheet" />
    <link href="/content/main/layout.css" rel="stylesheet" />
    <link href="/content/main/style.css" rel="stylesheet" />
    <style>
        ul { list-style: none outside none; padding-left: 0; margin: 0; }
        #system-prompt {
            white-space: pre-wrap;
            word-wrap: break-word;
            background: #f7f8fa;
            border: 1px solid #d9dde3;
            border-radius: 6px;
            padding: 18px;
            font-size: 13px;
            line-height: 1.55;
            max-height: none;
        }
    </style>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-VJNCDYRXBP"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-VJNCDYRXBP');
    </script>
</head>
<body>
    <div id="header">
        <div class="row">
            <div class="span2">
                <a href="/" id="logo">
                    <img src="/content/images/ui.vision.logo2.webp" alt="Ui.Vision RPA" class="responsive-img">
                </a>
            </div>
            <div class="span10">
                <a class="toggleMenu" id="mobile-menu-trigger" href="#"><i class="fa fa-bars"></i></a>
                <ul class="nav" style="display:block;">
                    <li>
                        <a href="/#get"><span class="highlight">1. Get Ui.Vision (free)</span></a>
                        <ul class="children-menu">
                            <li><a href="/rpa">Open-Source RPA</a></li>
                            <li><a href="/rpa/x">Ui.Vision XModules</a></li>
                            <li><a href="/rpa/docs/selenium-ide">Classic Browser Automation</a></li>
                            <li><a href="/rpa/x/desktop-automation">Desktop Automation</a></li>
                            <li><a href="/ai/computeruse">AI Computer Use</a></li>
                            <li><a href="/rpa/x/pricing">Buy RPA PRO and Enterprise</a></li>
                            <li><a href="https://forum.ui.vision/">Visit Our User Forum</a></li>
                        </ul>
                    </li>
                    <li><a href="/rpa/x"><span class="highlight">2. Install XModules</span></a></li>
                    <li>
                        <a href="https://ocr.space">OCR</a>
                        <ul class="children-menu">
                            <li><a href="https://ocr.space/ocrapi">Free PDF OCR API</a></li>
                            <li><a href="https://ocr.space">Free Online OCR</a></li>
                            <li><a href="https://ocr.space/searchablepdf">Create Searchable PDF</a></li>
                            <li><a href="https://ocr.space/copyfish">Copyfish OCR</a></li>
                        </ul>
                    </li>
                    <li>
                        <a href="/contact">Support</a>
                        <ul class="children-menu">
                            <li><a href="/rpa/docs">RPA Docs</a></li>
                            <li><a href="/ai">AI Integration Docs</a></li>
                            <li><a href="https://forum.ui.vision">RPA, OCR, AI Forum</a></li>
                            <li><a href="/contact">Contact Us</a></li>
                            <li><a href="/about">About Us</a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </div>

<div id="content download-content">
    <div id="page-header" class="page-download">
        <div class="row">
            <div class="span12 whitebg">
                <h1><span>The AI System Prompt</span> Inside the Ui.Vision Macro Assistant</h1>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="span12">

            <p>
                The AI tab in the Ui.Vision side panel builds and fixes macros from plain-language requests: it looks at the live website,
                writes the macro, runs it, reads the logs and iterates until the macro works. What makes it good at this job is its
                <em>system prompt</em> — the standing instructions that teach the AI every Ui.Vision command and the hard-won tricks of
                real-world web automation.
            </p>
            <p>
                We publish the complete, unedited prompt on this page. It fits how we work anyway: the full Ui.Vision extension
                source code is public at <a href="https://github.com/A9T9/RPA">github.com/A9T9/RPA</a>.
                Two more reasons: <strong>transparency</strong> — you can see exactly
                what instructions drive the AI that edits your macros — and because the prompt doubles as a remarkably compact
                <strong>best-practices handbook</strong>. Even if you write every macro by hand, the recipes below (cookie-consent
                banners, shadow DOM, OCR text targeting, unresponsive clicks, clean-state testing, error recovery) are the distilled
                answers to the questions our <a href="https://forum.ui.vision/">forum</a> gets asked most.
            </p>
            <p>
                This page is also the reference for <strong>external AI agents</strong>: the <a href="/ai/mcp-bridge">MCP bridge</a>'s
                <code>get_authoring_guide</code> tool returns exactly this text. An agent that cannot reach the bridge (yet) can read this
                page instead — it contains the complete <code>uiv.*</code> JavaScript scripting API and everything else needed to write
                correct Ui.Vision macros.
            </p>

            <h3 id="customize">Customize the prompt (Settings &gt; AI)</h3>
            <p>
                The prompt below is the built-in default. You can replace it with your own version in
                <span class="hiblue">Settings &gt; AI &gt; System Prompt</span> in the extension — for example to add rules for your
                intranet apps, enforce your team's naming conventions, or translate the assistant's replies. An empty override field means
                the default shown here is used. At runtime Ui.Vision appends one <em>Environment</em> line (browser type and whether the
                RealUser XModule is installed), so the AI always knows which command families work in your setup.
            </p>

            <h3 id="prompt">The default system prompt</h3>
            <p>
                Auto-generated from the extension source for <strong>Ui.Vision RPA v${version}</strong> on ${dateStr}.
                This page is regenerated at every release — the copy below is always the shipping prompt.
            </p>
            <pre id="system-prompt">${escapeHtml(promptText)}</pre>

            <h3>Anything wrong or missing on this page? Suggestions?</h3>
            <p>...then please post in the <a href="https://forum.ui.vision/">forum</a> or <a href="/contact">contact us</a>.</p>

        </div>
    </div>
</div>
    <div class="bigborder"></div>
    <div class="row">
        <script src="https://forum.ui.vision/javascripts/embed-topics.js"></script>
        <style>d-topics-list iframe { width: 80% !important; }</style>
        <div>
            <h2>Fresh from the Ui.Vision Forum: The Latest 3 Topics.</h2>
            <d-topics-list discourse-url="https://forum.ui.vision/" allow-create=true template="complete" per-page="3"></d-topics-list>
        </div>
        <div class="span3 foot-links">
            <a href="https://forum.ui.vision/"><i class="fa fa-gear"></i> RPA, OCR, AI Forums</a><br />
            <a href="/rpa/x/desktop-automation"><i class="fa fa-download"></i> Desktop Automation</a><br />
            <a href="/rpa/#selenium-ide"><i class="fa fa-gear"></i> Selenium IDE</a><br />
            <a href="/ai/computeruse"><i class="fa fa-gear"></i> AI Claude Computer Use</a><br />
            <a href="https://github.com/A9T9/RPA"><i class="fa fa-gear"></i> Ui.Vision Source Code</a>
        </div>
        <script async defer src="https://buttons.github.io/buttons.js"></script>
        <div class="span9 nomargin">
            &#8592; Meet the Ui.Vision team and users in our <a href="https://forum.ui.vision">forums</a>.
        </div>
    </div>
    <div class="bigborder2"></div>
    <div id="footer">
        <div id="footer-bottom">
            <div class="row">
                <div class="span12">
                    <p class="last">Copyright &#169; 2016-2026 by a9t9 software GmbH. <a href="/privacypolicy">Our Privacy Policy</a>. Website Version: <span id="site-version">V5.17</span></p>
                </div>
            </div>
        </div>
    </div>

    <script src="/scripts/jquery-2.1.3.min.js"></script>
    <script src="/scripts/modernizr-2.6.2.js"></script>
    <script src="/scripts/basic/bootstrap.min.js"></script>
    <script src="/scripts/a9t9scripts.js"></script>
    <script src="/scripts/layout/plugins.js"></script>
    <script src="/scripts/layout/script.js"></script>

</body>
</html>
`

const pagePath = path.join(siteRoot, 'ai', 'ai-system-prompt.html')
fs.writeFileSync(pagePath, page)
console.log(`Wrote ${pagePath} (prompt: ${promptText.length} chars, v${version})`)

// ----------------------------------------------------------- llms-full.txt ---
// Refresh the auto-generated prompt section between the markers, if the file
// exists (the surrounding content is hand-maintained).
const llmsFullPath = path.join(siteRoot, 'llms-full.txt')
const BEGIN = '=== BEGIN AUTO-GENERATED: AI MACRO AGENT SYSTEM PROMPT ==='
const END = '=== END AUTO-GENERATED: AI MACRO AGENT SYSTEM PROMPT ==='
if (fs.existsSync(llmsFullPath)) {
  const cur = fs.readFileSync(llmsFullPath, 'utf8')
  const beginIdx = cur.indexOf(BEGIN)
  const endIdx = cur.indexOf(END)
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
    console.error(`llms-full.txt exists but is missing the ${BEGIN} / ${END} markers — prompt section NOT updated.`)
    process.exit(1)
  }
  const updated =
    cur.slice(0, beginIdx + BEGIN.length) +
    `\n(Ui.Vision RPA v${version}, generated ${dateStr})\n\n` +
    promptText +
    '\n' +
    cur.slice(endIdx)
  fs.writeFileSync(llmsFullPath, updated)
  console.log(`Updated prompt section in ${llmsFullPath}`)
} else {
  console.log(`Note: ${llmsFullPath} not found — skipped llms-full.txt update.`)
}
