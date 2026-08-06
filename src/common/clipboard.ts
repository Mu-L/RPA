
function setStyle ($dom: HTMLElement, obj: Partial<CSSStyleDeclaration>) {
  Object.keys(obj).forEach((key: string) => {
    $dom.style[key as any] = obj[key as any] as any
  })
}

function createTextarea (): HTMLDivElement {
  // [legacy code] Used to use textarea for copy/paste
  //
  // const $input = document.createElement('textarea')
  // // Note: Firefox requires 'contenteditable' attribute, even on textarea element
  // // without it, execCommand('paste') won't work in Firefox
  // // reference: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard#Browser-specific_considerations_2
  // $input.setAttribute('contenteditable', true)
  // $input.id = 'clipboard_textarea'

  // Note: 2018-09-01, Firefox 61.0.2: Only able to paste clipboard into textarea for one time.
  // Switching to contenteditable div works fine
  const $input = document.createElement('div')
  $input.setAttribute('contenteditable', 'true')
  $input.id = 'clipboard_textarea'

  setStyle($input, {
    position: 'aboslute',
    top: '-9999px',
    left: '-9999px'
  })

  ;(document.body || document.documentElement).appendChild($input);
  return $input
}

function getTextArea (): HTMLDivElement {
  const $el = document.getElementById('clipboard_textarea')
  if ($el)  return $el as HTMLDivElement
  return createTextarea()
}

function withInput <T>(fn: (div: HTMLDivElement) => T): T | undefined {
  const $input = getTextArea()
  let ret: T | undefined

  try {
    ret = fn($input)
  } catch (e) {
    console.error(e)
  } finally {
    $input.innerHTML = ''
  }

  return ret
}

// execCommand fallbacks: still the only route in contexts where the async
// Clipboard API is unavailable, and on Chrome extension pages it works without
// the document being focused (navigator.clipboard throws "Document is not
// focused" there when the user is on the website, which is the normal state
// during a macro run)
const legacySet = (text: string): void => {
  withInput($input => {
    $input.innerText = text
    $input.focus()
    document.execCommand('selectAll', false, null as any)
    document.execCommand('copy')
  })
}

const legacyGet = (): string | undefined => {
  return withInput($input => {
    $input.blur()
    $input.focus()

    const res = document.execCommand('paste')

    // an unreadable clipboard is undefined, never a sentinel string —
    // callers must not receive "no luck" as if it were clipboard content
    return res ? $input.innerText : undefined
  })
}

const api = {
  set: (text: string): Promise<void> => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(() => legacySet(text))
    }
    return Promise.resolve(legacySet(text))
  },
  get: (): Promise<string | undefined> => {
    // Firefox: execCommand('paste') is dead in extension pages, readText works
    // (clipboardRead permission). Chrome: readText needs document focus, so
    // fall through to execCommand when it throws.
    if (navigator.clipboard && navigator.clipboard.readText) {
      return navigator.clipboard.readText().catch(() => legacyGet())
    }
    return Promise.resolve(legacyGet())
  }
}

export default api
