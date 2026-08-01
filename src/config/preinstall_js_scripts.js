// JS script macro demos (V11 prototype, branch js-macro-test1).
// Single source for BOTH the Examples dropdown in the script view AND the
// preinstalled files in the tree's "JS" folder. File names end in ".js" —
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
// MISC: uiv.log(msg, 'green')   uiv.sleep('1s')   uiv.getVar('!CURRENT_TAB_NUMBER')   uiv.setVar('n', 1)
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
uiv.open('https://excalidraw.com/');

// CDP input does not exist on Firefox — say so and point to the twin that
// works there, then END THE RUN GREEN with uiv.exit: "wrong browser" is an
// answered question, not a broken macro — and unlike a throw, uiv.exit
// keeps the banner on screen. (!BROWSER is read after the first uiv
// command on purpose: before it, no special variable is set yet.)
if (uiv.getVar('!BROWSER') === 'firefox') {
  uiv.banner('This drawing demo uses trusted CDP input (uiv.browser.*), which only <b>Chrome and Edge</b> support. For Firefox there is an <b>XClick version</b>: "Draw a cat🐱 - XClick version" in the demo collection (Settings > General > For Tech Support/QA > Restore Demo Macros (JavaScript), folder JS > XModules).', { seconds: 25 });
  uiv.exit('Firefox detected — this demo needs Chrome or Edge. Use "Draw a cat🐱 - XClick version" from Demo and QA Test Scripts > JS > XModules instead.');
}

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
    // no path: the welcome tour sits at the JS root of the demo folder, the
    // same macro a fresh install gets at the tree root
    fileName: 'A short welcome tour.js',
    title: 'Welcome tour (JS)',
    code: WELCOME_SCRIPT
  },
  {
    // no path: preinstalled at the tree root like the welcome tour
    fileName: 'Like Ui.Vision？Give us a star 🌟.js',
    title: 'Star on GitHub (JS)',
    code: STAR_SCRIPT
  },
  {
    // no path: preinstalled at the tree root like the welcome tour
    fileName: 'Draw a cat🐱.js',
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
uiv.page.click(uiv.$('xpath=//span[contains(text(),"Ui.Vision IDE")]'));

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
uiv.page.click(uiv.$('xpath=//span[contains(text(),"Ui.Vision IDE")]'));
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

uiv.page.click('xpath=//span[contains(text(),"Ui.Vision IDE")]');
uiv.page.click("xpath=//*[text()[contains(.,'Web Testing')]]");
uiv.page.click('xpath=//span[contains(text(),"Form Autofilling")]');
uiv.page.click('xpath=//*[text()[contains(.,"General Web Automation")]]');
uiv.shot.viewport('AutoFillJS_page1');

// "Next" button (same locator as the table macro uses)
uiv.page.click('xpath=//*[@id="mG61Hd"]/div/div/div[3]/div/div/div/span/span');

// page 2: uiv.page.type fills a field in ONE call — no click to focus needed
uiv.page.type('xpath=//input[@type="text"]', 'This is a single line test...');
uiv.run('type', 'xpath=//textarea', '...and this a multiline test:\\nLine2\\nLine3');
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
// background), so switch explicitly with selectWindow. All primitives
// target the ACTIVE tab and selectWindow activates the tab it selects, so
// after each switch the whole API follows automatically.
//
// tab=N counts from the tab the macro STARTED on: tab=1 is the first tab
// to its right, tab=2 the second — the number does not depend on where the
// previous command left off.
uiv.open('https://ui.vision/demo/tabs');

// Special variables work in JS by name, exactly as in a table macro:
// uiv.getVar('!CURRENT_TAB_NUMBER') is the live 0-based tab index.
// The classic macro also prints \${!current_tab_number_relative} (distance
// from the tab the run started on). That one is DEPRECATED and throws in a
// script — every uiv call is its own mini player run and re-baselines it —
// so capture the start index once and subtract: same numbers, same asserts.
const startTabIndex = Number(uiv.getVar('!CURRENT_TAB_NUMBER'));

const tabAbs = () => Number(uiv.getVar('!CURRENT_TAB_NUMBER'));
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
// that and open the link's href directly (the selectWindow calls below
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
uiv.run('selectWindow', 'tab=1');
const t1 = uiv.eval('return document.title');
if (!t1.includes('TAB1')) { throw new Error(\`expected TAB1, got: \${t1}\`); }
logTabs('blue');
assertTabRel(1, 'after selectWindow tab=1');
uiv.page.type('id=sometext1', 'this is tab 1 (typed from JS)');

// opened from TAB1 (the rightmost tab), so the new tab lands after it = tab=2
openLinkedTab('Open yet another web page in a new browser tab');
uiv.run('selectWindow', 'tab=2');
const t2 = uiv.eval('return document.title');
if (!t2.includes('TAB2')) { throw new Error(\`expected TAB2, got: \${t2}\`); }
uiv.page.type('id=sometext2', 'And this is tab 2! (JS)');

// back to TAB1 and close it — what was TAB2 then becomes tab=1
uiv.run('selectWindow', 'tab=1');
uiv.page.type('id=sometext1', 'Now back in tab 1 - test done! (JS)');
uiv.run('selectWindow', 'tab=close');
uiv.sleep('1s');
const t3 = uiv.eval('return document.title');
if (!t3.includes('TAB2')) { throw new Error(\`expected TAB2 after close, got: \${t3}\`); }
uiv.log(\`After close, now on: \${t3}\`);

uiv.run('selectWindow', 'tab=1');
const t4 = uiv.eval('return document.title');
if (!t4.includes('TAB2')) { throw new Error(\`expected TAB2 via tab=1, got: \${t4}\`); }
logTabs('green');
assertTabRel(1, 'new tab=1 is the old TAB2');

// tab=open always appends a new tab at the far RIGHT of the window and
// switches to it — so each one lands exactly one place right of the previous
uiv.run('selectWindow', 'tab=open', 'https://ui.vision');
uiv.sleep('1s');
uiv.log(\`Opened new tab: \${uiv.eval('return document.title')}\`);
const afterFirstOpen = tabAbs();
uiv.run('selectWindow', 'tab=open', 'https://ocr.space');
uiv.sleep('1s');
uiv.log(\`Opened new tab: \${uiv.eval('return document.title')}\`);

logTabs('brown');

// Catching tab bugs is the whole point of these numbers, so both checks are
// hard failures. First the invariant that defines tab=open — each one appends
// exactly one tab further right:
if (tabAbs() !== afterFirstOpen + 1) {
  throw new Error(\`tab=open should append one tab to the right: was \${afterFirstOpen}, now \${tabAbs()}\`);
}

// ...then the classic macro's last command, assert !current_tab_number_relative
// = 3 (start tab, then TAB2, ui.vision, ocr.space). Like the classic macro this
// assumes the run started in a window with no tabs to the RIGHT of the start
// tab, since tab=open appends past them — if this is the only check that fails,
// that is why.
assertTabRel(3, 'final');
uiv.log('DemoTabs (JS) completed', 'green');
`
  },
  {
    fileName: 'DemoCsv.js',
    title: 'CSV read/write (JS)',
    code: `// CSV files are plain 2D JS arrays (Data tab -> CSV holds them).
// No variable pool, no !csvLine accumulator: read gives you an array,
// write takes one, append adds a row.
const out = [['name', 'qty']];

for (let i = 1; i <= 3; i++) {
  out.push([\`item\${i}\`, String(i * 10)]);
}

uiv.csv.write('js_demo.csv', out);
uiv.log(\`Saved js_demo.csv with \${out.length - 1} data rows\`);

// append adds ONE row and creates the file if it is not there yet —
// this is how a macro logs a result per run
uiv.csv.append('js_demo.csv', ['item4', '40']);

const rows = uiv.csv.read('js_demo.csv');
uiv.log(\`Read back \${rows.length} rows:\`);

for (const row of rows) {
  uiv.log(\`  \${row.join(' | ')}\`);
}

uiv.log(\`CSV files stored: \${uiv.csv.list().join(', ')}\`, 'green');
`
  },
  {
    fileName: 'DemoVisionOcr.js',
    title: 'Vision + OCR (JS)',
    code: `// The VISUAL finders work on anything the eye can see — any frame,
// any shadow root, canvas, even cross-origin iframes.
uiv.open('https://ui.vision/demo/webtest/frames/');

// The try/catch here is for a real ERROR: OCR can be switched off in Settings,
// and then every OCR call fails. It is NOT a stand-in for "the text might not
// be there" — that is what {required: false} does, further down. Keeping the
// two apart is what stops a genuine failure being logged as "not found".
try {
  // ALWAYS start with a full read of the page. uiv.ocr.read() hands back
  // everything OCR recognised as one string — the script form of the
  // "Show OCR Overlay" button in Settings > OCR. OCR is the one finder that
  // can fail because the text was MISREAD rather than absent, and no timeout
  // tells those apart. Reading first does:
  //   in the text          -> ocr.findText is the right tool. Use it, buttons
  //     included: no image file to maintain, and it survives a redesign, a
  //     theme change, a different DPI and a different screen size.
  //   not in the text at all -> THIS ENGINE cannot read it, however long
  //     ocr.findText waits and however you reword it. Change the READER, not the
  //     technique:
  //       1. THE MODEL: uiv.ai.find('the blue "Accept all" button') returns a
  //          match like any finder, and an LLM reads what the local engine
  //          cannot. No image file needed. It does NOT auto-wait and each call
  //          is billable — wait for the page yourself first.
  //       2. A PICTURE: save the target (the Image button in Script tools) and
  //          uiv.findImage('file.png') — pixels match or they do not. The
  //          choice for a fixed graphic, or when no AI is configured.
  //       3. ANCHOR on a word OCR DID read, and step to the target from it:
  //            uiv.browser.click(uiv.offset(uiv.ocr.findText('Privacy Policy'), 420, -30))
  //          which is the JS answer to the classic word#R420,-30 relative
  //          targets. There is deliberately NO relative command in uiv.* — a
  //          finder plus uiv.offset composes one, so there is nothing extra to
  //          learn. Unreadable buttons usually sit a fixed distance from
  //          perfectly readable body text, and the recognised text above is
  //          the menu of anchors to choose from.
  //     A DOM locator beats all three where one exists; another engine sometimes
  //     rescues it: uiv.ocr.read({engine: 2}). The built-in Javascript OCR
  //     loses light-on-dark button labels (a white "Accept all" on a blue
  //     button) and small glyphs most often — cookie and consent dialogs are
  //     image work, not OCR work.
  //   in it, but misspelled  -> match the typo with wildcards, per word:
  //     uiv.ocr.findText('Text b*x inside')
  //   in it several times    -> ocr.findText returns the FIRST; use ocr.findTexts and
  //     index the one you actually meant.
  const seen = uiv.ocr.read();
  uiv.log(\`OCR recognised: \${seen}\`, 'blue');

  const WORD = 'Text box inside';
  if (seen.toLowerCase().indexOf(WORD.toLowerCase()) === -1) {
    uiv.log(\`"\${WORD}" is NOT in the recognised text — searching for it would only fail slowly\`, 'orange');
  }

  // now the search itself, knowing what to expect from it
  const hits = uiv.ocr.findTexts(WORD, { required: false, timeout: 5 });
  uiv.log(\`OCR found \${hits.length} spot(s) matching "\${WORD}"\`);

  if (hits.length > 0 && uiv.getVar('!BROWSER') !== 'firefox') {
    // hover the match — CDP input, so Chrome/Edge only; the find above
    // already proved the OCR search works in every browser
    uiv.browser.move(hits[0]);
  }
} catch (e) {
  uiv.log(\`OCR not available: \${e.message}\`, 'orange');
}

// Vision: uiv.findImage('button.png') -> first match; a visual click is
// always explicit: uiv.browser.click(uiv.findImage('button.png'))
// (create images with the AI chat or the Image button in Script tools)
uiv.log('Done - add a uiv.img line with one of your own images', 'green');
`
  },
  {
    fileName: 'DemoFormFill.js',
    title: 'Form filling, the fast way (JS)',
    code: `// The same 10-iteration form fill as the table macro — and it should
// finish in about the same time. That is what picking the right INPUT
// TIER is for.
//
// uiv.page.type(locator, text) fills a field in ONE call: it is the
// classic 'type' command, so it finds the field, focuses it and sets the
// value in a single step. The alternative — focus it with a trusted
// click, then send real keystrokes — is TWO calls plus a keystroke per
// character, and you only need it on sites that reject synthetic input:
//
//   uiv.browser.click('id=ContactName');   // trusted focus
//   uiv.browser.type('test1');             // real keys, one CDP event each
//
// Three or more calls of one tier in a row read better aliased:
const p = uiv.page;

uiv.open('https://ui.vision/contact');

for (let i = 1; i <= 10; i++) {
  const testValue = \`test\${i}\`;

  p.type('id=ContactName', testValue);
  p.type('id=Email', \`\${testValue}@example.com\`);

  uiv.log(\`Iteration \${i}: \${testValue}\`, 'blue');
}

// prove it actually happened — a script that "ran without errors" has
// not necessarily done anything
const filled = uiv.$('id=Email').value;
if (filled !== 'test10@example.com') {
  throw new Error(\`Email field ended up as '\${filled}', expected test10@example.com\`);
}
uiv.log('All 10 iterations completed and verified', 'green');
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

// the shot's file name feeds straight into the reader
uiv.setVar('!OCRLANGUAGE', 'eng');
uiv.setVar('!OCRENGINE', 98);
const ocrResult = uiv.ocr.read({ image: titleShot });
uiv.log(\`OCR Result = \${ocrResult}\`, 'blue');

if (String(ocrResult).indexOf('RPA') !== -1) {
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
if (intro.indexOf('Use the select box to start the timer') === -1) {
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
//   // @include Demo and QA Test Scripts/JS/Core/Sub/Sub_DemoCsvRead_FillForm.js

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
// @include Demo and QA Test Scripts/JS/Core/Sub/Sub_DemoCsvRead_FillForm.js

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
if (heading.indexOf('Input box to display some results') === -1) {
  throw new Error(\`unexpected heading: \${heading}\`);
}
if (uiv.eval('return document.title') !== 'Selenium IDE executeScript Demo Page') {
  throw new Error(\`unexpected page title: \${uiv.eval('return document.title')}\`);
}

// classic sourceSearch: count occurrences in the page source
const html = uiv.eval('return document.documentElement.outerHTML');
if (html.indexOf('G-VJNCDYRXBP') === -1) {
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
uiv.setVar('!TIMEOUT_PAGELOAD', 60);
uiv.open('https://docs.google.com/forms/d/1cbI5dMRs0-t_IwNzPm6T3lAG_nPgsnJZEA-FEYVARxg/');

uiv.browser.click('xpath=//span[contains(text(),"Ui.Vision IDE")]');
uiv.browser.click("xpath=//*[text()[contains(.,'Web Testing')]]");
uiv.browser.click('xpath=//span[contains(text(),"Form Autofilling")]');
uiv.browser.click('xpath=//*[text()[contains(.,"General Web Automation")]]');
uiv.shot.viewport('AutoFillJS_page1');

// "Next" button (same locator as the table macro uses)
uiv.browser.click('xpath=//*[@id="mG61Hd"]/div/div/div[3]/div/div/div/span/span');

// page 2: trusted keystrokes for the input, classic type for multiline
uiv.browser.click('xpath=//input[@type="text"]');
uiv.browser.type('This is a single line test...');
uiv.run('type', 'xpath=//textarea', '...and this a multiline test:\\nLine2\\nLine3');
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

if (heading.toLowerCase().indexOf('robotic process automation') === -1) {
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
const b = uiv.browser;

uiv.open('https://ui.vision/demo/draw');
uiv.page.click('link=calculator');

uiv.setVar('!OCRLANGUAGE', 'eng');
uiv.setVar('!OCRENGINE', 98);

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
    fileName: 'DemoDesktopConsole.js',
    path: 'XModules/DemoDesktopConsole.js',
    title: 'DemoDesktopConsole (JS)',
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
uiv.log('DemoDesktopConsole completed', 'green');
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
    fileName: 'DemoVisualUITest.js',
    path: 'XModules/DemoVisualUITest.js',
    title: 'DemoVisualUITest (JS)',
    code: `// Port of Classic/XModules/DemoVisualUITest.
// Responsive-design testing: resize the window, then check what is visible.
//
// visualAssert and visualSearch both disappear into the finders:
//   visualAssert file   -> uiv.findImage(file)  — auto-waits, THROWS if absent
//   visualSearch file   -> uiv.findImages(file, {required: false}).length
// which is the whole point of the finder contract: "find it or fail" and
// "count them" are the same call with one option.
const shot = (name, minScore) => uiv.findImage(name, minScore ? { minScore: minScore } : undefined);

// setWindowSize drives the BROWSER window, not the page — legacy bridge
uiv.run('setWindowSize', '1024x768');
uiv.open('https://ui.vision/');

// desktop layout: the wide logo and the share buttons must be there
shot('uitest_logo_wide_dpi_96.png', 0.7);
shot('uitest_share_dpi_96.png', 0.7);
uiv.log('Desktop layout OK: wide logo and share buttons found', 'green');

// --- resize to an iPhone 6 viewport -----------------------------------------
uiv.run('setWindowSize', '375x768');

shot('uitest_logo_mobile_dpi_96.png');
shot('uitest_hamburger_dpi_96.png');
uiv.log('Mobile layout OK: mobile logo and hamburger menu found', 'green');

// The share buttons must NOT show on mobile. The page is loaded by now, so
// drop the timeout — otherwise this waits the full !TIMEOUT_WAIT to prove a
// negative, on every run.
const shares = uiv.findImages('uitest_share_dpi_96.png', { minScore: 0.7, required: false, timeout: 2 });
if (shares.length > 0) {
  throw new Error(\`Share buttons should NOT show on mobile phones — found \${shares.length}\`);
}
uiv.log('Share buttons correctly hidden on mobile', 'green');

uiv.run('setWindowSize', '1024x768');
uiv.log('DemoVisualUITest (JS) completed', 'green');
`
  },
  {
    fileName: 'DemoXClickTextRelative.js',
    path: 'XModules/DemoXClickTextRelative.js',
    title: 'DemoXClickTextRelative (JS)',
    code: `// Port of Classic/XModules/DemoXClickTextRelative.
// Same calculator as DemoOffsetClick, but clicked with real OS input.
//
// The "text#R8,-14" relative-target syntax stays on the legacy bridge: uiv.ocr.findText
// locates text, but clicking a fixed OFFSET from that text is what the
// *TextRelative commands add, and there is no finder concept for it.
const x = uiv.desktop;

uiv.open('https://ui.vision/demo/draw');
uiv.page.click('link=calculator');

uiv.setVar('!OCRLANGUAGE', 'eng');
uiv.setVar('!OCRENGINE', 98);

// 8 x 8888 =
uiv.run('XClickTextRelative', 'mc#R8,-14');    // 8
uiv.run('XClickTextRelative', 'mc#R30,-14');   // x
uiv.run('XClickTextRelative', 'mc#R8,-14');    // 8

// The last click left its position in !OCRX/!OCRY. Read them ONCE into JS
// variables: every uiv call resets those result variables, so re-reading them
// later in the loop would give whatever the previous click happened to set.
const keyX = Number(uiv.getVar('!OCRX'));
const keyY = Number(uiv.getVar('!OCRY'));
for (let i = 0; i < 3; i++) {
  x.click(keyX, keyY);   // plain screen coordinates, no scope tag needed
}

uiv.run('XClickTextRelative', 'mc#R30,-41');   // =

// read the display with the XModule's local OCR engine
uiv.setVar('!OCRENGINE', 99);
uiv.run('OCRExtractbyTextRelative', 'mc#R22,16H12W21', 's');
const shown = String(uiv.getVar('s', ''));
uiv.log(\`Extracted string (Calculator result) is "\${shown}"\`, 'blue');

// OCR of a 7-segment display picks up stray marks — keep only the digits
const digits = Number(shown.replace(/[^0-9]/g, ''));

if (digits === 71104) {
  uiv.log(\`8 x 8888 is \${digits}, Calculator works!\`, 'green');
} else {
  throw new Error(\`Calculator result is wrong: read "\${shown}" -> \${digits}, expected 71104\`);
}
`
  },
  {
    fileName: 'Prompt_ParseHTML.js',
    path: 'LLM AI Commands/Prompt_ParseHTML.js',
    title: 'Prompt_ParseHTML (JS)',
    code: `// Port of Classic/LLM AI Commands/Prompt_ParseHTML.
// Send page content to the LLM, then turn its answer into a CSV.
//
// uiv.ai.ask is one round trip to the configured model. Everything
// AROUND it — cleaning the HTML, splitting the reply, building the rows — is
// ordinary JavaScript, which is where the classic macro needed two
// executeScript_Sandbox blocks with the code squeezed into one cell.
uiv.open('https://forum.ui.vision/');

// grab the page source and strip the parts the model does not need. Sending
// less costs less and answers better.
const html = uiv.eval(\`
  var s = document.body.innerHTML;
  s = s.replace(/<script[\\\\s\\\\S]*?<\\\\/script>/gi, '');
  s = s.replace(/<style[\\\\s\\\\S]*?<\\\\/style>/gi, '');
  s = s.replace(/<!--[\\\\s\\\\S]*?-->/g, '');
  return s.replace(/\\\\s+/g, ' ').slice(0, 20000);
\`);
uiv.log(\`Extracted \${html.length} characters of HTML\`, 'brown');

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
    fileName: 'Prompt_CompareImages.js',
    path: 'LLM AI Commands/Prompt_CompareImages.js',
    title: 'Prompt_CompareImages (JS)',
    code: `// Port of Classic/LLM AI Commands/Prompt_CompareImages.
// Ask the model whether two images match. The classic macro's \`verify\`
// commands become plain checks — and unlike verify, a failure here can say
// what the model actually replied.
const ask = (imageA, imageB, question) =>
  String(uiv.ai.ask(question, { images: [imageA, imageB] })).trim().toLowerCase();

const QUESTION = 'Are both images the same? Answer only true or false.';

// Test 1: the same image twice -> must be true
const same = ask('canvas_wyoming_dpi_96.png', 'canvas_wyoming_dpi_96.png', QUESTION);
uiv.log(\`Test1: Are the images the same? \${same}\`, 'green');
if (same.indexOf('true') === -1) {
  throw new Error(\`Test1 failed: identical images should compare as true, model said "\${same}"\`);
}

// Test 2: two different images -> must be false. Deliberately two UNRELATED
// pictures (a Wyoming map vs a Hyde Park map): wyoming_verify is a crop of
// the SAME map, and "are these the same?" on a crop is a judgment call that
// smaller models answer with true — the demo must not fail on that.
const different = ask('canvas_wyoming_dpi_96.png', 'canvas_hydepark_dpi_96.png', QUESTION);
uiv.log(\`Test2: Are the images the same? \${different}\`, 'green');
if (different.indexOf('false') === -1) {
  throw new Error(\`Test2 failed: different images should compare as false, model said "\${different}"\`);
}

uiv.log('Prompt_CompareImages (JS) completed — both comparisons as expected', 'green');
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

if (result.lastIndexOf('SUCCESS') >= 0) {
  uiv.log('All worked fine', 'green');
} else if (result.lastIndexOf('ERROR') >= 0) {
  throw new Error(\`the computer-use agent reported an error: \${result}\`);
} else {
  // the classic macro only echoed a warning here; a script should fail, since
  // "no verdict" means the run cannot be called a success
  throw new Error(\`no SUCCESS/ERROR verdict in the agent's reply: \${result}\`);
}
`
  },
  {
    fileName: 'ScreenXY_SearchForum.js',
    path: 'LLM AI Commands/ScreenXY_SearchForum.js',
    title: 'ScreenXY_SearchForum (JS)',
    code: `// Port of Classic/LLM AI Commands/ScreenXY_SearchForum.
// uiv.ai.find asks the model WHERE something is on screen: a vision finder
// powered by an LLM rather than template matching, for when there is no image
// to match and no DOM to query. It returns a match, DPI already accounted for.
// DOM clicks act on the model's point, so this runs in every browser; typing
// goes through uiv.page.type on the focused search field.
uiv.run('XDesktopAutomation', 'false');
uiv.open('https://forum.ocr.space/');

// uiv.ai.find RETURNS the match, so the !AI1/!AI2 dance the classic macro
// needed is gone — reading those in a script now throws, because the next
// uiv call overwrites them.
// input tiers directly and the scope guard applies. It throws by itself when
// the model gives no usable coordinates, so there is nothing to check here.
const locate = (what) => {
  const point = uiv.ai.find(what);
  uiv.log(\`\${what} => \${point.x},\${point.y}\`, 'blue');
  return point;
};

const searchIcon = locate('Find the search icon (magnifying glass).');
uiv.page.click(searchIcon);

// fill the search box the click revealed — the forum searches as you type,
// so no ENTER key is needed (key codes are uiv.browser.type territory)
uiv.page.type('css=input[type="search"], input[name="term"], input', 'aiprompt');

const firstResult = locate('Find the first search result (blue text)');
uiv.page.click(firstResult);

uiv.log('ScreenXY_SearchForum (JS) completed', 'green');
`
  },
  {
    fileName: 'CU_PressClear_Desktop.js',
    path: 'LLM AI Commands/CU_PressClear_Desktop.js',
    title: 'CU_PressClear_Desktop (JS)',
    code: `// Port of Classic/LLM AI Commands/CU_PressClear_Desktop.
// The computer-use agent driving the Ui.Vision IDE itself, at DESKTOP scope —
// so it can reach the app window, not just the web page.
uiv.run('XDesktopAutomation', 'true');

const TASK = [
  'Automate the Ui.Vision IDE.',
  'Find and press the Clear button.',
  'To find it you may need to select the Logs tab first.',
  'Finish your reply with SUCCESS or ERROR.'
].join(' ');

const result = String(uiv.ai.computerUse(TASK));
uiv.log(\`Computer Use Result = \${result}\`, 'blue');

if (result.lastIndexOf('SUCCESS') >= 0) {
  uiv.log('All worked fine', 'green');
} else if (result.lastIndexOf('ERROR') >= 0) {
  throw new Error(\`the computer-use agent reported an error: \${result}\`);
} else {
  // no verdict means the run cannot be called a success — the classic macro
  // only echoed a warning here and still finished green
  throw new Error(\`no SUCCESS/ERROR verdict in the agent's reply: \${result}\`);
}
`
  },
  {
    fileName: 'ScreenXY_PressClear_Desktop.js',
    path: 'LLM AI Commands/ScreenXY_PressClear_Desktop.js',
    title: 'ScreenXY_PressClear_Desktop (JS)',
    code: `// Port of Classic/LLM AI Commands/ScreenXY_PressClear_Desktop.
// uiv.ai.find at DESKTOP scope: ask the model where something is on the
// whole screen, then click it with real OS input.
const x = uiv.desktop;

uiv.run('XDesktopAutomation', 'true');

// uiv.ai.find returns the match with the screen scaling already applied, so
// there is no !AI1/!AI2 to race against
// uiv.ai.find returns a MATCH, like any other finder — so it feeds the
// input tiers directly and the scope guard applies. It throws by itself when
// the model gives no usable coordinates, so there is nothing to check here.
const locate = (what) => {
  const point = uiv.ai.find(what);
  uiv.log(\`\${what} => \${point.x},\${point.y}\`, 'blue');
  return point;
};

const logsTab = locate('Look for the Ui.Vision IDE. In it, find the Logs tab.');
x.click(logsTab);
uiv.log('Logs tab selected', 'green');

const clearButton = locate('Look for the Ui.Vision IDE. In it, find the Clear button');
x.click(clearButton);
uiv.log(\`Clear button pressed at X,Y: \${clearButton.x},\${clearButton.y}\`, 'green');
`
  },
  {
    fileName: 'Sub_XDesktopAutomation_Area.js',
    path: 'XModules_Desktop/Sub/Sub_XDesktopAutomation_Area.js',
    title: 'Sub_XDesktopAutomation_Area (JS)',
    code: `// Port of Classic/XModules_Desktop/Sub/Sub_XDesktopAutomation_Area.
//
// Narrows the desktop vision search to the Ui.Vision window, using two anchor
// images as opposite corners. The classic version needs four
// executeScript_Sandbox commands just to do arithmetic on !imagex/!imagey/
// !imagewidth/!imageheight — here the finder returns a match object with a
// rect, so the maths is one line each.
//
// Include it with:
//   // @include Demo and QA Test Scripts/JS/XModules_Desktop/Sub/Sub_XDesktopAutomation_Area.js

function limitSearchToIdeWindow () {
  const DESKTOP = { scope: 'desktop', minScore: 0.4 };

  const topLeft = uiv.findImage('desktop_area_topleft3_dpi_96.png', DESKTOP);
  const x1 = topLeft.x - topLeft.rect.width / 1.5;
  const y1 = topLeft.y + topLeft.rect.height / 2;

  const bottomRight = uiv.findImage('desktop_area_bottomright_dpi_96.png', DESKTOP);
  const x2 = bottomRight.x + bottomRight.rect.width / 2;
  const y2 = bottomRight.y - bottomRight.rect.height / 2;

  uiv.log(\`x1=\${x1}, y1=\${y1}, x2=\${x2}, y2=\${y2}\`, 'blue');
  uiv.run('visionLimitSearchArea', \`area=\${x1},\${y1},\${x2},\${y2}\`);

  return { x1: x1, y1: y1, x2: x2, y2: y2 };
}

// runnable on its own: opening this file and pressing Play checks that both
// anchor images still match the current IDE window
if (uiv.main) {
  uiv.run('XDesktopAutomation', 'true');
  limitSearchToIdeWindow();
  uiv.log('Sub_XDesktopAutomation_Area self-test: both anchors found', 'green');
}
`
  },
  {
    fileName: 'DemoXDesktopAutomation.js',
    path: 'XModules_Desktop/DemoXDesktopAutomation.js',
    title: 'DemoXDesktopAutomation (JS)',
    code: `// Port of Classic/XModules_Desktop/DemoXDesktopAutomation.
// Desktop image search: Ui.Vision automating its own IDE window.
//
// The search area comes from a shared function rather than a \`run\` of another
// macro — the subroutine is spliced in before this compiles:
// @include Demo and QA Test Scripts/JS/XModules_Desktop/Sub/Sub_XDesktopAutomation_Area.js

const x = uiv.desktop;
const DESKTOP = { scope: 'desktop', minScore: 0.5 };

uiv.log('Running DESKTOP image search now', '#shownotification');
uiv.run('XDesktopAutomation', 'true');

limitSearchToIdeWindow();

// The Logs tab looks different depending on whether it is already selected.
// The classic macro toggles !errorignore around the first attempt and then
// inspects !statusOK; in JS this is just "try one, fall back to the other" —
// and the fallback cannot accidentally swallow a LATER error, which is the
// risk with a global ignore flag.
const clickLogsTab = () => {
  const white = uiv.findImages('desktop_logstab_white_dpi_96.png', { scope: 'desktop', minScore: 0.5, required: false });
  if (white.length) {
    x.click(white[0]);
    return 'white';
  }
  x.click(uiv.findImage('desktop_logstab_grey_dpi_96.png', { scope: 'desktop', minScore: 0.5 }));
  return 'grey';
};
uiv.log(\`Logs tab clicked (\${clickLogsTab()} variant)\`, 'blue');

x.click(uiv.findImage('desktop_clearbutton_dpi_96.png', DESKTOP));
uiv.log('Log cleared by macro (clear button pressed)', 'blue');

// open the other tabs in turn
x.click(uiv.findImage('desktop_vartab_dpi_96.png', DESKTOP));
x.click(uiv.findImage('desktop_scrtab_dpi_96.png', { scope: 'desktop', minScore: 0.4 }));
x.click(uiv.findImage('desktop_vitab_dpi_96.png', { scope: 'desktop', minScore: 0.4 }));

// classic visualAssert -> the finder throws if it is not there
uiv.findImage('desktop_check_v_tab_dpi_96.png', DESKTOP);
uiv.log('DemoXDesktopAutomation (JS) completed', 'green');
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
uiv.log('This demo macro uses an external website which is not affiliated with Ui.Vision.', 'blue');

uiv.run('XDesktopAutomation', 'false');
uiv.run('bringBrowserToForeground');
uiv.open('https://www.gamepix.com/play/tic-tac-toe-html5');

const TASK = [
  'You are playing a game of tic tac toe against the computer.',
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

const outcome = OUTCOMES.find(o => result.lastIndexOf(o.keyword) >= 0);

if (outcome) {
  uiv.log(outcome.message, outcome.color);
} else if (result.lastIndexOf('ERROR') >= 0) {
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
uiv.run('bringBrowserToForeground');
uiv.open('https://www.theonlinecalculator.com/');

const TASK = [
  'Use the calculator to compute 8 + 9 by clicking the buttons.',
  'Verify the display shows 17.',
  'Finish your reply with SUCCESS or ERROR.'
].join(' ');

const result = String(uiv.ai.computerUse(TASK));
uiv.log(\`Computer Use Result = \${result}\`, 'blue');

if (result.lastIndexOf('SUCCESS') >= 0) {
  uiv.log('All worked fine', 'green');
} else if (result.lastIndexOf('ERROR') >= 0) {
  throw new Error(\`the computer-use agent reported an error: \${result}\`);
} else {
  throw new Error(\`no SUCCESS/ERROR verdict in the agent's reply: \${result}\`);
}
`
  },
  {
    fileName: 'DemoPDFTest_with_OCR.js',
    path: 'XModules/DemoPDFTest_with_OCR.js',
    title: 'DemoPDFTest_with_OCR (JS)',
    code: `// Port of Classic/XModules/DemoPDFTest_with_OCR.
// A PDF in the browser's viewer has NO DOM at all — no elements, no text
// nodes, nothing for uiv.$ to find. Everything here goes through the eyes:
// image search, OCR and real mouse/keyboard input.
const x = uiv.desktop;

if (uiv.getVar('!BROWSER') === 'firefox') {
  throw new Error('This macro works only in Chrome and Edge — Firefox does not support the debugger API used here');
}

uiv.run('setWindowSize', '800x700');
uiv.open('http://download.ui.vision/demo/pdf-test.pdf');

// --- is the PDF loaded? two independent checks ------------------------------
// Option 1: image search. The finder throws if it is not there, which is
// exactly what the classic visualAssert did.
uiv.findImage('pdftest_salesquote.png', { minScore: 0.35 });

// Option 2: text search. ocr.findTexts COUNTS without throwing, so the failure
// message can say how many it saw.
uiv.setVar('!OCRLANGUAGE', 'ENG');
uiv.setVar('!OCRENGINE', 1);
uiv.setVar('!OCRSCALE', true);

const matches = uiv.ocr.findTexts('sales quote', { required: false });
uiv.log(\`Number of matches: \${matches.length}\`, 'green');
if (matches.length === 0) {
  throw new Error('Something is wrong, I cannot find the text <sales quote>');
}

// --- extract the quote number and check it ----------------------------------
// A RELATIVE image: the green anchor is searched for, and the pink box marks
// the region to read. OCRExtractRelative is the ONE thing the finders cannot
// express — they locate text, they do not read an area — so it stays on the
// legacy bridge.
uiv.run('XClickRelative', 'getquotenumber_dpi_96_relative.png@0.30');
uiv.run('OCRExtractRelative', 'getquotenumber_dpi_96_relative.png@0.30', 'q');

const raw = String(uiv.getVar('q', ''));
uiv.log(\`Extracted text in pink area: >\${raw}<\`, 'blue');

// the classic macro needs two executeScript commands to strip whitespace and
// test for the substring
const quote = raw.replace(/[\\\\s]/g, '');
uiv.log(\`Without spaces and line breaks, quote number: >\${quote}<\`, 'green');

if (quote.lastIndexOf('135') === -1) {
  throw new Error(\`Wrong quote number. Extracted text was >\${raw}<\`);
}
uiv.log('Quote number OK', 'green');

// --- scroll the PDF and follow a link ---------------------------------------
// The X commands need the RealUser XModule. Click the document first so the
// viewer has keyboard focus — "ocr=" targets let the classic commands find
// text themselves.
uiv.sleep(500);
uiv.run('XClick', 'ocr=sales quote');

// page down: the shortcut differs per platform
x.type(uiv.getVar('!OS') === 'mac' ? '\${KEY_CMD+KEY_DOWN}' : '\${KEY_PAGE_DOWN}\${KEY_PAGE_DOWN}');

// the PDF scrolls asynchronously and there is no DOM event to wait on
uiv.sleep(500);
uiv.run('XClick', 'ocr=website');

// the link leaves the PDF for a normal page, so the DOM is back — classic
// assertElementPresent is just a finder call that throws
uiv.$('xpath=//*[@id="logo"]/img');
uiv.log('DemoPDFTest_with_OCR (JS) completed — landed on the website', 'green');
`
  },
  {
    fileName: 'TestAiLocate.js',
    title: 'Test uiv.ai.find (JS)',
    code: `// Smallest useful test of uiv.ai.find (the classic aiScreenXY).
//
// It asks the model to find something whose REAL position the DOM already
// knows, then compares the two. That is the only way to tell the three failure
// modes apart without squinting at the screen:
//
//   right spot            -> the provider path works
//   consistently offset   -> the image was scaled and the factor was not
//                            divided back out
//   somewhere arbitrary   -> the model is bad at spatial grounding; not a
//                            plumbing problem
//
// Wikipedia's search box is a good target: large, unambiguous, and it has a
// stable id so the DOM answer is exact.
uiv.open('https://www.wikipedia.org');

// The page's OWN viewport, for comparison with the "aiScreenXY frame" line.
// It has to come from the page: window.innerWidth inside the extension is the
// side panel's window, which is a different thing entirely.
const view = uiv.eval('return innerWidth + "x" + innerHeight');
uiv.log(\`page viewport \${view} — the screenshot should match this\`, 'blue');

const truth = uiv.$('css=#searchInput');
uiv.log(\`DOM says the search box centre is at \${truth.x}, \${truth.y}\`, 'blue');

const guess = uiv.ai.find('the search input box in the middle of the page');
uiv.log(\`The model says \${guess.x}, \${guess.y}\`, 'blue');

const dx = guess.x - truth.x;
const dy = guess.y - truth.y;
const distance = Math.round(Math.sqrt(dx * dx + dy * dy));

uiv.log(\`Off by \${dx}, \${dy} — \${distance}px away\`, 'brown');

// Is the guess inside the element the DOM found? That is the only test that
// matters: a click at the guess must land on the box.
const r = truth.rect;
const inside =
  guess.x >= r.left && guess.x <= r.left + r.width &&
  guess.y >= r.top && guess.y <= r.top + r.height;

// Stop HERE when the point is wrong. Clicking anyway lands on the page
// background, and the run then fails on "no input field is focused" — which
// describes the consequence and hides the cause.
if (!inside) {
  throw new Error(
    \`uiv.ai.find missed: \${distance}px away (off by \${dx}, \${dy}), outside the box \` +
    \`(\${r.left},\${r.top} \${r.width}x\${r.height}). Check the "aiScreenXY frame" line in the log: \` +
    \`if the screenshot size differs from the viewport size the coordinates are being transformed \` +
    \`wrongly, and no model can fix that; if they match, it is the model's aim.\`
  );
}

uiv.log('PASS — the coordinates land inside the search box', 'green');

// prove it end to end: click where the model pointed and type there
uiv.page.click(guess);
uiv.browser.type('located by AI');

const typed = uiv.$('css=#searchInput').value;
if (typed.indexOf('located by AI') === -1) {
  throw new Error(\`the click did not land in the search box — the field contains "\${typed}"\`);
}
uiv.log('Typed into the box the model pointed at — uiv.ai.find works end to end', 'green');
`
  }
]
