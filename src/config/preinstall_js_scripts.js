// JS script macro demos (V11 prototype, branch js-macro-test1).
// Single source for BOTH the Examples dropdown in the script view AND the
// preinstalled files in the tree's "Demo and QA Test Scripts" folder. File
// names end in ".js" —
// the suffix marks a script macro in the tree (JS badge icon); the macro
// data's `Script` field is what actually routes it to the JS editor.
//
// The demos are written in MODERN JavaScript (see js_transpile.js): const/let,
// arrow functions, template literals, destructuring, for...of. Two things to
// remember when editing them here: they live inside a JS template literal, so
// a backtick must be written \` and an interpolation \${...} — and the demo
// itself must not use async/await (every uiv.* call already waits).

// Starter script: shown in the never-saved Untitled JS editor — a runnable
// mini tutorial of the uiv.* API. "+ Macro" does NOT use this; a macro the
// user explicitly asked for starts empty (see NEW_MACRO_SCRIPT below).
export const STARTER_SCRIPT = `// Ui.Vision JS script - modern JavaScript
// (let/const, arrows, \`template literals\`, destructuring, for...of, classes;
//  no async/await - every uiv.* call already waits for its command)
// FIND, DOM world (locators: css= id= name= link= xpath= ; bare string = css):
//   uiv.$('css=h1')            -> FIRST match {x, y, rect, text, value, ...}
//   uiv.$$('css=tr')           -> ALL matches (array)
//   All find in every frame (even cross-origin) + open shadow roots,
//   auto-wait and throw if nothing appears ({timeout: 5, required: false}).
// FIND, VISUAL world (pixels - anything the eye sees):
//   uiv.findImage('button.png')      -> first computer-vision match
//   uiv.ocr.findText('Checkout')        -> first OCR text match
// ACT - pick the tier that fits; they differ in what the page believes:
//   uiv.page.type('id=email', 'a@b.com')     FASTEST: fills a field in ONE step
//   uiv.page.click('css=#buy')               synthetic event; some sites ignore it
//   uiv.browser.click('css=#buy')           TRUSTED click (CDP), no XModule
//   uiv.browser.click(uiv.findImage('buy.png'))   a visual click is always explicit
//   uiv.browser.type('text')                keystrokes into the FOCUSED element
//   uiv.desktop.click(m) / .type(t)         real OS input (XModule, screen px)
//   3+ calls of the same tier in a row? Alias it once and keep it readable:
//     const p = uiv.page, b = uiv.browser, x = uiv.desktop;
//     p.type('id=email', 'a@b.com');  b.click(uiv.findImage('buy.png'));
// NAVIGATE: uiv.open(url)   uiv.eval('return document.title')
//           the current URL is uiv.eval('return location.href') — !URL is table-macros-only
// MISC: uiv.log(msg, 'green')   uiv.sleep('1s')   uiv.getVar('!LASTCOMMANDOK')   uiv.setVar('n', 1)
//       uiv.exit('reason')  -> end the run EARLY AS A SUCCESS (guard clauses;
//       a failed check still uses throw new Error(...))
// Long forms with options: uiv.findElements / findImages / ocr.findTexts
// LEGACY bridge (any classic command): uiv.run(command, target, value)

uiv.open('https://ui.vision/');
const title = uiv.eval('return document.title');
uiv.log(\`Page title: \${title}\`);

const headlines = uiv.$$('css=h2', { required: false });
uiv.log(\`Found \${headlines.length} h2 elements\`);

headlines.slice(0, 3).forEach((h, i) => {
  uiv.log(\`h2 #\${i + 1}: \${h.text}\`);
});

if (headlines.length > 0 && uiv.getVar('!BROWSER') !== 'firefox') {
  // hover the first one — CDP input, so Chrome/Edge only
  uiv.browser.move(headlines[0]);
}
`

// What "+ Macro" writes. Deliberately NOT the starter script above: that one
// is a tutorial to read, and having to delete 40 lines of it before writing
// anything is the wrong way to begin a macro you already know you want. The
// tutorial still greets the never-saved Untitled editor, where there is
// nothing else to show.
export const NEW_MACRO_SCRIPT = `// New macro — runnable uiv.* examples are in the Demos folder
`

// The three macros a FRESH INSTALL ships with (written to the tree root as
// "A short welcome tour.js", "Like Ui.Vision？Give us a star 🌟.js" (fullwidth
// ？ — the ASCII one is illegal in Windows file names and sanitizeFileName
// strips it, and macros are real files in hard-drive storage mode) and
// "Draw a cat🐱.js" — see installWelcomeMacro in actions/index.js). All are
// also part of the JS demo set below, so the restore button brings them back
// after the user deletes the root copies.
export const WELCOME_SCRIPT = `// A little guided tour of Ui.Vision — and of uiv.banner, the on-page
// overlay that tells the PERSON WATCHING what the macro is doing
// (uiv.log talks to the log panel; uiv.banner talks to the human).
// The banner survives page navigation and each call replaces the last one.
// The 3s sleeps here are PRESENTATION pauses so the tour is easy to follow —
// a working macro needs none of them (finders auto-wait).
uiv.open('https://ui.vision/');
uiv.banner('Welcome to Ui.Vision');
uiv.sleep('3s');

uiv.open('https://ui.vision/contact');
uiv.page.type('id=ContactName', 'Robby the Robot');
uiv.page.type('id=Email', 'robby.the.robot@example.com');
// banners take HTML — style what matters — and a green success tone
uiv.banner('Ui.Vision can do many things, for example <b style="color:#389e0d">fill out forms for you</b>', { tone: 'green' });
uiv.sleep('3s');

uiv.open('https://forum.ui.vision/');
uiv.banner('If you have any question or suggestion, the user forum is a great place to meet other users and the developers');
// the last banner stays visible for a few seconds after the run ends
`

// Preinstalled next to the welcome tour. Stars the Ui.Vision repo on GitHub —
// and doubles as a demo of uiv.banner plus finder-based state detection on a
// CSP-strict site (GitHub blocks uiv.eval, so everything is read through DOM
// finders instead).
export const STAR_SCRIPT = `// Star the Ui.Vision RPA project on GitHub — narrated with uiv.banner.
// GitHub's CSP forbids uiv.eval on its pages, so everything is read
// through DOM finders (content-script world) instead.
uiv.open('https://github.com/A9T9/RPA');
uiv.banner('Off to GitHub to star the Ui.Vision RPA project…');

// GitHub marks the login state on <body> itself: class "logged-in" vs "logged-out"
if (!uiv.findElements('css=body.logged-in', { required: false, timeout: 3 }).length) {
  uiv.banner('<b>Thanks for trying to star the project!</b> Sadly you are not logged in to GitHub — please sign in and run me again.', { seconds: 10 });
} else if (uiv.findElements('xpath=//button[starts-with(normalize-space(.), "Starred")]', { required: false, timeout: 1 }).length) {
  // the header button reads "Starred <count>" when the repo is already starred
  uiv.banner('Thank you, you already starred it :)', { tone: 'green' });
} else {
  uiv.banner('Clicking the Star button for you…');
  uiv.page.click('xpath=//button[starts-with(normalize-space(.), "Star") and not(starts-with(normalize-space(.), "Starred"))]');
  // the button flipping to "Starred" is the proof the star registered
  // (finders auto-wait, so this doubles as the verify)
  uiv.$('xpath=//button[starts-with(normalize-space(.), "Starred")]');
  uiv.banner('Starred! Thank you for supporting Ui.Vision ⭐', { tone: 'green' });
}
`

// Preinstalled next to the welcome tour: a fun, visible showcase of what a JS
// macro can do — trusted CDP input (uiv.browser.down/move/up drags on a canvas
// app), DOM-locator tool selection with a coordinate fallback, uiv.banner, a
// real typed text element, and a self-check against the app's own scene state.
export const CAT_SCRIPT = `// Draw a smiling cat on excalidraw.com — precise shapes via the ellipse and
// line tools, freehand only where a wobble looks good (ears, nose, pupils,
// smile, tail) — then greet with a REAL text element, typed with the text tool.
// Trusted CDP input (uiv.browser.*), so Chrome/Edge only, no XModule needed.
// CDP input does not exist on Firefox — say so and point to the twin that
// works there, then END THE RUN GREEN with uiv.exit: "wrong browser" is an
// answered question, not a broken macro — and unlike a throw, uiv.exit
// keeps the banner on screen. (Environment facts like !BROWSER are readable
// from the first line, so the guard runs before anything else does.)
if (uiv.getVar('!BROWSER') === 'firefox') {
  uiv.banner('This drawing demo uses trusted CDP input (uiv.browser.*), which only <b>Chrome and Edge</b> support. For Firefox there is an <b>XClick version</b>: "Draw a cat🐱 - XClick version" in the demo collection, folder Demo and QA Test Scripts > XModules (if the folder is missing: Settings > General > For Tech Support/QA > Restore Demo Macros (JavaScript)).', { seconds: 25 });
  uiv.exit('Firefox detected — this demo needs Chrome or Edge. Use "Draw a cat🐱 - XClick version" from Demo and QA Test Scripts > XModules instead.');
}

uiv.open('https://excalidraw.com/');
uiv.banner('<b>Ui.Vision drawing demo</b> — this macro is not affiliated with or endorsed by Excalidraw.', { seconds: 10 });
const c = uiv.$('css=canvas'); // auto-waits until the app has rendered
const b = uiv.browser;

// Clear any existing scene so re-runs start blank
try {
  b.type('\${KEY_ESC}');
  b.type('\${KEY_CTRL+KEY_A}');
  b.type('\${KEY_DEL}');
} catch (e) {
  uiv.log('Canvas clear skipped: ' + e.message, 'blue');
}

const cx = c.x;      // cat center = canvas center
const cy = c.y - 20; // nudged up so the body fits above the bottom bar
const P = (p) => [Math.round(cx + p[0]), Math.round(cy + p[1])];

// Excalidraw reverts to the selection tool after each shape - re-select before
// every element. Prefer the DOM locator, fall back to the toolbar position
// (the toolbar is horizontally centered; icons sit at y=40).
const TOOL_DX = { rectangle: -127, ellipse: -43, line: 41, freedraw: 83, text: 125 };
const selectTool = (testid) => {
  const t = uiv.$('css=[data-testid="toolbar-' + testid + '"]', { required: false, timeout: 3 });
  if (t) { uiv.page.click(t); } else { b.click(cx + TOOL_DX[testid], 40); }
};

// One polyline = one press-drag-release: down holds the button, every move
// while it is held drags, up releases at the last point
const drag = (pts) => {
  const [x0, y0] = P(pts[0]);
  b.down(x0, y0);
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = P(pts[i]);
    b.move(x, y);
  }
  const [xn, yn] = P(pts[pts.length - 1]);
  b.up(xn, yn);
};

// Body first (ellipse), then head on top, so overlaps look tidy
selectTool('ellipse');
drag([[-78,74],[78,198]]);   // body: oval tucked under the chin
selectTool('ellipse');
drag([[-110,-90],[110,70]]); // head: wide oval

// Ears: freehand triangles with midpoints on each edge so the lines stay straight
selectTool('freedraw');
drag([[-88,-60],[-80,-99],[-72,-138],[-55,-111],[-38,-84]]);
drag([[38,-84],[55,-111],[72,-138],[80,-99],[88,-60]]);

// Eyes: two small precise ovals, each with a freehand pupil dot inside
selectTool('ellipse');
drag([[-60,-40],[-35,-10]]);
selectTool('ellipse');
drag([[35,-40],[60,-10]]);
selectTool('freedraw');
drag([[-51,-25],[-47,-28],[-44,-25],[-47,-22],[-51,-25]]);
drag([[44,-25],[48,-28],[51,-25],[48,-22],[44,-25]]);

// Nose: freehand triangle, closed
drag([[-13,2],[13,2],[0,24],[-13,2]]);
// Smile: wide upward curve under the nose
drag([[-32,30],[-18,42],[0,47],[18,42],[32,30]]);

// Whiskers: straight line-tool strokes, three per side
const whiskers = [
  [[-70,10],[-130,0]], [[-70,20],[-132,22]], [[-70,30],[-128,42]],
  [[70,10],[130,0]],  [[70,20],[132,22]],  [[70,30],[128,42]]
];
for (const w of whiskers) {
  selectTool('line');
  drag(w);
}

// Tail: one freehand curve swinging up from the body
selectTool('freedraw');
drag([[75,160],[115,150],[140,120],[145,85]]);

// Headline as a REAL text element: text tool -> click above the cat -> type -> Escape commits
const GREETING = 'Welcome to Ui.Vision';
selectTool('text');
b.click(cx - 105, cy - 195);
b.type(GREETING);
b.type('\${KEY_ESC}');

b.type('\${KEY_ESC}'); // deselect so no selection handles linger

// PROVE the drawing landed: count elements by type in Excalidraw's persisted
// scene, and check the text element carries the exact greeting
let counts = null;
for (let t = 0; t < 10; t++) {
  counts = uiv.eval('var els; try { els = JSON.parse(localStorage.getItem("excalidraw") || "[]"); } catch (e) { els = []; } if (!Array.isArray(els)) { els = []; } var r = {ellipse: 0, freedraw: 0, line: 0, text: 0, textContent: ""}; for (var i = 0; i < els.length; i++) { var el = els[i]; if (el.isDeleted) { continue; } if (el.type === "text") { r.text++; r.textContent = el.text; } else if (r[el.type] !== undefined) { r[el.type]++; } } return r;');
  if (counts.ellipse >= 4 && counts.freedraw >= 7 && counts.line >= 6 && counts.text >= 1) { break; }
  uiv.sleep(500); // pacing the localStorage poll - persistence is debounced
}
if (counts.ellipse < 4 || counts.freedraw < 7 || counts.line < 6) {
  throw new Error('Scene has ' + counts.ellipse + '/4 ellipses, ' + counts.freedraw + '/7 freedraw, ' + counts.line + '/6 lines - cat did not land');
}
if (counts.text < 1 || counts.textContent !== GREETING) {
  throw new Error('Text element missing or wrong: found ' + counts.text + ' text element(s), content "' + counts.textContent + '"');
}
uiv.log('Cat + greeting drawn: ' + counts.ellipse + ' ellipses, ' + counts.line + ' lines, ' + counts.freedraw + ' strokes, text "' + counts.textContent + '"', 'green');
`

export const JS_DEMOS = [
  {
    // a fresh install also writes this macro at the TREE root (see
    // installWelcomeMacro); this copy in the demo folder is what the
    // restore button brings back after the root copy is deleted
    fileName: 'A short welcome tour.js',
    path: 'Core/A short welcome tour.js',
    title: 'Welcome tour (JS)',
    code: WELCOME_SCRIPT
  },
  {
    // also written at the tree root on a fresh install, like the welcome tour
    fileName: 'Like Ui.Vision？Give us a star 🌟.js',
    path: 'Core/Like Ui.Vision？Give us a star 🌟.js',
    title: 'Star on GitHub (JS)',
    code: STAR_SCRIPT
  },
  {
    // also written at the tree root on a fresh install; CDP input, so it
    // lives with the other Chrome/Edge-only demos
    fileName: 'Draw a cat🐱.js',
    path: 'Browser Vision (Chrome, Edge)/Draw a cat🐱.js',
    title: 'Draw a cat (JS)',
    code: CAT_SCRIPT
  },
  {
    fileName: 'DemoBannerWaitForHuman.js',
    path: 'Core/DemoBannerWaitForHuman.js',
    title: 'Banner: human in the loop (JS)',
    code: `// uiv.banner for ATTENDED automation: the macro hands a step to the
// human — a captcha, a 2FA code, a judgment call — tells them so ON the
// page, and waits until they did it. No dialog to dismiss, nothing to
// click: the banner ignores mouse events, so the page stays fully usable.
uiv.open('https://ui.vision/contact');

// the browser may RESTORE a previously typed value into the form — clear it,
// or the "wait for the human" below would be over before it began
uiv.page.type('id=ContactName', '');

// HTML is allowed — highlight what matters
uiv.banner('<b>Your turn:</b> please type your name into the form field. The macro continues 3 seconds after you stop typing.', { position: 'bottom' });

// Wait until the human has FINISHED typing, not merely started: accept the
// value once it is non-empty and unchanged for 3 polls in a row (~3s of
// silence). Grabbing the field on the first non-empty read would run off
// with the first keystrokes. (Alternative pattern: require a terminator —
// loop until the value ends with '.' — when the pause heuristic is too soft.)
const start = Date.now();
let prev = '';
let stable = 0;
while (stable < 3) {
  if (Date.now() - start > 180000) {
    throw new Error('Gave up after 3 minutes of waiting for the name');
  }
  uiv.sleep('1s');
  const v = (uiv.$('id=ContactName').value || '').trim();
  stable = (v && v === prev) ? stable + 1 : 0;
  prev = v;
}
const name = prev;

// ... and the macro takes over again
uiv.banner(\`Thanks, \${name}! The macro fills in the rest for you.\`);
uiv.page.type('id=Email', \`\${name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@example.com\`);
uiv.sleep('3s');
uiv.banner(\`All done, \${name} \\u2014 this is how a macro asks for a captcha or a confirmation without stopping.\`, { seconds: 6 });
`
  },
  {
    fileName: 'DemoFrames.js',
    path: 'Core/DemoFrames.js',
    title: 'DemoFrames (JS)',
    code: `// JS version of the DemoFrames macro.
// The table version needs selectFrame index=0..4 before each field. In JS
// the FINDER (uiv.$) pierces same-origin frames — pass its match to
// uiv.page.type and the fill happens inside the right frame. DOM input, so
// this demo runs in every browser (Firefox included).
uiv.open('https://ui.vision/demo/webtest/frames/');

for (let i = 1; i <= 5; i++) {
  uiv.page.type(uiv.$(\`name=mytext\${i}\`), \`Frame\${i} - filled by JS, no selectFrame!\`);
}

// The embedded Google Form is a CROSS-ORIGIN iframe (docs.google.com)
// inside frame 3. The DOM finder sees elements there too (the extension
// has an agent in every frame); such matches carry frame-local coords
// and a frameLocal flag, and uiv.page.* routes them to a DOM action
// inside that frame.
uiv.page.click(uiv.$('xpath=//span[contains(text(),".Vision IDE")]'));

// several text inputs exist on this page (the 5 frame fields above!) —
// pick the one inside the cross-origin form via the frameLocal flag
const inputs = uiv.$$('xpath=//input[@type="text"]');
const formInput = inputs.find(input => input.frameLocal);

if (formInput) {
  uiv.page.type(formInput, 'Filled from JS across a cross-origin iframe!');
}
uiv.log('DemoFrames (JS) completed - no selectFrame anywhere', 'green');
`
  },
  {
    fileName: 'DemoIframe.js',
    path: 'Core/DemoIframe.js',
    title: 'DemoIframe (JS)',
    code: `// JS version of the DemoIframe macro. The embedded Google Form is a
// CROSS-ORIGIN iframe (docs.google.com inside ui.vision). The classic
// macro needs selectFrame to hop into it; the DOM finder just finds the
// elements — cross-origin matches carry frame-local coordinates and
// uiv.click runs a DOM click inside that frame automatically.
uiv.open('https://ui.vision/demo/iframes');

// every target lives INSIDE the iframe, so each one goes through the
// frame-piercing finder; uiv.page.* acts on the match in the right frame
uiv.page.click(uiv.$('xpath=//span[contains(text(),".Vision IDE")]'));
uiv.page.type(uiv.$('xpath=//input[@type="text"]'), 'Automating a cross-origin iframe from JS');

// to page 2 of the form ("Next" localizes, so match both)
uiv.page.click(uiv.$('xpath=//span[text()="Next" or text()="Weiter"]'));

// page 2: the visible answer field is a textarea (the classic macro's
// name=entry... target is a HIDDEN input - visible-by-default finds
// the field a human would use)
uiv.page.type(uiv.$('css=textarea'), 'Form Filling Test Done!');
// (Submit intentionally skipped - this demo stops before submitting)
uiv.log('DemoIframe (JS) completed - page 2 of a cross-origin iframe form', 'green');
`
  },
  {
    fileName: 'DemoAutofill.js',
    path: 'Core/DemoAutofill.js',
    title: 'DemoAutofill (JS)',
    code: `// JS version of the DemoAutofill macro — Google Form filling with plain DOM
// clicks and typing, so it runs in EVERY browser, Firefox included. The
// DemoAutofillChrome variant (in "Browser Vision (Chrome, Edge)") fills the
// same form with trusted CDP input instead.
// special variables are read and written by name — the same names as
// \${!TIMEOUT_PAGELOAD} in a table macro
uiv.setVar('!TIMEOUT_PAGELOAD', 60);
uiv.open('https://docs.google.com/forms/d/1cbI5dMRs0-t_IwNzPm6T3lAG_nPgsnJZEA-FEYVARxg/');

uiv.page.click('xpath=//span[contains(text(),".Vision IDE")]');
uiv.page.click("xpath=//*[text()[contains(.,'Web Testing')]]");
uiv.page.click('xpath=//span[contains(text(),"Form Autofilling")]');
uiv.page.click('xpath=//*[text()[contains(.,"General Web Automation")]]');
uiv.shot.viewport('AutoFillJS_page1');

// "Next" button (same locator as the table macro uses)
uiv.page.click('xpath=//*[@id="mG61Hd"]/div/div/div[3]/div/div/div/span/span');

// page 2: uiv.page.type fills a field in ONE call — no click to focus needed,
// and multiline text is just \\n in the string
uiv.page.type('xpath=//input[@type="text"]', 'This is a single line test...');
uiv.page.type('xpath=//textarea', '...and this a multiline test:\\nLine2\\nLine3');
uiv.shot.viewport('AutoFillJS_page2');
uiv.page.click('xpath=//*[@id="mG61Hd"]/div/div/div[3]/div[1]/div[1]/div[2]/span/span');
uiv.log('DemoAutofill (JS) completed!', '#shownotification');

// assertTitle, the JS way
uiv.open('https://ui.vision/rpa/docs/selenium-ide/form-filling');
const title = uiv.eval('return document.title');

if (!title.includes('Form Filling')) {
  throw new Error(\`unexpected title: \${title}\`);
}
uiv.log(\`Title check passed: \${title}\`, 'green');
`
  },
  {
    fileName: 'DemoTabs.js',
    path: 'Core/DemoTabs.js',
    title: 'DemoTabs (JS)',
    code: `// JS version of the DemoTabs macro — same flow, same tab numbering as
// the classic one. A click that opens a new tab does NOT hand focus to it
// (a dispatched click carries no user activation, so the tab opens in the
// background), so switch explicitly with uiv.tabs.select. All primitives
// target the tab the script acts on, and every uiv.tabs.* call activates
// and RETURNS the tab it lands on, so after each switch the whole API
// follows automatically.
//
// uiv.tabs indexes are ABSOLUTE (1..N, what the tab bar shows). The classic
// macro counted RELATIVE to the start tab (tab=1 = first tab to its right) —
// that is just startTabIndex + N here, so the flow and the numbers below
// stay identical to the classic demo.
uiv.open('https://ui.vision/demo/tabs');

// Tab position comes from the uiv.tabs API, not a !variable: the classic
// \${!CURRENT_TAB_NUMBER} / \${!current_tab_number_relative} pair is
// table-macro bookkeeping and THROWS in a script — only classic-player
// commands refresh it, so next to uiv.tabs.* it goes silently stale.
// Every uiv.tabs.* call returns where you are, and uiv.tabs.list() marks
// the tab the script acts on with current: true. Indexes are 1-based,
// what the tab bar shows. For the classic macro's "relative" numbers,
// capture the start index once and subtract: same numbers, same asserts.
const tabAbs = () => uiv.tabs.list().find((t) => t.current).index;
const startTabIndex = tabAbs();
const tabRel = () => tabAbs() - startTabIndex;
const logTabs = (color) => {
  uiv.log(\`TabIndexAbsolute=\${tabAbs()} TabIndexRELATIVE=\${tabRel()}\`, color);
};
const assertTabRel = (want, where) => {
  const got = tabRel();
  if (got !== want) {
    throw new Error(\`relative tab index at \${where}: expected \${want}, got \${got} \` +
      \`(absolute \${tabAbs()}, start tab \${startTabIndex})\`);
  }
};

// a dispatched click carries no user activation: Chrome opens the link's
// tab in the BACKGROUND, Firefox's popup blocker eats it entirely — detect
// that and open the link's href directly (the uiv.tabs.select calls below
// address tabs absolutely, so both routes continue identically)
const openLinkedTab = (linkText) => {
  const before = uiv.tabs.list().length;
  uiv.page.click('link=' + linkText);
  uiv.sleep('1s'); // let a background tab finish opening
  if (uiv.tabs.list().length > before) return; // Chrome: opened in background
  const href = uiv.eval("var a = Array.prototype.find.call(document.links, function (x) { return x.textContent.trim() === '" + linkText + "'; }); return a ? a.href : null");
  if (!href) { throw new Error('link not found: ' + linkText); }
  uiv.tabs.open(href); // Firefox: same tab, opened the JS-native way
};

openLinkedTab('Open new web page in new browser tab');
uiv.tabs.select(startTabIndex + 1); // classic tab=1: first tab right of the start tab
const t1 = uiv.eval('return document.title');
if (!t1.includes('TAB1')) { throw new Error(\`expected TAB1, got: \${t1}\`); }
logTabs('blue');
assertTabRel(1, 'after tabs.select(start + 1)');
uiv.page.type('id=sometext1', 'this is tab 1 (typed from JS)');

// opened from TAB1 (the rightmost tab), so the new tab lands after it = start + 2
openLinkedTab('Open yet another web page in a new browser tab');
uiv.tabs.select(startTabIndex + 2);
const t2 = uiv.eval('return document.title');
if (!t2.includes('TAB2')) { throw new Error(\`expected TAB2, got: \${t2}\`); }
uiv.page.type('id=sometext2', 'And this is tab 2! (JS)');

// back to TAB1 and close it — what was TAB2 then moves one place left
uiv.tabs.select(startTabIndex + 1);
uiv.page.type('id=sometext1', 'Now back in tab 1 - test done! (JS)');
uiv.tabs.close();
uiv.sleep('1s');
const t3 = uiv.eval('return document.title');
if (!t3.includes('TAB2')) { throw new Error(\`expected TAB2 after close, got: \${t3}\`); }
uiv.log(\`After close, now on: \${t3}\`);

uiv.tabs.select(startTabIndex + 1);
const t4 = uiv.eval('return document.title');
if (!t4.includes('TAB2')) { throw new Error(\`expected TAB2 via start + 1, got: \${t4}\`); }
logTabs('green');
assertTabRel(1, 'the old TAB2 is now first right of the start tab');

// uiv.tabs.open always appends a new tab at the far RIGHT of the window,
// switches to it and waits for it — each one lands one place right of the
// previous (the classic tab=open, minus the sleep it needed)
uiv.tabs.open('https://ui.vision');
uiv.log(\`Opened new tab: \${uiv.eval('return document.title')}\`);
const afterFirstOpen = tabAbs();
uiv.tabs.open('https://ocr.space');
uiv.log(\`Opened new tab: \${uiv.eval('return document.title')}\`);

logTabs('brown');

// Catching tab bugs is the whole point of these numbers, so both checks are
// hard failures. First the invariant that defines tabs.open — each one appends
// exactly one tab further right:
if (tabAbs() !== afterFirstOpen + 1) {
  throw new Error(\`tabs.open should append one tab to the right: was \${afterFirstOpen}, now \${tabAbs()}\`);
}

// ...then the classic macro's last assert: relative position 3 (start tab,
// then TAB2, ui.vision, ocr.space). Like the classic macro this assumes the
// run started in a window with no tabs to the RIGHT of the start tab, since
// tabs.open appends past them — if this is the only check that fails, that
// is why.
assertTabRel(3, 'final');
uiv.log('DemoTabs (JS) completed', 'green');
`
  },
  {
    fileName: 'DemoDownload.js',
    path: 'Core/DemoDownload.js',
    title: 'DemoDownload (JS)',
    code: `// Port of Classic/Core/DemoDownload — built on uiv.download, which
// replaces the classic onDownload/saveItem pair: it downloads, renames,
// WAITS for completion and returns the name the file got on disk.
const d = new Date();
const todaydate = \`\${d.getFullYear()}-\${d.getMonth() + 1}-\${d.getDate()}\`;
uiv.log(\`Today is \${todaydate}\`);

uiv.open('https://ui.vision/demo/filedownload');

// !RUNTIME is the run's elapsed time as "12.34s" — parseFloat drops the unit
const elapsed = () => parseFloat(uiv.getVar('!RUNTIME'));

// Form 1 — locator: "save link as". The file behind the link's href is
// downloaded WITHOUT clicking, so no navigation can get in the way.
let started = elapsed();
const file1 = uiv.download('link=XModules for Windows', { as: \`DownloadTest1_\${todaydate}.exe\` });
uiv.log(\`File name on disk is \${file1}\`, 'blue');
uiv.log(\`Download1 (Windows version) took \${(elapsed() - started).toFixed(2)} seconds\`, 'blue');

// Form 2 — trigger function: for downloads only a CLICK can start (JS-built
// blobs, POST exports). The click runs between arming and waiting, so the
// download it causes is captured, renamed and awaited.
// classic partialLinkText= is just an xpath substring match. Use
// normalize-space(.) — contains(text(),..) reads only the first direct text
// node and ignores whitespace, so it misses <a><span>for macOS</span></a>
started = elapsed();
const file2 = uiv.download(function () {
  uiv.page.click('xpath=//a[contains(normalize-space(.), "for macOS")]');
}, { as: \`DownloadTest2_\${todaydate}.exe\` });
uiv.log(\`File name on disk is \${file2}\`, 'green');
uiv.log(\`Download2 (Mac) took \${(elapsed() - started).toFixed(2)} seconds\`, 'green');

uiv.log('All done...');
uiv.page.click('link=OnDownload command');
`
  },
  {
    fileName: 'DemoTakeScreenshots.js',
    path: 'Core/DemoTakeScreenshots.js',
    title: 'DemoTakeScreenshots (JS)',
    code: `// Port of Classic/Core/DemoTakeScreenshots.
// Screenshots and storeImage have no native uiv methods (they write files
// rather than return values), so they use the legacy bridge.
uiv.open('https://ui.vision/blog/');
uiv.shot.page('rpablog');

// classic "linkText=read more@POS=1" — in JS the position is just an index
const readMore = uiv.$$('link=read more');
uiv.log(\`Found \${readMore.length} "read more" links\`);

uiv.page.click(readMore[0]);
uiv.shot.page('article1');

uiv.open('https://ui.vision/blog/');
uiv.page.click(uiv.$$('link=read more')[1]);
uiv.shot.page('article2');
uiv.shot.viewport('article2_just_viewport');

// screenshot of a single ELEMENT, then OCR it to verify the content
const titleShot = uiv.shot.element('xpath=//a[contains(normalize-space(.), "Blog")]', 'blogtitle');

// the shot's file name feeds straight into the reader — no engine pin: this
// read uses the engine configured in Settings > OCR. ({engine: 99}, the
// XModule Local OCR, reads best when installed; {engine: 2}/{engine: 3} are
// the cloud engines.)
uiv.setVar('!OCRLANGUAGE', 'eng');
const ocrResult = uiv.ocr.read({ image: titleShot });
uiv.log(\`OCR Result = \${ocrResult}\`, 'blue');

if (String(ocrResult).includes('RPA')) {
  uiv.log('yes, screenshot taking and OCR worked', 'green');
} else {
  throw new Error(\`OCR did not find "RPA" in the element screenshot: \${ocrResult}\`);
}
`
  },
  {
    fileName: 'DemoImplicitWaiting.js',
    path: 'Core/DemoImplicitWaiting.js',
    title: 'DemoImplicitWaiting (JS)',
    code: `// Port of Classic/Core/DemoImplicitWaiting.
// The whole waitForElementVisible concept disappears in JS: uiv.$ auto-waits
// up to !TIMEOUT_WAIT and throws if the element never appears, so finding it
// IS the wait.
uiv.open('https://ui.vision/demo/waitforelementvisible');

uiv.page.click(uiv.$('css=#div1 > h1'));

uiv.setVar('!TIMEOUT_WAIT', 20);
uiv.page.click(uiv.$('css=#div2 > h1'));

// Implicit waiting: elements that appear later are simply found later
uiv.open('https://ui.vision/demo/webtest/implicitwaiting/');
uiv.setVar('!TIMEOUT_WAIT', 15);

// classic assertText -> read the text and check it yourself
const intro = uiv.$('xpath=/html/body/header/center/p[2]').text;
if (!intro.includes('Use the select box to start the timer')) {
  throw new Error(\`unexpected intro text: \${intro}\`);
}

uiv.page.select('id=minutesSelect', '5 Seconds');
uiv.log(\`The next element is not on the page yet — uiv.$ waits up to \${uiv.getVar('!TIMEOUT_WAIT')}s for it\`, 'blue');
uiv.page.click(uiv.$('xpath=/html/body/header/center/img'));

// --- the other half: waiting for something that may NOT be there ------------
// A cookie bar or a "we are busy" popup is there on some runs and not on
// others. {required: false} turns a miss from an exception into a plain null —
// but it does NOT shorten the wait: the finder polls until the deadline either
// way, and the flag only decides what the deadline does. So an optional step
// wants a SHORT timeout too, otherwise every run without the popup pays the
// full !TIMEOUT_WAIT for nothing.
const popup = uiv.$('css=#a-popup-that-is-not-on-this-page', { required: false, timeout: 2 });
if (popup) {
  uiv.page.click(popup);
  uiv.log('Optional popup was there — closed it', 'green');
} else {
  uiv.log('No optional popup this run — skipped it in 2s', 'blue');
}
// The null has to be CHECKED, as above. Feeding it straight to an action —
// uiv.page.click(uiv.$('css=#nope', {required: false})) — throws on the very
// null it asked for, and wrapping THAT in try/catch hides real errors: a
// mistyped image file name then logs as "not present" and you debug the wrong
// thing. {required: false} is for ABSENCE, try/catch is for ERRORS.
// Visual targets work the same way:
//   const x = uiv.findImage('close.png', {required: false, timeout: 2});
//   if (x) uiv.page.click(x);

// Note what is NOT in this macro: uiv.sleep. Every wait above is a wait for a
// THING (an element, a page load), never for a TIME. A fixed sleep is too long
// when the site is fast and too short when it is slow — which is the whole
// reason auto-waiting exists.
uiv.log('DemoImplicitWaiting (JS) completed', 'green');
`
  },
  {
    fileName: 'DemoCsvSave.js',
    path: 'Core/DemoCsvSave.js',
    title: 'DemoCsvSave (JS)',
    code: `// Port of Classic/Core/DemoCsvSave.
// The classic macro builds a row by storing cell after cell into the magic
// !csvLine variable and then csvSave-ing it. In JS a row is just an array.
uiv.open('https://ui.vision/demo/csvsave');

const d = new Date();
const pad = (n) => (n < 10 ? '0' + n : String(n));
const timestamp = \`\${d.getFullYear()}-\${pad(d.getMonth() + 1)}-\${pad(d.getDate())} \${pad(d.getHours())}:\${pad(d.getMinutes())}\`;

// The classic macro reaches into the currency widget with seven xpaths, each
// hard-coding a GENERATED id (gcw_main...). That id changes whenever the widget
// re-renders, and the markup around it changes too — both the original and a
// tidier //table//tbody/tr[2]/td/a broke on it.
//
// A demo about SAVING data should not be a lesson in third-party DOM. Read the
// rendered text once and pull the numbers out of it: no locator to rot.
const pageText = uiv.eval('return document.body.innerText');
const rates = (pageText.match(/\\d+[.,]\\d{2,}/g) || []).slice(0, 7);

uiv.log(\`Found \${rates.length} rate-like numbers on the page\`);

if (rates.length === 0) {
  throw new Error('no exchange-rate numbers found on the page — the demo page or its currency widget changed');
}

const row = [timestamp].concat(rates);
uiv.log(row.join(' | '));

// append the row (creates the file on the first run)
uiv.csv.append('CurrencyConverterData.csv', row);
uiv.log(\`CurrencyConverterData.csv now has \${uiv.csv.read('CurrencyConverterData.csv').length} rows\`, 'green');

// download the CSV to the browser's download folder
uiv.exportToDownloads('currencyconverterdata.csv');
`
  },
  {
    fileName: 'Sub_DemoCsvRead_FillForm.js',
    path: 'Core/Sub/Sub_DemoCsvRead_FillForm.js',
    title: 'Sub_DemoCsvRead_FillForm (JS)',
    code: `// Port of Classic/Core/Sub/Sub_DemoCsvRead_FillForm — the subroutine of
// DemoCsvReadWithWhile.
//
// The classic version is a macro called with \`run\`, so it communicated through
// the shared variable pool: the caller left !COL1..!COL3 and !csvReadLineNumber
// lying around and this macro read them. In JS it is a FUNCTION with
// arguments, so nothing leaks in either direction.
//
// Include it from another script with:
//   // @include Demo and QA Test Scripts/Core/Sub/Sub_DemoCsvRead_FillForm.js

function fillFormFromRow (row, lineNumber) {
  uiv.log(\`Filling the form from CSV row \${lineNumber}: \${row.join(', ')}\`, 'green');

  // /viewform is the public fill-out view — a bare /view redirects to a
  // Google error/sign-in page with no form inputs, and every row times out
  uiv.open('https://docs.google.com/forms/d/e/1FAIpQLScGWVjexH2FNzJqPACzuzBLlTWMJHgLUHjxehtU-2cJxtu6VQ/viewform');

  uiv.page.type("xpath=//input[@type='text']", \`\${row[0]}_\${lineNumber}\`);
  uiv.page.type('xpath=//div[3]/div/div/div[2]/div/div/div/div/input', row[1]);
  uiv.page.type('xpath=//div[4]/div/div/div[2]/div/div/div/div/input', row[2]);

  uiv.page.click('xpath=//span/span');
}

// uiv.main is true ONLY when this file is the macro being run, so opening it
// and pressing Play tests the form filling on its own — and including it from
// DemoCsvReadWithWhile stays silent.
if (uiv.main) {
  fillFormFromRow(['SelfTest', 'row', 'values'], 0);
  uiv.log('Sub_DemoCsvRead_FillForm self-test done', 'green');
}
`
  },
  {
    fileName: 'DemoCsvReadWithWhile.js',
    path: 'Core/DemoCsvReadWithWhile.js',
    title: 'DemoCsvReadWithWhile (JS)',
    code: `// Port of Classic/Core/DemoCsvReadWithWhile.
//
// The classic macro reads the CSV one line at a time, tracking
// !csvReadLineNumber and !csvReadStatus by hand and looping while the status
// stays "OK". Here the file is simply an array, so the loop is a forEach and
// the bookkeeping variables disappear.
//
// The subroutine is a real function, spliced in before the script compiles:
// @include Demo and QA Test Scripts/Core/Sub/Sub_DemoCsvRead_FillForm.js

uiv.setVar('!TIMEOUT_MACRO', 180);

const rows = uiv.csv.read('ReadCSVTestData.csv');
uiv.log(\`ReadCSVTestData.csv has \${rows.length} rows\`, 'blue');

const failedRows = [];
rows.forEach((row, i) => {
  const lineNumber = i + 1; // classic !csvReadLineNumber is 1-based
  uiv.log(\`Reading CSV line No. \${lineNumber}\`);

  // the classic macro sets !errorIgnore around the call so one bad row does
  // not end the run — try/catch is the JS equivalent, and it can say WHICH row
  try {
    fillFormFromRow(row, lineNumber);
  } catch (e) {
    failedRows.push(lineNumber);
    uiv.log(\`Row \${lineNumber} failed: \${e.message}\`, 'red');
  }
});

// a script must prove its own success: tolerating a bad row is fine,
// tolerating EVERY row failing silently is how a dead form URL went unnoticed
if (failedRows.length === rows.length) {
  throw new Error(\`all \${rows.length} rows failed — the form page or its locators are broken\`);
}
uiv.log(\`DemoCsvReadWithWhile (JS) completed — \${rows.length - failedRows.length} of \${rows.length} rows filled\`, 'green');
`
  },
  {
    fileName: 'DemoCsvReadArray.js',
    path: 'Core/DemoCsvReadArray.js',
    title: 'DemoCsvReadArray (JS)',
    code: `// Port of Classic/Core/DemoCsvReadArray.
// The classic macro needs executeScript_Sandbox to build an array, csvSaveArray
// to store it, csvReadArray to get it back, and forEach/times commands to walk
// it. In a script an array is just an array.

// build a 5 x 3 array
const array1 = [];
for (let x = 0; x < 5; x++) {
  array1.push([\`\${x}0\`, \`\${x}1\`, \`\${x}2\`]);
}

// set two values directly
array1[0][2] = 'Hello World';
array1[2][1] = 'This is how you set an array value';

uiv.csv.write('data_from_array.csv', array1);

// read it back
const myCSV = uiv.csv.read('data_from_array.csv');
uiv.log(\`Number of rows = \${myCSV.length}\`, 'green');
uiv.log(\`Number of columns = \${myCSV[0].length}\`, 'pink');

// loop over every value — the classic nested forEach commands
myCSV.forEach(row => {
  uiv.log(\`col1=\${row[0]}, col2=\${row[1]}, col3=\${row[2]}\`, 'brown');
  row.forEach(elem => uiv.log(\`  Element=\${elem}\`, 'blue'));
});

// the classic "times" loop, with its !times-minus-one dance, is just an index
myCSV.forEach((row, i) => {
  uiv.log(\`Row \${i}, 3rd Element => \${row[2]}\`, 'blue');
});

if (myCSV[0][2] !== 'Hello World') {
  throw new Error(\`round-trip failed: expected 'Hello World', got '\${myCSV[0][2]}'\`);
}
uiv.log('DemoCsvReadArray (JS) completed', 'green');
`
  },
  {
    fileName: 'DemoIfElse.js',
    path: 'Core/DemoIfElse.js',
    title: 'DemoIfElse (JS)',
    code: `// Port of Classic/Core/DemoIfElse.
// This is the macro that argues best for scripts: gotoIf, label, gotoLabel and
// onError all become ordinary JavaScript, and the flow reads top to bottom
// instead of jumping between labels.
uiv.open('https://ui.vision/demo/executeScript');

const hour = uiv.eval('return new Date().getHours()');
uiv.log(\`mytime = \${hour}\`);

if (hour > 16) {
  uiv.log('Good afternoon!');
} else {
  uiv.log('Good morning!');
}

// classic storeAttribute fills the variable with "#LNF" when the locator does
// not match. In JS a finder given {required: false} returns an empty array, so
// "not found" is a plain length check — no magic sentinel value.
const missing = uiv.findElements("xpath=//input[@id='sometext-WRONG-ID-TEST']", { required: false });
if (missing.length === 0) {
  uiv.log('The xpath was not found — the array is simply empty, no #LNF needed', 'blue');
}

// classic storeAttribute needs no JS equivalent: reading a property or
// attribute IS a line of page JavaScript
const boxsize = Number(uiv.eval("return document.querySelector('#sometext').getAttribute('size')"));
uiv.log(\`With the correct xpath we get: Boxsize = \${boxsize}\`, 'green');

// classic gotoIf + gotoLabel + label -> if/else
if (boxsize > 70) {
  uiv.log('Input box too big. This is what the classic gotoIf branch did');
} else {
  uiv.page.type('id=sometext', \`This box is \${boxsize} chars wide\`);
  uiv.eval(\`document.title = '\${boxsize}'; return document.title\`);
}

// classic onError | #goto | fixerror -> try/catch, which also says WHY
try {
  uiv.page.type('id=sometext', 'this line works');
  uiv.page.type('id=sometextXXXXX', 'this line has the wrong ID...');
  uiv.log('this line is never reached, because of the error above', 'blue');
} catch (e) {
  uiv.log(\`here we can have code that handles the error: \${e.message}\`, 'green');
  uiv.page.type('id=sometext', 'Fix Error Section: This command works.');
}

uiv.log('DemoIfElse (JS) completed', 'green');
`
  },
  {
    fileName: 'DemoExtract.js',
    path: 'Core/DemoExtract.js',
    title: 'DemoExtract (JS)',
    code: `// Port of Classic/Core/DemoExtract.
// The classic macro needs storeAttribute, storeText, storeTitle, storeValue,
// storeChecked and six sourceExtract commands. Almost none of them need a
// uiv.* equivalent: reading the page IS what JavaScript does.
uiv.open('https://ui.vision/demo/executescript');

// The classic macro reads \${!URL} here. In a script that variable is only
// refreshed by the classic player, so it lags behind the page — ask the page.
uiv.log(\`Current page URL = \${uiv.eval('return location.href')}\`);
uiv.log('This macro shows various ways to extract and save data from a website');

// --- attributes: classic storeAttribute -------------------------------------
const imgSrc = uiv.eval("return document.querySelector('img.responsive-img').src");
uiv.log(\`href=\${imgSrc}\`);

const imgAlt = uiv.eval("return document.querySelector('img.responsive-img').alt");
uiv.log(\`alt text = \${imgAlt}\`);

const boxsize = Number(uiv.eval("return document.querySelector('#sometext').getAttribute('size')"));
uiv.log(\`input box size = \${boxsize}\`);

uiv.page.type('id=sometext', \`This box is \${boxsize} chars wide\`);
uiv.eval(\`document.title = '\${boxsize}'; return document.title\`);

// classic assertTitle -> read it and throw
const titleNow = uiv.eval('return document.title');
if (titleNow !== String(boxsize)) {
  throw new Error(\`assertTitle failed: expected '\${boxsize}', got '\${titleNow}'\`);
}

// --- text and values: classic storeText / storeTitle / storeValue -----------
const header = uiv.$('xpath=//*[@id="content"]/div[2]/div/h2[3]');
uiv.page.click(header);
uiv.log(\`header = \${header.text}\`);

uiv.log(\`page title = \${uiv.eval('return document.title')}\`);

const mytext = uiv.$('id=sometext').value;
uiv.page.select('id=tesla', 'Model Y');
const mytesla = uiv.$('id=tesla').value;
uiv.log(\`The text box contains [\${mytext}] and the select box has [\${mytesla}] selected\`);

// classic assertValue
if (mytesla !== 'y') {
  throw new Error(\`assertValue failed: select is '\${mytesla}', expected 'y'\`);
}

// --- checkboxes: classic storeChecked ---------------------------------------
const checked = uiv.eval("var els = document.getElementsByName('vehicle'); var out = []; for (var i = 0; i < els.length; i++) { out.push(els[i].checked); } return out");
uiv.log(\`User has bike:\${checked[0]}, car:\${checked[1]}, boat:\${checked[2]}\`, 'green');

// --- page SOURCE: classic sourceExtract -------------------------------------
// Six sourceExtract commands become ONE fetch of the source plus plain regex.
// @1,1 / @2 meant "which match, which capture group" — in JS that is just
// indexing, and you can see what you are indexing into.
const html = uiv.eval('return document.documentElement.outerHTML');

const prices = [];
const priceRe = /[$\\u00A3\\u20AC](\\d+(?:\\.\\d{1,2})?)/g;
let hit;
while ((hit = priceRe.exec(html)) !== null) { prices.push(hit[1]); }
uiv.log(\`Coffee costs \${prices[0]} and tea \${prices[1]}\`, 'blue');

const widths = [];
const widthRe = /_width: (\\d+)/g;
while ((hit = widthRe.exec(html)) !== null) { widths.push(hit); }
uiv.log(\`match1 = [\${widths[0][0]}] (group1 = [\${widths[0][1]}]) match2 = [\${widths[1][0]}] (group1 = [\${widths[1][1]}])\`, 'blue');

const gaId = (html.match(/G-[0-9A-Z]+/) || [])[0];
uiv.log(\`Google Analytics ID = \${gaId}\`, 'pink');

// the classic macro's QA assertion
if (widths[1][1] !== '22') {
  throw new Error(\`Regex extraction failed for match2 group 1: got \${widths[1][1]}, expected 22\`);
}

// --- screenshots: these WRITE FILES, so they stay on the legacy bridge ------
const mytitle = uiv.eval('return document.title');
uiv.shot.viewport(\`myscreenshot_\${mytitle}\`);
uiv.shot.element('xpath=//*[@id="page-header"]/div/div/h1', 'pagetitle.png');
uiv.exportToDownloads(\`myscreenshot_\${mytitle}.png\`);
uiv.exportToDownloads('pagetitle.png');

uiv.log('DemoExtract (JS) completed', 'green');
`
  },
  {
    fileName: 'DemoExecuteScript.js',
    path: 'Core/DemoExecuteScript.js',
    title: 'DemoExecuteScript (JS)',
    code: `// Port of Classic/Core/DemoExecuteScript.
// The classic macro is 49 commands, and most of them exist only to run a
// little JavaScript through executeScript_Sandbox and pass the result back
// through a variable. In a script that IS the language, so they just vanish.
uiv.open('https://ui.vision/demo/executescript');

// classic assertText / assertTitle -> read and throw
const heading = uiv.$('xpath=//*[@id="content"]/div[2]/div/h2[1]').text;
if (!heading.includes('Input box to display some results')) {
  throw new Error(\`unexpected heading: \${heading}\`);
}
if (uiv.eval('return document.title') !== 'Selenium IDE executeScript Demo Page') {
  throw new Error(\`unexpected page title: \${uiv.eval('return document.title')}\`);
}

// classic sourceSearch: count occurrences in the page source
const html = uiv.eval('return document.documentElement.outerHTML');
if (!html.includes('G-VJNCDYRXBP')) {
  throw new Error('Google Analytics ID is wrong!');
}

// --- calculations: no executeScript_Sandbox round trip needed ---------------
const AAA = 15;
const BBB = 10;
const CCC = AAA - BBB;
uiv.log(String(CCC));
uiv.eval(\`document.title = '\${CCC}'; return document.title\`);
if (uiv.eval('return document.title') !== '5') {
  throw new Error('title was not set to 5');
}

const upper = 'SELenium IDe'.toUpperCase();
uiv.log(upper);
uiv.page.type('id=sometext', upper);

// --- today's date in YYYY-MM-DD ---------------------------------------------
const d = new Date();
const pad = (n) => (n < 10 ? '0' + n : String(n));
const mydate = \`\${d.getFullYear()}-\${pad(d.getMonth() + 1)}-\${pad(d.getDate())}\`;
uiv.log(\`Today is \${mydate}\`);

// --- pick a random item, useful for data-driven testing ---------------------
const names = ['cat', 'dog', 'fish', 'dog', 'deer', 'frog', 'whale', 'dog', 'seal', 'horse'];
uiv.log(\`array length = \${names.length}\`);
const num = Math.floor(Math.random() * names.length);
uiv.log(\`num=\${num}\`);
const myrandomname = names[num];

const output = \`Today is \${mydate}, and we draw a \${myrandomname}\`;
uiv.log(output);
uiv.page.type('id=sometext', output);

// classic runtime assertion
const runtime = parseFloat(uiv.getVar('!RUNTIME'));
if (runtime > 20) {
  throw new Error(\`Runtime too slow (\${runtime} seconds), test failed\`);
}
uiv.log('Runtime Ok, test passed!', 'green');

// classic "linkText=This link@POS=3" — @POS is an array index in JS
const links = uiv.$$('link=This link');
uiv.log(\`\${links.length} links named "This link" — clicking the 3rd\`, 'green');
uiv.page.click(links[2]);

// classic forEach over an array built by executeScript
['Hello', 'World', '2020'].forEach(elem => uiv.log(elem, 'blue'));

uiv.log('DemoExecuteScript (JS) completed', 'green');
`
  },
  {
    fileName: 'DemoAutofillChrome.js',
    path: 'Browser Vision (Chrome, Edge)/DemoAutofillChrome.js',
    title: 'DemoAutofillChrome (JS)',
    code: `// Chrome/Edge variant of Core/DemoAutofill: the same Google Form, filled
// with TRUSTED input through the debugger API (uiv.browser.*) — no XModule
// needed, but not available on Firefox. Use it when a site ignores the
// synthetic events uiv.page.* sends.
if (uiv.getVar('!BROWSER') === 'firefox') {
  uiv.exit('This demo uses trusted CDP input (uiv.browser.*), which Firefox does not support — use Core/DemoAutofill instead (same form, DOM input, every browser).');
}
uiv.setVar('!TIMEOUT_PAGELOAD', 60);
uiv.open('https://docs.google.com/forms/d/1cbI5dMRs0-t_IwNzPm6T3lAG_nPgsnJZEA-FEYVARxg/');

uiv.browser.click('xpath=//span[contains(text(),".Vision IDE")]');
uiv.browser.click("xpath=//*[text()[contains(.,'Web Testing')]]");
uiv.browser.click('xpath=//span[contains(text(),"Form Autofilling")]');
uiv.browser.click('xpath=//*[text()[contains(.,"General Web Automation")]]');
uiv.shot.viewport('AutoFillJS_page1');

// "Next" button (same locator as the table macro uses)
uiv.browser.click('xpath=//*[@id="mG61Hd"]/div/div/div[3]/div/div/div/span/span');

// page 2: trusted keystrokes for both fields — in uiv.browser.type a \\n in
// the string is a real ENTER keystroke, which is a new line inside a textarea
uiv.browser.click('xpath=//input[@type="text"]');
uiv.browser.type('This is a single line test...');
uiv.browser.click('xpath=//textarea');
uiv.browser.type('...and this a multiline test:\\nLine2\\nLine3');
uiv.shot.viewport('AutoFillJS_page2');
uiv.browser.click('xpath=//*[@id="mG61Hd"]/div/div/div[3]/div[1]/div[1]/div[2]/span/span');
uiv.log('DemoAutofillChrome (JS) completed!', '#shownotification');

// assertTitle, the JS way
uiv.open('https://ui.vision/rpa/docs/selenium-ide/form-filling');
const title = uiv.eval('return document.title');

if (!title.includes('Form Filling')) {
  throw new Error(\`unexpected title: \${title}\`);
}
uiv.log(\`Title check passed: \${title}\`, 'green');
`
  },
  {
    fileName: 'DemoBrowserType.js',
    path: 'Browser Vision (Chrome, Edge)/DemoBrowserType.js',
    title: 'uiv.browser.type (JS)',
    code: `// uiv.browser.type: trusted keystrokes through the browser debugger
// API (CDP), no XModule needed. It types into the web page only — unlike
// uiv.desktop.type it cannot reach OS dialogs.
if (uiv.getVar('!BROWSER') === 'firefox') {
  uiv.exit('This demo uses trusted CDP input (uiv.browser.*), which Firefox does not support — Chrome/Edge only.');
}
const b = uiv.browser;

uiv.open('https://www.wikipedia.org');

// focus the search box with a trusted click, then type a (wrong) term
b.click('css=#searchInput');
b.type('Selenium');

// fix it: CTRL+A selects everything in the field, then overwrite and submit
b.type('\${KEY_CTRL+KEY_A}');
b.type('Robotic process automation\${KEY_ENTER}');

// The classic macro pauses 3s here. Auto-wait is better — but ONLY on an
// element unique to the target state: css=h1 exists on the Wikipedia portal
// too, so it matched the OLD page instantly and waited for nothing.
// #firstHeading exists only on an article.
const heading = uiv.$('css=#firstHeading').text;
uiv.log(\`Landed on: \${uiv.eval('return document.title')}\`, 'blue');

if (!heading.toLowerCase().includes('robotic process automation')) {
  throw new Error(\`search did not land on the expected article: \${heading}\`);
}
uiv.log('DemoBrowserType (JS) completed', 'green');
`
  },
  {
    fileName: 'DemoBrowserDrag.js',
    path: 'Browser Vision (Chrome, Edge)/DemoBrowserDrag.js',
    title: 'Drag & drop: uiv.browser (JS)',
    code: `// Dragging sliders with trusted CDP input, no XModule needed.
// Dragging = press, move, release. uiv.browser.down holds the button, every
// move while it is held drags, and uiv.browser.up releases at the end point.
if (uiv.getVar('!BROWSER') === 'firefox') {
  uiv.exit('This demo uses trusted CDP input (uiv.browser.*), which Firefox does not support — see XModules/DemoXMove for the same sliders with real OS input.');
}
const b = uiv.browser;

uiv.open('https://ui.vision/demo/draw');
uiv.page.click('link=this external website');

// --- 2nd slider: the classic "@0.75#2" target ------------------------------
// confidence and "which match" were baked into the target string; in JS they
// are an option and an array index, so you can log what you matched
const handles = uiv.findImages('slider_handle_dpi_96.png', { minScore: 0.75 });
uiv.log(\`found \${handles.length} slider handles\`, 'blue');
if (handles.length < 2) {
  throw new Error(\`expected at least 2 slider handles, found \${handles.length}\`);
}

const second = handles[1];
b.down(second);
b.up(second.x + 200, second.y);

// --- 3rd slider: search INSIDE one element -----------------------------------
// six identical handles are on this page, so both searches are limited to the
// warmth slider's own rect with {area} — the composed, per-call form of the
// classic visionLimitSearchArea command (which scripts reject). It also keeps
// the relaxed @0.6 safe: the search cannot wander off into the other sliders.
const track = uiv.$('xpath=//ion-list[3]/ion-item/div/div/ion-range');
const handle3 = uiv.findImage('slider_handle_dpi_96.png', { minScore: 0.6, area: track });
// A green/pink relative image used to drop the handle here. In JS a relative
// target is COMPOSED: find a stable anchor — the red
// thermometer at the warm end of the track — and act at an offset from it.
// The offset is in units of the anchor's own measured size, so it scales
// with the page exactly like the pink box did.
const warmEnd = uiv.findImage('slider_warmth_dpi_96.png', { minScore: 0.6, area: track });
b.down(handle3);
b.up(uiv.offset(warmEnd, -Math.round(1.05 * warmEnd.rect.width), 0));

// confirm the slider ended up where we wanted
const warmth = uiv.$('xpath=//ion-list[3]/ion-list-header/div/ion-badge').text;
uiv.log(\`Slider WARMTH value is: \${warmth}\`, 'red');
if (String(warmth).trim() !== '2000') {
  throw new Error(\`slider did not reach 2000 — it reads \${warmth}\`);
}
uiv.log('DemoBrowserDrag (JS) completed', 'green');
`
  },
  {
    fileName: 'DemoOffsetClick.js',
    path: 'Browser Vision (Chrome, Edge)/DemoOffsetClick.js',
    title: 'Offset click from OCR anchor (JS)',
    code: `// Clicking calculator keys at an OFFSET from OCR'd labels — the JS answer to
// the classic "text#R8,-14" relative targets (XClickTextRelative), composed
// from uiv.ocr.findText plus uiv.offset.
//
// The offsets are COMPUTED from the page's own geometry, not hardcoded:
// hardcoded pixel offsets break the moment the page renders at a different
// scale (side panel width, zoom, redesign — this demo shipped broken that way
// once). Two corner keys anchor the whole key grid; every key is then a whole
// number of grid steps away.
if (uiv.getVar('!BROWSER') === 'firefox') {
  uiv.exit('This demo uses trusted CDP input (uiv.browser.*), which Firefox does not support — Chrome/Edge only. (The same anchor+offset idiom works with real OS input too: uiv.desktop.click(uiv.offset(uiv.ocr.findText(anchor, {scope: "desktop"}), dx, dy)).)');
}
const b = uiv.browser;

uiv.open('https://ui.vision/demo/draw');
uiv.page.click('link=calculator');

// no engine pin: these reads use the engine configured in Settings > OCR
// ({engine: 99} — the XModule Local OCR — reads best when installed)
uiv.setVar('!OCRLANGUAGE', 'eng');

// Anchors: mc (top-left key) and R2 (bottom row, 3rd column). Both are
// multi-char labels the OCR reads reliably — its neighbor R0 misreads as
// "RO" (letter O), and the digit keys are single chars, too short to trust.
const mc = uiv.ocr.findText('mc');
const r2 = uiv.ocr.findText('R2');
const stepX = (r2.x - mc.x) / 2; // mc -> R2: 2 columns
const stepY = (r2.y - mc.y) / 6; // mc -> R2: 6 rows

const key8 = uiv.offset(mc, Math.round(stepX), Math.round(2 * stepY));
const keyTimes = uiv.offset(mc, Math.round(3 * stepX), Math.round(2 * stepY));
const keyEquals = uiv.offset(mc, Math.round(3 * stepX), Math.round(5 * stepY));

// 8 x 8888 =
b.click(key8);
b.click(keyTimes);
for (let i = 0; i < 4; i++) {
  b.click(key8);
}
b.click(keyEquals);

// read the result from the display above the keypad — a REGION read composed
// from the same anchors: uiv.ocr.read({area}) replaces the classic
// OCRExtractbyTextRelative, so no uiv.run legacy bridge is needed
const shown = uiv.ocr.read({
  area: {
    x: mc.rect.left,
    y: Math.round(mc.y - 1.5 * stepY),
    width: Math.round(3 * stepX + 40),
    height: Math.round(stepY)
  }
});
uiv.log(\`Extracted string (Calculator result) is "\${shown}"\`, 'blue');

// keep only the digits — the display renders "71,104" and OCR may add marks
const digits = Number(String(shown).replace(/[^0-9]/g, ''));

if (digits === 71104) {
  uiv.log(\`8 x 8888 is \${digits}, Calculator works!\`, 'green');
} else {
  throw new Error(\`Calculator result is wrong: read "\${shown}" -> \${digits}, expected 71104\`);
}
`
  },
  {
    fileName: 'DemoXType.js',
    path: 'XModules/DemoXType.js',
    title: 'DemoXType (JS)',
    code: `// Port of Classic/XModules/DemoXType.
// XType is uiv.desktop.type: real OS keystrokes. Unlike uiv.browser.type it
// reaches things outside the page — here the browser's own Save dialog, which
// is not part of the DOM and cannot be automated any other way.
const x = uiv.desktop;

// the keystrokes go to whatever window has focus, so the browser must be in
// front — that is a browser-level action, not something page JS can do
uiv.run('bringBrowserToForeground');
uiv.open('https://ui.vision/demo/xtype');

// open the browser's save dialog with the platform shortcut
const isMac = uiv.getVar('!OS') === 'mac';
x.type(isMac ? '\${KEY_CMD+KEY_S}' : '\${KEY_CTRL+KEY_S}');

const d = new Date();
const pad = (n) => (n < 10 ? '0' + n : String(n));
const mydate = \`\${d.getFullYear()}-\${pad(d.getMonth() + 1)}-\${pad(d.getDate())}\`;
const mytime = \`\${d.getHours()}-\${d.getMinutes()}-\${d.getSeconds()}\`;
uiv.log(\`Today is \${mydate}, and the time is \${mytime}\`, 'blue');

// the dialog is an OS window: nothing in the page changes, so there is no
// element to wait for — a plain sleep is the honest way to wait for it
uiv.sleep('2s');

x.type(\`Page_saved_by_UiVision_\${mydate}_\${mytime}\`);
x.type('\${KEY_ENTER}');

uiv.log('DemoXType (JS) completed — check your download folder', 'green');
`
  },
  {
    // NOT a port — a new demo, born as JS. The one desktop-automation demo
    // that runs for every user out of the box: no image files (nothing to
    // break on a different DPI or theme), no OCR, no coordinates, no AI —
    // and it works in Chrome, Edge AND Firefox, on Windows and macOS.
    fileName: 'OpenBrowserDevTools.js',
    path: 'XModules_Desktop/OpenBrowserDevTools.js',
    title: 'OpenBrowserDevTools (JS)',
    code: `// Desktop automation that works for EVERY user: Chrome, Edge and Firefox, on
// Windows and macOS (Linux too) — with no image files to match (nothing to
// break on a different DPI or theme), no OCR, no screen coordinates, no AI.
//
// The target is the browser's own DevTools console: a window with NO DOM.
// uiv.$ cannot see it and uiv.browser.* cannot reach it — only real OS
// keystrokes (uiv.desktop.*, the XType family) can. That makes it the
// smallest possible "hello world" of desktop automation, and one that every
// user already has installed.
//
// The proof is a round trip: the OS keystrokes type one line of JavaScript
// into the console; the console runs it against the page and renames the
// page title; the extension then reads the new title back from the DOM. If
// the keystrokes had not really arrived, the title could not have changed.
const x = uiv.desktop;

// OS keystrokes go to whatever window is in FRONT — make sure that is the
// window this macro plays in. Note the order: open the page FIRST —
// bringBrowserToForeground raises the window of the PLAY tab, and before the
// first tab command a run has no play tab yet, so it would raise nothing.
// (One thing it cannot do is steal focus from a DIFFERENT browser: the OS
// only lets the focused app hand focus over. With two browsers open, start
// the macro from the browser you want automated.)
uiv.open('https://ui.vision/demo/xtype');
uiv.run('bringBrowserToForeground');

// (read AFTER the first uiv command — before it, no special variable is set)
const os = uiv.getVar('!OS');
const browser = uiv.getVar('!BROWSER');
const isMac = os === 'mac';

// One chord opens the console WITH its input line focused, in every browser:
// Chrome and Edge use J (Cmd+Opt+J on mac, Ctrl+Shift+J elsewhere), Firefox
// uses K. No clicking needed — which is why no coordinates are needed.
const openConsole = browser === 'firefox'
  ? (isMac ? '\${KEY_CMD+KEY_OPTION+KEY_K}' : '\${KEY_CTRL+KEY_SHIFT+KEY_K}')
  : (isMac ? '\${KEY_CMD+KEY_OPTION+KEY_J}' : '\${KEY_CTRL+KEY_SHIFT+KEY_J}');

const GREETING = 'Hello from Ui.Vision';

uiv.banner('Real OS keystrokes will now open the DevTools console and type into it — hands off the keyboard for a moment…');

// One attempt: open (or focus) the console, type, then WATCH THE PAGE for
// proof. If the console is already open but not focused, the chord simply
// focuses its input line. The one trap is Firefox with the console input
// already FOCUSED: there the chord is a toggle and closes the console — the
// keystrokes then fall on the page (harmless: this page has no input
// fields), and the second attempt opens the console fresh.
const typeIntoConsole = (attempt) => {
  x.type(openConsole);
  // DevTools is not a web page: the extension cannot see into it, so there
  // is no element to wait for — a short sleep is the honest wait here
  uiv.sleep('2s');
  x.type("document.title = '" + GREETING + "'");
  x.type('\${KEY_ENTER}');
  // the console runs the line against the page — poll the PAGE for the effect
  for (let t = 0; t < 5; t++) {
    if (uiv.eval('return document.title') === GREETING) { return true; }
    uiv.sleep('1s');
  }
  uiv.log('Attempt ' + attempt + ': the page title has not changed yet', 'orange');
  return false;
};

if (!typeIntoConsole(1) && !typeIntoConsole(2)) {
  throw new Error('The typed console command never reached the page — is the browser window in the foreground, and the XModule installed?');
}
uiv.log(\`Proof: real OS keystrokes drove the \${browser} DevTools console on \${os} — the page title is now "\${GREETING}"\`, 'green');

// The console is deliberately left OPEN: the typed line sitting in its
// history — and the renamed tab title — ARE the demo. The banner tells the
// person watching what they are looking at and how to close it again.
const closeChord = isMac ? 'Cmd+Opt+I' : 'Ctrl+Shift+I';
uiv.banner('<b>Desktop automation demo done:</b> real OS keystrokes opened the DevTools console and typed a command into it — look at the console line it just ran, and at the tab title: "' + GREETING + '". The console stays open so you can see it; press ' + closeChord + ' (or F12) to close it.', { tone: 'green', seconds: 20 });
uiv.log('OpenBrowserDevTools completed', 'green');
`
  },
  {
    // NOT a port — born as JS. The side panel automating ITSELF, variant 1
    // of 3: desktop OCR. Same task in _local_imagesearch and _ai.find, so
    // the three desktop finders can be compared on identical work.
    fileName: 'ClearSidebarLogViaGUI_local_ocr.js',
    path: 'XModules_Desktop/ClearSidebarLogViaGUI_local_ocr.js',
    title: 'ClearSidebarLogViaGUI_local_ocr (JS)',
    code: `// The side panel automating ITSELF: find and press its own "Clear log"
// button (bottom bar of the Data tab) with desktop OCR and real OS clicks.
// Run it FROM the side panel, with the XModule installed.
//
// Normally IMPOSSIBLE: every desktop capture hides the extension UI behind
// a solid "Desktop capture in progress" cover, precisely so that desktop
// OCR/vision cannot match the macro source and log text the panel shows.
// Storing false into !CAPTURE_HIDE_GUI switches the cover off for the rest
// of this run — captures then show the real panel. Hiding stays the
// default: the next run starts covered again.
uiv.setVar('!CAPTURE_HIDE_GUI', false);

const x = uiv.desktop;

// With the cover off, the old danger is back: the words this macro hunts
// are also in ITS OWN SOURCE, which sits in the editor on screen right now.
// Build the search terms at runtime, so the source spells them differently
// than the panel does.
const CHAT = 'Ch' + 'at';                      // the 'AI Chat' tab
const DATA = 'Da' + 'ta';                      // the tab this macro clicks
const LOGS = 'Lo' + 'gs';                      // its Logs sub-tab
const CLEAR_LOG = 'Cl' + 'ear ' + 'l' + 'og';  // the button

// The sidebar tab row: 'Chat' next to 'Data' is the anchor PAIR. One word
// alone is not safe — 'Chat' can sit in any other window on the screen (a
// messenger, an editor showing this text), and anchoring there drags the
// whole search into the wrong window. So: take every 'Chat' the screen
// shows, try them from the RIGHT edge leftwards (the side panel docks
// right), and accept only a candidate with a 'Data' tab in the same row —
// a pair that only the panel's tab row has. (Desktop-scope OCR upgrades to
// the XModule Local OCR by itself — the Javascript engine cannot read the
// panel's small UI font.)
const chats = uiv.ocr.findTexts(CHAT, { scope: 'desktop', timeout: 15 }).sort((a, b) => b.x - a.x);
let chat = null;
let dataTab = null;
let AREA = null;
for (let i = 0; i < chats.length && !dataTab; i++) {
  const c = chats[i];
  // the panel column around this candidate — reaching past the screen edge
  // is fine, the capture clips it. Every later search stays inside it.
  const a = { x: c.x - 260, y: Math.max(0, c.y - 40), width: 500, height: 1200 };
  const d = uiv.ocr.findTexts(DATA, { scope: 'desktop', area: a, required: false, timeout: 2 })
    .filter(m => Math.abs(m.y - c.y) < c.rect.height && m.x > c.x)
    .sort((m1, m2) => m1.x - m2.x)[0];
  if (d) { chat = c; dataTab = d; AREA = a; }
}
if (!dataTab) throw new Error('no AI Chat + Data tab pair found on screen — is the side panel fully visible, not covered by another window?');
x.click(dataTab);

// The Data tab replaces the editor — but its LOG LIST (when the Logs
// sub-tab is active) prints this macro's own "Executing ..." lines, which
// contain the same words. The real button is the BOTTOM-RIGHT occurrence
// of its label: the bar sits below the list, the button at its right edge.
// (Never click a matched word INSIDE the list — a log-entry click jumps
// the panel back to the macro source.)
const clearButton = (required) => {
  const ms = uiv.ocr.findTexts(CLEAR_LOG, { scope: 'desktop', area: AREA, required: required, timeout: required ? 10 : 5 });
  return ms.length ? ms.sort((a, b) => (b.x + b.y) - (a.x + a.y))[0] : null;
};
let btn = clearButton(false);
if (!btn) {
  // No button on screen: the Data tab remembered another sub-tab (Shots,
  // CSV, Visual). Only NOW is searching the sub-tab word safe — without
  // the log list, the topmost occurrence in the panel IS the sub-tab.
  const logsTab = uiv.ocr.findTexts(LOGS, { scope: 'desktop', area: AREA, timeout: 10 }).sort((a, b) => a.y - b.y)[0];
  x.click(logsTab);
  btn = clearButton(true);
}
x.click(btn);

// leave things as found: captures hide the panel again from here on.
// The message lands in the log the macro just emptied — visible proof.
uiv.setVar('!CAPTURE_HIDE_GUI', true);
uiv.log('Log deleted — the side panel pressed its own Clear-log button (local OCR)', 'green');
`
  },
  {
    // Variant 2 of 3: local image search. Same task as _local_ocr — pixel
    // anchors instead of text. Anchor images capture the panel at 100%
    // display scaling; on another DPI re-capture them (save_element_image
    // or uiv.shot.area).
    fileName: 'ClearSidebarLogViaGUI_local_imagesearch.js',
    path: 'XModules_Desktop/ClearSidebarLogViaGUI_local_imagesearch.js',
    title: 'ClearSidebarLogViaGUI_local_imagesearch (JS)',
    code: `// The side panel automating ITSELF: press its own "Clear log" button
// (bottom bar of the Data tab), targeted with IMAGE SEARCH this time. Run
// it FROM the side panel, with the XModule installed. See _local_ocr for
// the cover story: !CAPTURE_HIDE_GUI=false makes desktop captures show the
// panel.
//
// Unlike the OCR variant, images need no word tricks: the editor shows this
// SOURCE as text, and text never pixel-matches a screenshot of a button.
// The price is DPI sensitivity — the anchors are 100%-scaling captures.
uiv.setVar('!CAPTURE_HIDE_GUI', false);

const x = uiv.desktop;

// the Data tab in the sidebar tab row — the image shows the INACTIVE look,
// so no match usually means the Data tab is already the active one
const dataTab = uiv.findImages('sidebar_datatab_dpi_96.png', { scope: 'desktop', minScore: 0.75, required: false });
if (dataTab.length) x.click(dataTab[0]);

// The Clear-log button sits in the bar below the log list. If it is not on
// screen, the Data tab remembered another sub-tab (Shots, CSV, Visual) —
// then the sub-tab bar is visible and shows the INACTIVE Logs sub-tab,
// which is exactly what its anchor image pictures.
let btn = uiv.findImages('sidebar_clearlog_dpi_96.png', { scope: 'desktop', minScore: 0.75, required: false, timeout: 5 });
if (!btn.length) {
  x.click(uiv.findImage('sidebar_logstab_dpi_96.png', { scope: 'desktop', minScore: 0.75 }));
  btn = uiv.findImages('sidebar_clearlog_dpi_96.png', { scope: 'desktop', minScore: 0.75 });
}
x.click(btn[0]);

// leave things as found: captures hide the panel again from here on.
// The message lands in the log the macro just emptied — visible proof.
uiv.setVar('!CAPTURE_HIDE_GUI', true);
uiv.log('Log deleted — the side panel pressed its own Clear-log button (image search)', 'green');
`
  },
  {
    // Variant 3 of 3: the model as the finder. Same task as _local_ocr —
    // uiv.ai.find points at the targets, no OCR wordlists and no image
    // files to maintain; each call is billable.
    fileName: 'ClearSidebarLogViaGUI_ai.find.js',
    path: 'XModules_Desktop/ClearSidebarLogViaGUI_ai.find.js',
    title: 'ClearSidebarLogViaGUI_ai.find (JS)',
    code: `// The side panel automating ITSELF: press its own "Clear log" button
// (bottom bar of the Data tab), located by the AI vision finder. Run it
// FROM the side panel, with the XModule installed (the clicks are real OS
// input). See _local_ocr for the cover story: !CAPTURE_HIDE_GUI=false
// makes desktop captures show the panel.
uiv.setVar('!CAPTURE_HIDE_GUI', false);

const x = uiv.desktop;

// ai.find does not auto-wait, and the panel has no DOM a script could wait
// on — give each click a moment to render before the next screenshot. The
// prompts describe targets by PLACE (tab row, bottom bar): this macro's own
// source is on screen too until the Data tab hides the editor, and a bare
// "find Data" could point at these very words.
const find = (what) => {
  const m = uiv.ai.find(what, { scope: 'desktop' });
  uiv.log(what + ' => ' + m.x + ',' + m.y, 'blue');
  return m;
};

x.click(find('In the Ui.Vision side panel, the "Data" tab in the tab row at the very top, right of the "AI Chat" tab'));
uiv.sleep('1s');

// The button only exists while the Logs sub-tab is active; when the Data
// tab remembered another sub-tab, open Logs first. The failed find is one
// extra model call, but only on that path.
let btn;
try {
  btn = find('The "Clear log" button in the bar at the bottom right of the Ui.Vision side panel, below the log list');
} catch (e) {
  x.click(find('The "Logs" sub-tab in the second tab row of the Ui.Vision side panel'));
  uiv.sleep('1s');
  btn = find('The "Clear log" button in the bar at the bottom right of the Ui.Vision side panel, below the log list');
}
x.click(btn);

// leave things as found: captures hide the panel again from here on.
// The message lands in the log the macro just emptied — visible proof.
uiv.setVar('!CAPTURE_HIDE_GUI', true);
uiv.log('Log deleted — the side panel pressed its own Clear-log button (ai.find)', 'green');
`
  },
  {
    fileName: 'DemoXMove.js',
    path: 'XModules/DemoXMove.js',
    title: 'DemoXMove (JS)',
    code: `// Port of Classic/XModules/DemoXMove.
// Same sliders as DemoBrowserDrag, but driven with REAL OS mouse input.
//
// The important difference is coordinates. uiv.browser.* works in viewport
// pixels; uiv.desktop.* works in SCREEN pixels. So the images have to be found
// in desktop scope too — {scope: 'desktop'} searches a screenshot of the whole
// screen and returns screen coordinates. Passing a browser-scope match to
// uiv.desktop.* is rejected outright rather than clicking a plausible but
// wrong spot.
const x = uiv.desktop;
const DESKTOP = { scope: 'desktop' };

uiv.open('https://ui.vision/demo/draw');
uiv.page.click('link=this external website');

// --- 2nd slider: classic "@0.75#2" = confidence + which match ---------------
const handles = uiv.findImages('slider_handle_dpi_96.png', { scope: 'desktop', minScore: 0.75 });
uiv.log(\`found \${handles.length} slider handles on screen\`, 'blue');
if (handles.length < 2) {
  throw new Error(\`expected at least 2 slider handles, found \${handles.length}\`);
}

const second = handles[1];
x.down(second);
x.up(second.x + 200, second.y);

// --- 3rd slider: search INSIDE one region ------------------------------------
// six identical handles are on the page. A DOM rect cannot limit a DESKTOP
// search (an {area} in viewport coordinates would be rejected — screen pixels
// only), so the region is built from a desktop-scope match instead: find the
// red thermometer at the warm end, then look for the handle in a band
// extending one track-length to its left — everything in screen pixels, and
// every size in units the anchor itself provides.
const warmEnd = uiv.findImage('slider_warmth_dpi_96.png', { scope: 'desktop', minScore: 0.6 });
const w = warmEnd.rect.width;
const band = {
  x: warmEnd.x - 45 * w,
  y: warmEnd.y - warmEnd.rect.height,
  width: 45 * w,
  height: 2 * warmEnd.rect.height
};
const handle3 = uiv.findImage('slider_handle_dpi_96.png', { scope: 'desktop', minScore: 0.6, area: band });
x.down(handle3);
// composed relative target — see DemoBrowserDrag; the desktop-scope match makes
// uiv.offset return screen pixels, so the same idiom feeds uiv.desktop.*
x.up(uiv.offset(warmEnd, -Math.round(1.05 * w), 0));

// the RESULT is read from the DOM — no OCR needed for text the page has
const warmth = uiv.$('xpath=//ion-list[3]/ion-list-header/div/ion-badge').text;
uiv.log(\`Slider WARMTH value is: \${warmth}\`, 'red');
if (String(warmth).trim() !== '2000') {
  throw new Error(\`slider did not reach 2000 — it reads \${warmth}\`);
}
uiv.log('DemoXMove (JS) completed', 'green');
`
  },
  {
    fileName: 'DemoXRun.js',
    path: 'XModules/DemoXRun.js',
    title: 'DemoXRun (JS)',
    code: `// Port of Classic/XModules/DemoXRun.
// XRun starts a program on the computer — nothing a page can do, so it stays
// on the legacy bridge. The classic if/elseif/else chain over !os becomes a
// plain lookup.
uiv.log('This demo uses hard-coded paths for the default calculator app — adjust them for your machine.', 'blue');

const os = uiv.getVar('!OS');
const calculator = {
  mac: '/Applications/Calculator.app/Contents/MacOS/Calculator',
  linux: '/snap/bin/gnome-calculator',
  windows: 'C:\\\\Windows\\\\System32\\\\calc.exe'
}[os];

if (!calculator) {
  throw new Error(\`no calculator path known for OS '\${os}'\`);
}

uiv.run('XRun', calculator);
uiv.log(\`Calculator app launched (\${os}: \${calculator})\`, 'green');

// XRunAndWait blocks until the program exits and reports its exit code:
//   uiv.run('XRunAndWait', 'Powershell.exe', '-executionpolicy bypass -File c:\\\\test.ps1');
//   uiv.log(\`Exit code = \${uiv.getVar('!XRUN_EXITCODE', '')}\`);
`
  },
  {
    fileName: 'Right-click context menu.js',
    path: 'XModules_Desktop/Right-click context menu.js',
    title: 'Right-click context menu (JS)',
    code: `// Save a web page through the browser's RIGHT-CLICK context menu and the OS
// save dialog. Both are NATIVE UI outside the page DOM — no page command can
// reach them, so everything after the right-click is desktop-tier (XModule)
// work: real OS input plus desktop-scope OCR.
const x = uiv.desktop;

uiv.open('https://ui.vision');

// The browser window must be IN FRONT: a browser-scope OS click is aimed at
// the window's screen position, so any window covering that spot gets the
// click instead. bringBrowserToForeground raises the play tab's window, but
// no browser API may steal the foreground from ANOTHER APP (the OS forbids
// it) — a real OS click may, so click a visible piece of the PAGE itself:
// the desktop-scope finder only returns what is actually on screen, and the
// tallest match is the page's big heading, never the same words rendered
// small in some other window.
uiv.run('bringBrowserToForeground');
uiv.sleep('500ms'); // settle: let the window reach the foreground
const onScreen = uiv.ocr.findTexts('Open-Sourc*', {scope: 'desktop', required: false, timeout: 5});
if (!onScreen.length) {
  throw new Error('The ui.vision page is not visible on screen — this demo drives the browser with real OS input, so its window must not be covered by another app.');
}
x.click(onScreen.sort((a, b) => b.rect.height - a.rect.height)[0]);

// LANGUAGE-INDEPENDENT MENU TARGETING: the menu wording follows the browser's
// UI language — read the locale and look up the save entry's most distinctive
// word (wildcards absorb OCR misreads, 'speichem' happens).
const lang = String(uiv.eval('return navigator.language') || 'en').toLowerCase().slice(0, 2);
const SAVE_WORD = {
  en: 'Save', de: 'speich*', fr: 'enregistr*', es: 'Guardar*', it: 'Salva*',
  pt: 'Salvar*', nl: 'opslaan*', pl: 'Zapisz*', ru: 'Сохранить*',
  zh: '另存*', ja: '名前*', ko: '저장*'
}[lang];
if (!SAVE_WORD) {
  throw new Error('No save-menu wording known for UI language "' + lang + '" — add it to the SAVE_WORD table at the top of this macro.');
}

// Non-Latin scripts need the matching OCR language, or the reader cannot see
// the menu text at all (the default language covers Latin scripts only).
// 另存 is written identically in simplified and traditional Chinese, so one
// Chinese OCR language covers both.
const OCR_LANG = { ru: 'rus', ja: 'jpn', ko: 'kor', zh: 'chs' }[lang];
if (OCR_LANG) { uiv.setVar('!OCRLANGUAGE', OCR_LANG); }

// scan with the configured engine, then once more with the XModule Local OCR
// ({engine: 99}) — explicitly chosen here: the better reader for native UI
const scan = () => {
  let m = uiv.ocr.findTexts(SAVE_WORD, {scope: 'desktop', required: false, timeout: 3});
  if (!m.length) {
    try { m = uiv.ocr.findTexts(SAVE_WORD, {scope: 'desktop', required: false, timeout: 3, engine: 99}); } catch (e) { /* no XModule Local OCR */ }
  }
  return m;
};

// A browser-scope desktop click takes VIEWPORT coordinates, fronts the browser
// and aims the OS click at that page position. (100, 300) is the page's left
// margin, so the right-click opens the page (or image) context menu — both
// contain the save-page entry. The left-click first guarantees the browser
// window has the focus, even when the user was just working in a different app.
x.click(100, 300, {scope: 'browser'});

// BEFORE opening the menu: remember where the word already appears on screen
// (another window may show it — a docs page, a chat, an editor). Those are
// background noise; the menu entry will be the match that is NEW.
const noise = scan();

x.click(100, 300, {scope: 'browser', button: 'right'});
uiv.sleep('1s'); // settle: let the native menu paint before the OCR pass

// "new" = not in the noise baseline, i.e. it appeared with the menu/dialog
const isNew = (h, extra) => !noise.concat(extra || []).some((n) => Math.abs(n.x - h.x) < 10 && Math.abs(n.y - h.y) < 10);

const item = scan().find((h) => isNew(h));
if (!item) {
  x.type('\${KEY_ESC}'); // close the menu again — leave a clean screen behind
  throw new Error('The save-page entry ("' + SAVE_WORD + '") was not found in the context menu by OCR — try the XModule Local OCR (Settings > OCR), or adjust SAVE_WORD for your language.');
}
x.click(item);
uiv.sleep('2s'); // settle: the OS save dialog takes a moment to appear

// POSITIVE proof that the dialog is up BEFORE typing blindly into it — but
// NOT by reading the file-name field: it shows its text small and SELECTED
// (white on highlight), which local OCR regularly cannot read, and a failed
// read there would abort a save that actually worked. The dialog's TITLE
// carries the same word as the menu entry ("Speichern unter", "Save As") in
// large text instead: the menu is gone by now, so a fresh match somewhere
// ELSE than the menu entry means the dialog is open.
const dialog = scan().find((h) => isNew(h, [item]));
if (!dialog) {
  x.type('\${KEY_ESC}');
  throw new Error('The save dialog did not open — the menu click missed the save entry.');
}

// The dialog opens with the suggested file name SELECTED — typing replaces
// it. Native dialogs have no DOM: these are blind keystrokes. The name
// carries a timestamp so it is unique EVERY run: a reused name (an earlier
// "abc.htm") makes Windows ask "replace it?", and confirming that dialog
// blind is exactly the kind of flakiness a demo must not have.
const d = new Date();
const pad = (n) => (n < 10 ? '0' + n : String(n));
const saveName = 'page_' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '_' + pad(d.getHours()) + '-' + pad(d.getMinutes()) + '-' + pad(d.getSeconds()) + '.htm';
x.type(saveName);
x.type('\${KEY_ENTER}');

// ...and now the dialog must be GONE — its title would still be on screen
// otherwise. A macro must fail loudly when the goal was not reached.
uiv.sleep('2s'); // settle: let the dialog close
if (scan().some((h) => isNew(h, [item]))) {
  throw new Error('The save dialog is still open — the file name entry or the save click did not work');
}
uiv.log('Page saved as ' + saveName + ' via the native right-click menu — check the browser download folder', 'green');
`
  },
  {
    fileName: 'ai.ask_ParseHTML.js',
    path: 'LLM AI Commands/ai.ask_ParseHTML.js',
    title: 'ai.ask_ParseHTML (JS)',
    code: `// Port of Classic/LLM AI Commands/ai.ask_ParseHTML.
// Send page content to the LLM, then turn its answer into a CSV.
//
// uiv.ai.ask is one round trip to the configured model. Everything
// AROUND it — cleaning the HTML, splitting the reply, building the rows — is
// ordinary JavaScript, which is where the classic macro needed two
// executeScript_Sandbox blocks with the code squeezed into one cell.
uiv.open('https://forum.ui.vision/');

// Grab the page CONTENT via the finder, not uiv.eval: this forum ships a
// strict Content-Security-Policy that blocks executeScript-based page JS on
// Firefox — match.text comes through the content script and is CSP-immune.
// Sending rendered text instead of raw HTML also costs less and answers
// better.
const html = uiv.$('css=body').text.replace(/\\s+/g, ' ').slice(0, 20000);
uiv.log(\`Extracted \${html.length} characters of page text\`, 'brown');

// uiv.ai.ask passes the prompt through untouched — no \${...} in the page
// source can be mistaken for a variable reference
const answer = String(uiv.ai.ask(
  \`What are the titles of the first 5 forum posts? Return just the titles, one per line, no numbering.\\n\\nPage: \${html}\`
));
uiv.log(\`First 5 Forum Titles = \${answer}\`, 'green');

// the model returns lines; a CSV wants rows
const rows = answer
  .split('\\n')
  .map(line => line.trim())
  .filter(line => line.length > 0)
  .map(line => [line]);

if (rows.length === 0) {
  throw new Error(\`the model returned no usable titles: "\${answer}"\`);
}

uiv.csv.write('first5forumposts.csv', rows);
uiv.log(\`Saved \${rows.length} titles to first5forumposts.csv\`, 'green');
`
  },
  {
    fileName: 'ai.ask_CompareImages.js',
    path: 'LLM AI Commands/ai.ask_CompareImages.js',
    title: 'ai.ask_CompareImages (JS)',
    code: `// Port of Classic/LLM AI Commands/ai.ask_CompareImages.
// Ask the model whether two images match. The classic macro's \`verify\`
// commands become plain checks — and unlike verify, a failure here can say
// what the model actually replied.
const ask = (imageA, imageB, question) =>
  String(uiv.ai.ask(question, { images: [imageA, imageB] })).trim().toLowerCase();

const QUESTION = 'Are both images the same? Answer only true or false.';

// Test 1: the same image twice -> must be true
const same = ask('canvas_wyoming_dpi_96.png', 'canvas_wyoming_dpi_96.png', QUESTION);
uiv.log(\`Test1: Are the images the same? \${same}\`, 'green');
if (!same.includes('true')) {
  throw new Error(\`Test1 failed: identical images should compare as true, model said "\${same}"\`);
}

// Test 2: two different images -> must be false. Deliberately two UNRELATED
// pictures (a Wyoming map vs a Hyde Park map): wyoming_verify is a crop of
// the SAME map, and "are these the same?" on a crop is a judgment call that
// smaller models answer with true — the demo must not fail on that.
const different = ask('canvas_wyoming_dpi_96.png', 'canvas_hydepark_dpi_96.png', QUESTION);
uiv.log(\`Test2: Are the images the same? \${different}\`, 'green');
if (!different.includes('false')) {
  throw new Error(\`Test2 failed: different images should compare as false, model said "\${different}"\`);
}

uiv.log('ai.ask_CompareImages (JS) completed — both comparisons as expected', 'green');
`
  },
  {
    fileName: 'CU_FillForm.js',
    path: 'LLM AI Commands/CU_FillForm.js',
    title: 'CU_FillForm (JS)',
    code: `// Port of Classic/LLM AI Commands/CU_FillForm.
// Hand the whole task to the computer-use agent and check what it reports.
// uiv.ai.computerUse drives the browser with the model in the loop; the classic
// if/elseif/else over its answer is JS.
uiv.run('XDesktopAutomation', 'false');   // browser scope, not the desktop
uiv.open('https://ui.vision/contact');
uiv.run('bringBrowserToForeground');

const TASK = [
  'Fill out this web form with artificial data and submit it.',
  'Two fields need specific values: use "[AI Test]" as the subject,',
  'and answer the anti-spam question exactly as the page asks.',
  'Finish your reply with SUCCESS or ERROR.'
].join(' ');

const result = String(uiv.ai.computerUse(TASK));
uiv.log(\`Computer Use Result = \${result}\`, 'blue');

if (result.includes('SUCCESS')) {
  uiv.log('All worked fine', 'green');
} else if (result.includes('ERROR')) {
  throw new Error(\`the computer-use agent reported an error: \${result}\`);
} else {
  // the classic macro only echoed a warning here; a script should fail, since
  // "no verdict" means the run cannot be called a success
  throw new Error(\`no SUCCESS/ERROR verdict in the agent's reply: \${result}\`);
}
`
  },
  {
    fileName: 'ai.find_SearchForum.js',
    path: 'LLM AI Commands/ai.find_SearchForum.js',
    title: 'ai.find_SearchForum (JS)',
    code: `// Port of Classic/LLM AI Commands/ai.find_SearchForum.
// uiv.ai.find asks the model WHERE something is on screen: a vision finder
// powered by an LLM rather than template matching, for when there is no image
// to match and no DOM to query. It returns a match, DPI already accounted for.
// DOM clicks act on the model's point, so this runs in every browser; typing
// goes through uiv.page.type on the focused search field.
uiv.open('https://forum.ocr.space/');

// uiv.ai.find RETURNS the match, so the !AI1/!AI2 dance the classic macro
// needed is gone — reading those in a script now throws, because the next
// uiv call overwrites them.
// {scope: 'browser'} pins THIS call to the viewport — the per-call form of
// the classic global XDesktopAutomation toggle — so the demo behaves the same
// even when desktop mode is switched on in the config. ai.find throws by
// itself when the model gives no usable coordinates, so nothing to check here.
const locate = (what) => {
  const point = uiv.ai.find(what, { scope: 'browser' });
  uiv.log(\`\${what} => \${point.x},\${point.y}\`, 'blue');
  return point;
};

const searchIcon = locate('Find the search icon (magnifying glass).');
uiv.page.click(searchIcon);

// fill the search box the click revealed — the forum searches as you type,
// so no ENTER key is needed (key codes are uiv.browser.type territory)
uiv.page.type('css=input[type="search"], input[name="term"], input', 'V10');

const firstResult = locate('Find the first search result (blue text)');
uiv.page.click(firstResult);

uiv.log('ai.find_SearchForum (JS) completed', 'green');
`
  },
  {
    fileName: 'DemoBrowserClick.js',
    path: 'Browser Vision (Chrome, Edge)/DemoBrowserClick.js',
    title: 'uiv.browser.click (JS)',
    code: `// Draws a square on a canvas, then types a caption — with trusted CDP input
// (uiv.browser.*), so no XModule is needed and the browser window may stay in
// the background.
//
// A drag is press, move, release: uiv.browser.down holds the button, every
// uiv.browser.move while it is held drags, and .up releases — the corner
// coordinates are two numbers in a loop.
if (uiv.getVar('!BROWSER') === 'firefox') {
  uiv.exit('This demo uses trusted CDP input (uiv.browser.*), which Firefox does not support — see XModules/DemoXClick for the same drawing with real OS input.');
}
const t = uiv.browser;
const FIND = {};
const find = (name, minScore) => uiv.findImage(name, minScore ? Object.assign({ minScore: minScore }, FIND) : FIND);

uiv.open('https://ui.vision/demo/draw');
uiv.page.click('link=this link');

// classic visualAssert -> the finder throws if the canvas is not there
find('draw_canvas_dpi_96.png');

t.click(find('draw_plus_dpi_96.png'));
t.click(find('draw_redbutton_dpi_96.png'));

// COMPOSED relative clicks (green/pink relative images used to do this):
// the pencil icon changes shape with the chosen color, so
// both targets are anchored on the STABLE select+crop icons at the top of the
// toolbar instead. The offsets are in units of the anchor's own measured
// rect, so they scale with the page — the same adaptation the classic pink
// box got from the vision engine. The pencil sits one anchor-height below.
const tools = find('draw_toolbar_top_dpi_96.png');
t.click(uiv.offset(tools, 0, Math.round(0.95 * tools.rect.height)));
t.type('\${KEY_ESC}');

// the drawing start point is BLANK canvas — nothing findable there, which is
// exactly what an offset from an anchor is for
const start = uiv.offset(tools, Math.round(6 * tools.rect.width), Math.round(1.2 * tools.rect.height));
uiv.log(\`Starting point: x=\${start.x} y=\${start.y}\`, 'green');

// draw a 100 x 100 square, one edge per step
let x = start.x;
let y = start.y;
const SIDE = 100;
const edges = [
  { dx: SIDE, dy: 0, name: 'top' },
  { dx: 0, dy: SIDE, name: 'right' },
  { dx: -SIDE, dy: 0, name: 'bottom' },
  { dx: 0, dy: -SIDE, name: 'left' }
];

edges.forEach(edge => {
  t.down(x, y);
  x += edge.dx;
  y += edge.dy;
  t.move(x, y);      // still held -> this drags
  t.up(x, y);
  uiv.log(\`drew the \${edge.name} edge to \${x},\${y}\`);
});

// --- add some text ----------------------------------------------------------
t.click(find('draw_text1_dpi_96.png'));
t.type('\${KEY_ESC}');

// click the canvas where the text should start
y += 180;
t.click(x, y);
t.type('Demo completed.');

// click once more to close the text menu
y -= 150;
t.click(x, y);

// confirm the text really appeared (@0.4 relaxes the global confidence)
find('draw_checkresult1_dpi_96.png', 0.4);
uiv.log('DemoBrowserClick (JS) completed', '#shownotification');
`
  },
  {
    fileName: 'DemoXClick.js',
    path: 'XModules/DemoXClick.js',
    title: 'DemoXClick (JS)',
    code: `// Port of Classic/XModules/DemoXClick.
// Draws a square on a canvas, then types a caption — with real OS mouse input, which needs the XModule and a visible browser window
//
// A drag is press, move, release: uiv.desktop.down holds the button, every
// uiv.desktop.move while it is held drags, and .up releases. The classic
// macro does the same with #down/#move/#up value modifiers, and recomputes the
// corner coordinates in four separate executeScript_Sandbox commands — here
// they are two numbers in a loop.
const t = uiv.desktop;
const FIND = { scope: 'desktop' };
const find = (name, minScore) => uiv.findImage(name, minScore ? Object.assign({ minScore: minScore }, FIND) : FIND);

// OS input goes to whatever window is in front
uiv.run('bringBrowserToForeground');
uiv.open('https://ui.vision/demo/draw');
uiv.page.click('link=this link');

// classic visualAssert -> the finder throws if the canvas is not there
find('draw_canvas_dpi_96.png');

t.click(find('draw_plus_dpi_96.png'));
t.click(find('draw_redbutton_dpi_96.png'));

// COMPOSED relative clicks — see DemoBrowserClick: the pencil icon changes shape,
// so both targets are anchored on the stable select+crop icons at the top of
// the toolbar, with offsets in units of the anchor's own measured rect. The
// desktop-scope match makes uiv.offset return screen pixels for uiv.desktop.*.
const tools = find('draw_toolbar_top_dpi_96.png');
t.click(uiv.offset(tools, 0, Math.round(0.95 * tools.rect.height)));
t.type('\${KEY_ESC}');

const start = uiv.offset(tools, Math.round(6 * tools.rect.width), Math.round(1.2 * tools.rect.height));
uiv.log(\`Starting point: x=\${start.x} y=\${start.y}\`, 'green');

// draw a 100 x 100 square, one edge per step
let x = start.x;
let y = start.y;
const SIDE = 100;
const edges = [
  { dx: SIDE, dy: 0, name: 'top' },
  { dx: 0, dy: SIDE, name: 'right' },
  { dx: -SIDE, dy: 0, name: 'bottom' },
  { dx: 0, dy: -SIDE, name: 'left' }
];

edges.forEach(edge => {
  t.down(x, y);
  x += edge.dx;
  y += edge.dy;
  t.move(x, y);      // still held -> this drags
  t.up(x, y);
  uiv.log(\`drew the \${edge.name} edge to \${x},\${y}\`);
});

// --- add some text ----------------------------------------------------------
t.click(find('draw_text1_dpi_96.png'));
t.type('\${KEY_ESC}');

// click the canvas where the text should start
y += 180;
t.click(x, y);
t.type('Demo completed.');

// click once more to close the text menu
y -= 150;
t.click(x, y);

// confirm the text really appeared (@0.4 relaxes the global confidence)
find('draw_checkresult1_dpi_96.png', 0.4);
uiv.log('DemoXClick (JS) completed', '#shownotification');
`
  },
  {
    // the XClick twin of the root "Draw a cat🐱" welcome demo: same cat,
    // real OS input instead of CDP — so it runs on Firefox too. Live-tested
    // on Windows + Firefox.
    fileName: 'Draw a cat🐱 - XClick version.js',
    path: 'XModules/Draw a cat🐱 - XClick version.js',
    title: 'Draw a cat - XClick (JS)',
    code: `// Draw a smiling cat on excalidraw.com — the XClick version: real OS mouse
// and keyboard input (uiv.desktop.*), so it runs in EVERY browser, Firefox
// included. The browser-vision twin ("Draw a cat🐱") does the same with
// trusted CDP input and needs no XModule, but is Chrome/Edge-only; this one
// needs the XModule and a visible browser window.
//
// Like the classic XClick, uiv.desktop.* speaks BOTH coordinate spaces: bare
// numbers are SCREEN pixels, but a browser-finder match — or numbers with
// {scope: 'browser'} — means VIEWPORT pixels: the OS click is aimed at that
// page position automatically (window offset, side panel and DPI corrected,
// and the browser is brought to the foreground first). So the whole cat is
// drawn in viewport coordinates straight from the DOM finders — no manual
// viewport->screen measuring, no anchor images.
uiv.open('https://excalidraw.com/');
uiv.banner('<b>Ui.Vision drawing demo (XClick)</b> — this macro is not affiliated with or endorsed by Excalidraw.', { seconds: 10, position: 'bottom' });

const c = uiv.$('css=canvas'); // auto-waits until the app has rendered
const x = uiv.desktop;
const isMac = uiv.getVar('!OS') === 'mac';
const V = { scope: 'browser' }; // "these numbers are VIEWPORT pixels"

const cx = c.x;      // cat center = canvas center
const cy = c.y - 20; // nudged up so the body fits above the bottom bar

// One real click on empty canvas FIRST: OS keystrokes go to the focused
// element, and until the page is clicked that may well be the side panel.
// (A viewport-scope OS click also brings the browser window to the front.)
x.click(cx, cy, V);

// Clear any existing scene so re-runs start blank
x.type('\${KEY_ESC}');
x.type(isMac ? '\${KEY_CMD+KEY_A}' : '\${KEY_CTRL+KEY_A}');
x.type('\${KEY_DEL}');

// Excalidraw reverts to the selection tool after each shape - re-select before
// every element. Prefer the DOM locator for WHERE the tool is (the match
// carries browser scope by itself), fall back to the toolbar position
// (horizontally centered, icons at y=40) — either way the click is a real
// OS click aimed at a viewport position.
const TOOL_DX = { rectangle: -127, ellipse: -43, line: 41, freedraw: 83, text: 125 };
const selectTool = (testid) => {
  const t = uiv.$('css=[data-testid="toolbar-' + testid + '"]', { required: false, timeout: 3 });
  if (t) { x.click(t); } else { x.click(cx + TOOL_DX[testid], 40, V); }
};

// One polyline = one press-drag-release: down holds the button, every move
// while it is held drags, up releases at the last point
const drag = (pts) => {
  x.down(cx + pts[0][0], cy + pts[0][1], V);
  for (let i = 1; i < pts.length - 1; i++) {
    x.move(cx + pts[i][0], cy + pts[i][1], V);
  }
  const last = pts[pts.length - 1];
  x.up(cx + last[0], cy + last[1], V);
};

// Body first (ellipse), then head on top, so overlaps look tidy
selectTool('ellipse');
drag([[-78,74],[78,198]]);   // body: oval tucked under the chin
selectTool('ellipse');
drag([[-110,-90],[110,70]]); // head: wide oval

// Ears: freehand triangles with midpoints on each edge so the lines stay straight
selectTool('freedraw');
drag([[-88,-60],[-80,-99],[-72,-138],[-55,-111],[-38,-84]]);
drag([[38,-84],[55,-111],[72,-138],[80,-99],[88,-60]]);

// Eyes: two small precise ovals, each with a freehand pupil dot inside
selectTool('ellipse');
drag([[-60,-40],[-35,-10]]);
selectTool('ellipse');
drag([[35,-40],[60,-10]]);
selectTool('freedraw');
drag([[-51,-25],[-47,-28],[-44,-25],[-47,-22],[-51,-25]]);
drag([[44,-25],[48,-28],[51,-25],[48,-22],[44,-25]]);

// Nose: freehand triangle, closed
drag([[-13,2],[13,2],[0,24],[-13,2]]);
// Smile: wide upward curve under the nose
drag([[-32,30],[-18,42],[0,47],[18,42],[32,30]]);

// Whiskers: straight line-tool strokes, three per side
const whiskers = [
  [[-70,10],[-130,0]], [[-70,20],[-132,22]], [[-70,30],[-128,42]],
  [[70,10],[130,0]],  [[70,20],[132,22]],  [[70,30],[128,42]]
];
for (const w of whiskers) {
  selectTool('line');
  drag(w);
}

// Tail: one freehand curve swinging up from the body
selectTool('freedraw');
drag([[75,160],[115,150],[140,120],[145,85]]);

// Headline as a REAL text element: text tool -> click above the cat -> type
// with real OS keystrokes -> Escape commits
const GREETING = 'Welcome to Ui.Vision';
selectTool('text');
x.click(cx - 105, cy - 195, V);
x.type(GREETING);
x.type('\${KEY_ESC}');

x.type('\${KEY_ESC}'); // deselect so no selection handles linger

// PROVE the drawing landed: count elements by type in Excalidraw's persisted
// scene, and check the text element carries the exact greeting
let counts = null;
for (let t = 0; t < 10; t++) {
  counts = uiv.eval('var els; try { els = JSON.parse(localStorage.getItem("excalidraw") || "[]"); } catch (e) { els = []; } if (!Array.isArray(els)) { els = []; } var r = {ellipse: 0, freedraw: 0, line: 0, text: 0, textContent: ""}; for (var i = 0; i < els.length; i++) { var el = els[i]; if (el.isDeleted) { continue; } if (el.type === "text") { r.text++; r.textContent = el.text; } else if (r[el.type] !== undefined) { r[el.type]++; } } return r;');
  if (counts.ellipse >= 4 && counts.freedraw >= 7 && counts.line >= 6 && counts.text >= 1) { break; }
  uiv.sleep(500); // pacing the localStorage poll - persistence is debounced
}
if (counts.ellipse < 4 || counts.freedraw < 7 || counts.line < 6) {
  throw new Error('Scene has ' + counts.ellipse + '/4 ellipses, ' + counts.freedraw + '/7 freedraw, ' + counts.line + '/6 lines - cat did not land');
}
if (counts.text < 1 || counts.textContent !== GREETING) {
  throw new Error('Text element missing or wrong: found ' + counts.text + ' text element(s), content "' + counts.textContent + '"');
}
uiv.log('Cat + greeting drawn with real OS input: ' + counts.ellipse + ' ellipses, ' + counts.line + ' lines, ' + counts.freedraw + ' strokes, text "' + counts.textContent + '"', 'green');
`
  },
  {
    fileName: 'CU_PlayTicTacToe.js',
    path: 'LLM AI Commands/CU_PlayTicTacToe.js',
    title: 'CU_PlayTicTacToe (JS)',
    code: `// Port of Classic/LLM AI Commands/CU_PlayTicTacToe.
// The computer-use agent plays a game and reports the outcome. The classic
// if/elseif chain over its reply becomes a lookup, so adding an outcome is one
// line instead of another branch.
uiv.run('XDesktopAutomation', 'false');
uiv.open('https://ui.vision/demo/tictactoe');
uiv.run('bringBrowserToForeground');

const TASK = [
  'You are playing a game of tic tac toe against the computer. You are X and move first.',
  'If a difficulty choice is shown, select "easy" before playing.',
  'Your goal is to win. Play until the game is over.',
  'Finish your reply with exactly one of GAMEWIN, GAMELOST, GAMEDRAW or ERROR.'
].join(' ');

const result = String(uiv.ai.computerUse(TASK));
uiv.log(\`Computer Use Result = \${result}\`, 'blue');

const OUTCOMES = [
  { keyword: 'GAMEWIN', message: 'We won !!! :)', color: '#shownotification' },
  { keyword: 'GAMELOST', message: 'We lost', color: 'cyan' },
  { keyword: 'GAMEDRAW', message: 'A draw', color: 'blue' }
];

const outcome = OUTCOMES.find(o => result.includes(o.keyword));

if (outcome) {
  uiv.log(outcome.message, outcome.color);
} else if (result.includes('ERROR')) {
  throw new Error(\`the computer-use agent reported an error: \${result}\`);
} else {
  throw new Error(\`no game outcome in the agent's reply: \${result}\`);
}
`
  },
  {
    fileName: 'CU_UseWebCalculator.js',
    path: 'LLM AI Commands/CU_UseWebCalculator.js',
    title: 'CU_UseWebCalculator (JS)',
    code: `// Port of Classic/LLM AI Commands/CU_UseWebCalculator.
// The computer-use agent clicking through a web calculator.
uiv.log('This demo macro uses an external website which is not affiliated with Ui.Vision.', 'blue');

uiv.run('XDesktopAutomation', 'false');
uiv.open('https://www.theonlinecalculator.com/');
uiv.run('bringBrowserToForeground');

const TASK = [
  'Use the calculator to compute 8 + 9 by clicking the buttons.',
  'Verify the display shows 17.',
  'Finish your reply with SUCCESS or ERROR.'
].join(' ');

const result = String(uiv.ai.computerUse(TASK));
uiv.log(\`Computer Use Result = \${result}\`, 'blue');

if (result.includes('SUCCESS')) {
  uiv.log('All worked fine', 'green');
} else if (result.includes('ERROR')) {
  throw new Error(\`the computer-use agent reported an error: \${result}\`);
} else {
  throw new Error(\`no SUCCESS/ERROR verdict in the agent's reply: \${result}\`);
}
`
  },
  {
    fileName: 'DemoPDFTest_with_OCR.js',
    path: 'Browser Vision (Chrome, Edge)/DemoPDFTest_with_OCR.js',
    title: 'DemoPDFTest_with_OCR (JS)',
    code: `// Port of Classic/XModules/DemoPDFTest_with_OCR.
// A PDF in the browser's viewer has NO DOM at all — no elements, no text
// nodes, nothing for uiv.$ to find. Everything here goes through the eyes:
// image search, OCR and real mouse/keyboard input.
const x = uiv.desktop;

// Not a debugger-API issue: Firefox renders PDFs in its built-in pdf.js
// viewer, a PRIVILEGED page extensions cannot attach a content script to —
// even the open command cannot connect to that tab (verified: Error #210).
// Wrong browser is an answered question, not a broken macro: end green.
if (uiv.getVar('!BROWSER') === 'firefox') {
  uiv.exit('This demo works in Chrome and Edge only — Firefox shows PDFs in its privileged built-in viewer, which browser extensions cannot reach at all.');
}

uiv.run('setWindowSize', '800x700');
uiv.open('http://download.ui.vision/demo/pdf-test.pdf');

// --- is the PDF loaded? two independent checks ------------------------------
// Option 1: image search. The finder throws if it is not there, which is
// exactly what the classic visualAssert did.
uiv.findImage('pdftest_salesquote.png', { minScore: 0.35 });

// Option 2: text search. ocr.findTexts COUNTS without throwing, so the failure
// message can say how many it saw. Cloud engine 2, never 1 — engines 2 and 3
// read far better and both auto-detect the text language (this demo needs an
// OCR.Space key either way; see https://ocr.space/ocrapi#ocrengine2).
uiv.setVar('!OCRLANGUAGE', 'ENG');
uiv.setVar('!OCRENGINE', 2);
uiv.setVar('!OCRSCALE', true);

const matches = uiv.ocr.findTexts('sales quote', { required: false });
uiv.log(\`Number of matches: \${matches.length}\`, 'green');
if (matches.length === 0) {
  throw new Error('Something is wrong, I cannot find the text <sales quote>');
}

// --- extract the quote number and check it ----------------------------------
// The classic macro used a RELATIVE image here (green anchor, pink read
// area) through the legacy XClickRelative/OCRExtractRelative bridge. In JS
// the same thing is COMPOSED, with no image file to maintain: the
// 'sales quote' heading match IS the anchor, and the read area is the line
// directly below it — every size in units the anchor itself provides, so
// the region scales with the rendering. uiv.ocr.read({area}) replaces
// OCRExtractRelative: finders locate text, read() reads a region.
const heading = matches[0];

// an OS click into that line gives the PDF viewer focus for later scrolling
// — what the classic XClickRelative click did
x.click(uiv.offset(heading, 0, Math.round(1.4 * heading.rect.height)));

const raw = String(uiv.ocr.read({
  area: {
    x: heading.rect.left,
    y: heading.rect.top + heading.rect.height,
    width: Math.round(1.1 * heading.rect.width),
    height: Math.round(1.3 * heading.rect.height)
  }
}));
uiv.log(\`Extracted text below the heading: >\${raw}<\`, 'blue');

// the classic macro needs two executeScript commands to strip whitespace and
// test for the substring
const quote = raw.replace(/[\\\\s]/g, '');
uiv.log(\`Without spaces and line breaks, quote number: >\${quote}<\`, 'green');

if (!quote.includes('135')) {
  throw new Error(\`Wrong quote number. Extracted text was >\${raw}<\`);
}
uiv.log('Quote number OK', 'green');

// --- scroll the PDF and follow a link ---------------------------------------
// Real OS clicks aimed by OCR text — the composed form of the classic
// "XClick | ocr=..." target: the finder locates the words, uiv.desktop.click
// turns the match into an OS click at that page position. Click the document
// first so the viewer has keyboard focus.
uiv.sleep(500);
x.click(uiv.ocr.findText('sales quote'));

// page down: the shortcut differs per platform
x.type(uiv.getVar('!OS') === 'mac' ? '\${KEY_CMD+KEY_DOWN}' : '\${KEY_PAGE_DOWN}\${KEY_PAGE_DOWN}');

// the PDF scrolls asynchronously and there is no DOM event to wait on
uiv.sleep(500);
x.click(uiv.ocr.findText('website'));

// the link leaves the PDF for a normal page, so the DOM is back — classic
// assertElementPresent is just a finder call that throws
uiv.$('xpath=//*[@id="logo"]/img');
uiv.log('DemoPDFTest_with_OCR (JS) completed — landed on the website', 'green');
`
  }
]
