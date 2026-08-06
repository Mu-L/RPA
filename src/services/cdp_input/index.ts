import Ext from '@/common/web_extension'
// @ts-ignore -- plain JS module without type declarations
import { withDebugger } from '@/common/debugger'
import { MouseButton, MouseEventType, MouseEvent } from '@/services/xy'

// Dispatches trusted mouse input to a tab via the Chrome DevTools Protocol
// (chrome.debugger + Input.dispatchMouseEvent) — same primitives Puppeteer and
// "Claude for Chrome" use. Used by the BClick/BMove commands, so browser-scope
// clicks need no XModule install. Coordinates are CSS pixels relative to the
// page viewport of the target tab (no screen/DPI conversion involved).

// Keep the debugger attached for a while after each event so consecutive
// B-commands in a macro reuse one attachment (avoids re-attach latency and
// infobar flicker). withDebugger cancels the cleanup when reused in time.
const DETACH_AFTER_IDLE_MS = 3000

// CDP Input.dispatchMouseEvent modifier bitmask
const MODIFIER_CTRL = 2
const MODIFIER_SHIFT = 8

const CDP_BUTTON_NAME: Record<MouseButton, string> = {
  [MouseButton.Left]: 'left',
  [MouseButton.Right]: 'right',
  [MouseButton.Middle]: 'middle'
}

type CdpMouseEventParams = {
  type: 'mouseMoved' | 'mousePressed' | 'mouseReleased';
  x: number;
  y: number;
  button: string;
  buttons?: number;
  clickCount?: number;
  modifiers?: number;
}

// Whether a #down left-button press is still held (drag in progress). Needed
// because drag targets (sliders etc.) only follow `mousemove` events that carry
// the pressed-buttons state — an OS cursor does this physically, CDP must say
// it explicitly (`buttons: 1`). Tracked across commands: BMove|a,b|#down ...
// BMove|x,y|#up is the documented drag idiom.
const dragState = { leftButtonHeld: false }

const buildEventSequence = (event: MouseEvent): CdpMouseEventParams[] => {
  const { x, y } = event
  const button = CDP_BUTTON_NAME[event.button] || 'left'
  const move: CdpMouseEventParams = dragState.leftButtonHeld
    ? { type: 'mouseMoved', x, y, button: 'left', buttons: 1 }
    : { type: 'mouseMoved', x, y, button: 'none' }
  const clickPair = (clickCount: number, modifiers?: number): CdpMouseEventParams[] => [
    { type: 'mousePressed', x, y, button, clickCount, modifiers },
    { type: 'mouseReleased', x, y, button, clickCount, modifiers }
  ]

  switch (event.type) {
    case MouseEventType.Move:
      return [move]
    case MouseEventType.Down:
      dragState.leftButtonHeld = true
      return [move, { type: 'mousePressed', x, y, button, clickCount: 1 }]
    case MouseEventType.Up:
      dragState.leftButtonHeld = false
      // Move to the release point with the button still held so drag targets
      // (e.g. range sliders) track the motion, then release there
      return [
        { type: 'mouseMoved', x, y, button: 'left', buttons: 1 },
        { type: 'mouseReleased', x, y, button, clickCount: 1 }
      ]
    case MouseEventType.Click:
      dragState.leftButtonHeld = false
      return [move, ...clickPair(1)]
    case MouseEventType.DoubleClick:
      dragState.leftButtonHeld = false
      return [move, ...clickPair(1), ...clickPair(2)]
    case MouseEventType.TripleClick:
      dragState.leftButtonHeld = false
      return [move, ...clickPair(1), ...clickPair(2), ...clickPair(3)]
    case MouseEventType.CtrlClick:
      dragState.leftButtonHeld = false
      return [move, ...clickPair(1, MODIFIER_CTRL)]
    case MouseEventType.ShiftClick:
      dragState.leftButtonHeld = false
      return [move, ...clickPair(1, MODIFIER_SHIFT)]
    default:
      throw new Error(`E330: Unsupported mouse event type for browser input: ${event.type}`)
  }
}

// --- Keyboard (BType) ---

type KeyDef = {
  key: string;
  code: string;
  keyCode: number;
  text?: string;
}

// ${KEY_*} tokens supported by XType, mapped to CDP dispatchKeyEvent params.
// OS-level keys (KEY_WIN alone, Alt+Tab etc.) cannot work via CDP — browser only.
const KEY_DEFINITIONS: Record<string, KeyDef> = {
  KEY_ENTER:     { key: 'Enter', code: 'Enter', keyCode: 13, text: '\r' },
  KEY_TAB:       { key: 'Tab', code: 'Tab', keyCode: 9 },
  KEY_ESC:       { key: 'Escape', code: 'Escape', keyCode: 27 },
  KEY_SPACE:     { key: ' ', code: 'Space', keyCode: 32, text: ' ' },
  KEY_HOME:      { key: 'Home', code: 'Home', keyCode: 36 },
  KEY_END:       { key: 'End', code: 'End', keyCode: 35 },
  KEY_LEFT:      { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
  KEY_UP:        { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
  KEY_RIGHT:     { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  KEY_DOWN:      { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
  KEY_PGUP:      { key: 'PageUp', code: 'PageUp', keyCode: 33 },
  KEY_PAGE_UP:   { key: 'PageUp', code: 'PageUp', keyCode: 33 },
  KEY_PGDN:      { key: 'PageDown', code: 'PageDown', keyCode: 34 },
  KEY_PAGE_DOWN: { key: 'PageDown', code: 'PageDown', keyCode: 34 },
  KEY_BKSP:      { key: 'Backspace', code: 'Backspace', keyCode: 8 },
  KEY_BACKSPACE: { key: 'Backspace', code: 'Backspace', keyCode: 8 },
  KEY_DEL:       { key: 'Delete', code: 'Delete', keyCode: 46 },
  KEY_DELETE:    { key: 'Delete', code: 'Delete', keyCode: 46 }
}

// F1..F15
for (let i = 1; i <= 15; i++) {
  KEY_DEFINITIONS[`KEY_F${i}`] = { key: `F${i}`, code: `F${i}`, keyCode: 111 + i }
}
// KEY_A..KEY_Z, KEY_0..KEY_9, KEY_Num0..KEY_Num9
for (let c = 65; c <= 90; c++) {
  const ch = String.fromCharCode(c)
  KEY_DEFINITIONS[`KEY_${ch}`] = { key: ch.toLowerCase(), code: `Key${ch}`, keyCode: c, text: ch.toLowerCase() }
}
for (let d = 0; d <= 9; d++) {
  KEY_DEFINITIONS[`KEY_${d}`] = { key: String(d), code: `Digit${d}`, keyCode: 48 + d, text: String(d) }
  KEY_DEFINITIONS[`KEY_NUM${d}`] = { key: String(d), code: `Numpad${d}`, keyCode: 96 + d, text: String(d) }
}

const MODIFIER_KEYS: Record<string, { name: string; bit: number; keyCode: number; code: string }> = {
  KEY_CTRL:  { name: 'Control', bit: 2, keyCode: 17, code: 'ControlLeft' },
  KEY_ALT:   { name: 'Alt', bit: 1, keyCode: 18, code: 'AltLeft' },
  KEY_SHIFT: { name: 'Shift', bit: 8, keyCode: 16, code: 'ShiftLeft' },
  KEY_WIN:   { name: 'Meta', bit: 4, keyCode: 91, code: 'MetaLeft' },
  KEY_CMD:   { name: 'Meta', bit: 4, keyCode: 91, code: 'MetaLeft' },
  KEY_META:  { name: 'Meta', bit: 4, keyCode: 91, code: 'MetaLeft' }
}

type CdpKeyEventParams = Record<string, any>

const charEvents = (ch: string): CdpKeyEventParams[] => {
  const upper = ch.toUpperCase()
  const isLetterOrDigit = /^[a-zA-Z0-9]$/.test(ch)

  const base: CdpKeyEventParams = {
    key: ch,
    text: ch,
    unmodifiedText: ch,
    ...(isLetterOrDigit ? { windowsVirtualKeyCode: upper.charCodeAt(0), nativeVirtualKeyCode: upper.charCodeAt(0) } : {})
  }

  return [
    { ...base, type: 'keyDown' },
    { ...base, type: 'keyUp', text: undefined, unmodifiedText: undefined }
  ]
}

const specialKeyEvents = (def: KeyDef, modifiers = 0): CdpKeyEventParams[] => {
  const base: CdpKeyEventParams = {
    key: def.key,
    code: def.code,
    windowsVirtualKeyCode: def.keyCode,
    nativeVirtualKeyCode: def.keyCode,
    modifiers
  }
  return [
    { ...base, type: 'keyDown', ...(def.text ? { text: def.text, unmodifiedText: def.text } : {}) },
    { ...base, type: 'keyUp' }
  ]
}

// Handles single tokens (KEY_ENTER) and combos (KEY_CTRL+KEY_A):
// modifiers go down first, then the main key with the modifier bitmask, then up in reverse
const keyTokenEvents = (token: string): CdpKeyEventParams[] => {
  const parts = token.toUpperCase().split('+')
  const modifierParts = parts.filter(p => MODIFIER_KEYS[p])
  const mainParts = parts.filter(p => !MODIFIER_KEYS[p])
  const modifierBits = modifierParts.reduce((bits, p) => bits | MODIFIER_KEYS[p].bit, 0)

  const downs: CdpKeyEventParams[] = []
  const ups: CdpKeyEventParams[] = []

  modifierParts.forEach((p, i) => {
    const mod = MODIFIER_KEYS[p]
    const bitsSoFar = modifierParts.slice(0, i + 1).reduce((bits, q) => bits | MODIFIER_KEYS[q].bit, 0)
    downs.push({ type: 'keyDown', key: mod.name, code: mod.code, windowsVirtualKeyCode: mod.keyCode, nativeVirtualKeyCode: mod.keyCode, modifiers: bitsSoFar })
    ups.unshift({ type: 'keyUp', key: mod.name, code: mod.code, windowsVirtualKeyCode: mod.keyCode, nativeVirtualKeyCode: mod.keyCode, modifiers: modifierParts.slice(0, i).reduce((bits, q) => bits | MODIFIER_KEYS[q].bit, 0) })
  })

  const mains = mainParts.reduce((events: CdpKeyEventParams[], p) => {
    const def = KEY_DEFINITIONS[p]
    if (!def) throw new Error(`E336: BType: unsupported key '\${${p}}' for browser input`)
    // Inside a modifier combo, do not send the printable text (Ctrl+A must
    // select all, not type the letter "a")
    const defForCombo = modifierBits ? { ...def, text: undefined } : def
    return events.concat(specialKeyEvents(defForCombo, modifierBits))
  }, [])

  return [...downs, ...mains, ...ups]
}

// Splits an XType-style text into events: plain characters are typed one by
// one; ${KEY_*} and ${KEY_X+KEY_Y} tokens become special-key sequences
export const buildTypeEventSequence = (text: string): CdpKeyEventParams[] => {
  const tokenReg = /\$\{(KEY_[a-zA-Z0-9_+]+)\}/g
  const events: CdpKeyEventParams[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  const pushChars = (str: string) => {
    for (const ch of str) {
      events.push(...charEvents(ch))
    }
  }

  // eslint-disable-next-line no-cond-assign
  while (match = tokenReg.exec(text)) {
    pushChars(text.slice(lastIndex, match.index))
    events.push(...keyTokenEvents(match[1]))
    lastIndex = match.index + match[0].length
  }
  pushChars(text.slice(lastIndex))

  return events
}

// The web_extension adapter always creates Ext.debugger as an object, but on
// Firefox it stays an empty stub (no chrome.debugger API) — so a truthiness
// check passes and the crash surfaces later as "debugger.onDetach is
// undefined". Check for the actual method instead.
// Whether trusted CDP input exists at all — Firefox never provides the
// debugger API. Callers with an OS-input alternative (the XModule) can route
// around the B commands up front instead of failing with E331 (the
// computer-use agent does this: on Firefox its browser-scope actions run as
// XClick/XType).
export const isCdpInputAvailable = (): boolean =>
  !!(Ext.debugger && typeof (Ext.debugger as any).attach === 'function')

const ensureDebuggerApi = (commands: string, alternative: string) => {
  if (isCdpInputAvailable()) return

  if (Ext.isFirefox()) {
    throw new Error(`E331: ${commands} not supported by Firefox at the moment — Firefox does not provide the debugger API to extensions. Use ${alternative} instead`)
  }
  throw new Error(`E331: ${commands} require the debugger API (Chrome/Edge only)`)
}

export const sendCdpTypeText = (tabId: number, text: string): Promise<boolean> => {
  ensureDebuggerApi('BType is', 'XType (XModule)')
  if (typeof tabId !== 'number') {
    throw new Error('E332: BType: no tab to play in')
  }

  const events = buildTypeEventSequence(text)

  return withDebugger(
    { tabId },
    (api: any) => {
      const dispatchAll = events.reduce(
        (prev: Promise<any>, params: CdpKeyEventParams) => prev.then(() => api.sendCommand('Input.dispatchKeyEvent', params)),
        Promise.resolve()
      )

      return dispatchAll.then(
        () => api.done(null, true),
        (e: Error) => api.done(e)
      )
    },
    { cleanupTimeout: DETACH_AFTER_IDLE_MS }
  )
}

export const sendCdpMouseEvent = (tabId: number, event: MouseEvent): Promise<boolean> => {
  ensureDebuggerApi('BClick/BMove commands are', 'XClick/XClickText (XModule) or DOM commands (Click, ClickAt)')
  if (typeof tabId !== 'number') {
    throw new Error('E332: BClick/BMove: no tab to play in')
  }

  const events = buildEventSequence(event)

  return withDebugger(
    { tabId },
    (api: any) => {
      const dispatchAll = events.reduce(
        (prev: Promise<any>, params: CdpMouseEventParams) => prev.then(() => api.sendCommand('Input.dispatchMouseEvent', params)),
        Promise.resolve()
      )

      return dispatchAll.then(
        () => api.done(null, true),
        (e: Error) => api.done(e)
      )
    },
    { cleanupTimeout: DETACH_AFTER_IDLE_MS }
  )
}
