import Ext from '@/common/web_extension'
import { isSidePanelWindow } from '@/common/utils'

// go.ui.vision help links carry which interface they came from plus the
// extension version — the redirect worker logs these and the /report page
// splits the counts by gui=sidebar|ide.
export function goUivUrl (url: string): string {
  try {
    if (!/^https:\/\/go\.ui\.vision\//.test(url)) return url
    if (/[?&]gui=/.test(url)) return url

    const gui = isSidePanelWindow() ? 'sidebar' : 'ide'
    const version = Ext.runtime.getManifest().version
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}gui=${gui}&version=${encodeURIComponent(version)}`
  } catch (e) {
    return url
  }
}

// Chat-completions URL for an OpenAI-compatible endpoint. Calls to the
// Ui.Vision free-tier proxy (ai.ui.vision) additionally carry gui=sidebar|ide
// and the extension version, so the server logs show which interface the AI
// chat is used from. Other providers (OpenRouter, local) get the plain URL.
export function chatCompletionsUrl (baseURL: string): string {
  const url = `${baseURL.replace(/\/$/, '')}/chat/completions`
  try {
    if (!/\bai\.ui\.vision\b/i.test(baseURL)) return url

    const gui = isSidePanelWindow() ? 'sidebar' : 'ide'
    const version = Ext.runtime.getManifest().version
    return `${url}?gui=${gui}&version=${encodeURIComponent(version)}`
  } catch (e) {
    return url
  }
}

// Tag every <a href="https://go.ui.vision/..."> at click time (capture phase
// runs before the browser follows the link), so the ~80 literal hrefs across
// the app don't need touching — and future links get tagged automatically.
// Programmatic opens (chrome.tabs.create / window.open) bypass this and wrap
// their url in goUivUrl() at the call site.
export function installGoUivLinkDecorator (): void {
  document.addEventListener(
    'click',
    (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target || !target.closest) return

      const anchor = target.closest('a[href*="go.ui.vision"]') as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      anchor.setAttribute('href', goUivUrl(href))
    },
    true
  )
}
