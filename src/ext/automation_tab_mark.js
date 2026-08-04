// Marks the tab(s) Ui.Vision is currently automating (same pattern as
// Claude for Chrome):
//  - a thin glowing border is drawn around the page content
//    (kept small/subtle so it does not disturb replay or screenshots)
//  - [disabled, see USE_TAB_GROUPS] the tab is put into a labeled tab group
//    in the tab strip ("Ui.Vision" — orange while recording, blue while
//    replaying)
//
// Chrome only: tab groups + chrome.scripting are not available in Firefox,
// every entry point degrades to a no-op there.

import log from '../common/log'
import storage from '../common/storage'

const COLORS = {
  // group colors must be one of Chrome's 9 preset tab group colors
  recording: { group: 'orange', border: '#ff7a00' },
  playing: { group: 'blue', border: '#1a6ce0' },
  // ai = the sidebar AI agent is working on this tab — orange to match the
  // AI chat's action text color (.sender-action in ai-chat.scss)
  ai: { group: 'orange', border: '#ffa500' }
  // There was a green 'idle' mark here too: while the side panel was open and
  // nothing ran, it framed the tab the next run WOULD target. Removed in
  // 10.0.34 — a border on a page Ui.Vision is not touching is a permanent
  // decoration on the user's browsing, and it injects into every tab the user
  // visits just for that. Marks now exist only while something is running.
}

const GROUP_TITLE = 'Ui.Vision'
// The title was spelled "UI.Vision" before the 2026-07 wording pass; groups
// left over from a pre-upgrade session must still be swept, so cleanup
// queries both spellings while new groups get the current one.
const GROUP_TITLES_TO_SWEEP = [GROUP_TITLE, 'UI.Vision']

// Off since 10.0.33, and the "tabGroups" manifest permission is gone with it.
// The permission carries the "View and manage your tab groups" warning, and a
// new warning-carrying permission in an update puts every existing install into
// Chrome's "Action required — accept the new permissions" state until the user
// clicks Accept. That is far too much friction for a purely cosmetic mark: the
// group is never read back by the player or by tab resolution, so nothing but
// the tab strip's appearance changes. The glow border below carries the whole
// feature now (it needs only "scripting", which we already have).
//
// If this ever comes back, make it an optional_permission requested from a user
// gesture — optional permissions do not trigger the disable-on-update prompt,
// and supportsTabGroups() below is already the right guard (Chrome leaves the
// chrome.tabGroups namespace undefined until the permission is granted).
const USE_TAB_GROUPS = false

// The border is a DOM overlay element with a fixed id (not insertCSS): the
// navigation listener can fire more than once per page, and stacked insertCSS
// copies are not reliably removed by removeCSS — a DOM node with an id is
// idempotent to add and trivially reliable to remove.
const BORDER_ID = '__uivision_automation_border__'

// runs inside the page (chrome.scripting.executeScript) — no closures allowed
const injectedShowBorder = (id, color) => {
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('div')
    el.id = id
    document.documentElement.appendChild(el)
  }
  // 2px ring with a faint glow, pointer-events none — page stays fully usable
  el.style.cssText = [
    'position: fixed',
    'top: 0',
    'left: 0',
    'right: 0',
    'bottom: 0',
    'pointer-events: none',
    'z-index: 2147483647',
    `box-shadow: inset 0 0 0 2px ${color}, inset 0 0 8px 2px ${color}55`
  ].join(';')
}

const injectedHideBorder = (id) => {
  const el = document.getElementById(id)
  if (el) el.remove()
}

const current = {
  mode: null, // 'recording' | 'playing' | 'ai' | null
  groupId: null,
  tabIds: new Set(),
  // true while a 'playing' mark runs with "Replay animations" OFF: the
  // mode/tabIds bookkeeping is kept (so unmark still works) but nothing is
  // drawn — the setting's promise is "no decoration during replay", and that
  // includes the blue border
  visualsSuppressed: false
}

// "Replay animations" (config.playHighlightElements, default ON) also governs
// the replay border. Only the 'playing' mark checks it: recording and the AI
// mark are not replay decoration — the AI border in particular is the user's
// only sign of which tab the agent is driving.
const replayBorderEnabled = async () => {
  try {
    const config = (await storage.get('config')) || {}
    return config.playHighlightElements !== false // missing key = default ON
  } catch (e) {
    return true
  }
}

const supportsTabGroups = () => {
  return typeof chrome !== 'undefined' && !!(chrome.tabs && chrome.tabs.group && chrome.tabGroups)
}

const supportsScripting = () => {
  return typeof chrome !== 'undefined' && !!(chrome.scripting && chrome.scripting.executeScript)
}

const insertBorder = (tabId, mode) => {
  if (!supportsScripting()) return Promise.resolve()

  return chrome.scripting
    .executeScript({
      target: { tabId },
      func: injectedShowBorder,
      args: [BORDER_ID, COLORS[mode].border]
    })
    .catch((e) => log.warn(`automation tab mark: show border failed - ${e && e.message}`))
}

const removeBorder = (tabId) => {
  if (!supportsScripting()) return Promise.resolve()

  return chrome.scripting
    .executeScript({
      target: { tabId },
      func: injectedHideBorder,
      args: [BORDER_ID]
    })
    .catch(() => {}) // tab may be gone — nothing to remove then
}

// Put the tab into the labeled group and give it the glow border.
// Safe to call repeatedly with the same tab.
export const markAutomationTab = async (tabId, mode) => {
  if (!tabId || !COLORS[mode]) return

  // switching recording -> playing (or vice versa): start over with new color
  if (current.mode && current.mode !== mode) {
    await unmarkAutomationTabs()
  }

  current.mode = mode

  if (current.tabIds.has(tabId)) return
  current.tabIds.add(tabId)

  // replay with highlighting off: keep the state, skip every visual (border
  // now, group below, and re-inserts via visualsSuppressed in onUpdated)
  if (mode === 'playing' && !(await replayBorderEnabled())) {
    current.visualsSuppressed = true
    return
  }
  current.visualsSuppressed = false

  insertBorder(tabId, mode)

  if (!USE_TAB_GROUPS || !supportsTabGroups()) return

  try {
    const groupId = await chrome.tabs.group(
      current.groupId !== null ? { tabIds: tabId, groupId: current.groupId } : { tabIds: tabId }
    )
    current.groupId = groupId
    await chrome.tabGroups.update(groupId, {
      title: GROUP_TITLE,
      color: COLORS[mode].group
    })
  } catch (e) {
    // tab might be gone already, or grouping not allowed (e.g. pinned tab)
    log.warn(`automation tab mark: tab group failed - ${e && e.message}`)
  }
}

// Remove border + dissolve the group for all marked tabs.
// Deliberately stateless where possible: the MV3 service worker can restart
// mid-replay and lose `current`, so we also find marked tabs through the
// "Ui.Vision" tab group itself and strip both border color variants.
// opts.colors limits the group sweep to those colors — unused since the green
// idle mark went away, kept because the group sweep is the only handle on
// marks a restarted worker no longer remembers.
export const unmarkAutomationTabs = async (opts = {}) => {
  const candidates = new Set(current.tabIds)

  current.mode = null
  current.groupId = null
  current.tabIds = new Set()
  current.visualsSuppressed = false

  if (supportsTabGroups()) {
    try {
      const groupLists = await Promise.all(
        GROUP_TITLES_TO_SWEEP.map((title) => chrome.tabGroups.query({ title }))
      )
      const groups = groupLists.reduce((all, list) => all.concat(list), [])

      for (const group of groups) {
        if (opts.colors && opts.colors.indexOf(group.color) === -1) continue
        const tabs = await chrome.tabs.query({ groupId: group.id })
        tabs.forEach((t) => candidates.add(t.id))

        if (tabs.length) {
          await chrome.tabs.ungroup(tabs.map((t) => t.id))
        }
      }
    } catch (e) {
      log.warn(`automation tab mark: ungroup failed - ${e && e.message}`)
    }
  }

  for (const tabId of candidates) {
    removeBorder(tabId)
  }
}

// Keep the border alive across page navigations in marked tabs
// (insertCSS only affects the current document and is lost on navigation)
export const bindAutomationTabMarkEvents = () => {
  if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.onUpdated) return

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (!current.mode || !current.tabIds.has(tabId)) return
    if (current.visualsSuppressed) return // replay marks run invisible then
    if (changeInfo.status === 'loading' || changeInfo.status === 'complete') {
      insertBorder(tabId, current.mode)
    }
  })

  chrome.tabs.onRemoved.addListener((tabId) => {
    current.tabIds.delete(tabId)
  })
}
