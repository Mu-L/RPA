import { retry, until, singletonGetter } from '../ts_utils'
import { withConsecutive, WeakConsecutive } from '../consecutive'
import { Ipc } from './ipc_promise'
import storage from '../storage'
import Ext from '../web_extension'
import { openBgWithCs } from './ipc_bg_cs'

enum IpcStatus {
  Off,
  On
}

type TabIpcItem = {
  ipc:       Ipc;
  cuid:      number;
  status:    IpcStatus;
  timestamp: number;
  session?:  string;
}

const ipcCacheStorageKey = 'ipc_cache'

// --- extension session ------------------------------------------------------
//
// A cache entry describes a content script, but it outlives one: the entry
// lives in storage.local, the script lives in the page. Reloading or updating
// the extension (every dev rebuild) kills every content script at once, and a
// browser restart hands the same tab ids out to different pages — either way
// the surviving entries describe scripts that are gone, and callers used to
// wait on ipcs that could never answer.
//
// So every entry is stamped with the session it was created in, and reads
// ignore entries from any other session. The marker lives in
// `chrome.storage.session`, which has exactly the lifetime we need: in-memory,
// cleared when the extension is reloaded/updated or the browser restarts, and
// — crucially — kept across a service-worker restart. A woken worker must NOT
// invalidate anything: the content scripts are still alive and re-pair with it
// through RECONNECT (ipc_bg_cs.js), which is what this cache is protecting.
//
// Event-based markers do not work here: bg.js notes that runtime.onInstalled
// never fires for dev builds or on Firefox, the very cases that hit this most.
const ipcSessionStorageKey = 'ipc_session'

// Resolved once per JS context and then held in memory — comparing the session
// on every cache read must not cost a storage round trip.
let sessionIdPromise: Promise<string | null> | null = null

// Present on both supported targets — Chrome MV3 and Firefox 115+, which the
// build already requires (strict_min_version in webpack.prod.config.js). The
// guard is only so a missing API degrades instead of throwing: filtering turns
// off, and a dead ipc is still caught when the call to it is rejected.
function sessionArea (): any {
  const area = (Ext as any)?.storage?.session
  return area && typeof area.get === 'function' && typeof area.set === 'function' ? area : null
}

function readSessionId (): Promise<string | null> {
  const area = sessionArea()
  if (!area) return Promise.resolve(null)

  return Promise.resolve(area.get(ipcSessionStorageKey))
    .then((obj: any) => (obj && obj[ipcSessionStorageKey]) || null)
    .catch(() => null)
}

function getSessionId (): Promise<string | null> {
  if (!sessionIdPromise) {
    sessionIdPromise = readSessionId().then((id) => {
      // do not remember "not created yet" — the background writes it at start
      if (!id) sessionIdPromise = null
      return id
    })
  }

  return sessionIdPromise
}

// Called by the background before it accepts any content-script connection, so
// that every entry it writes carries the current session (see initIPC).
export function ensureIpcSessionId (): Promise<string | null> {
  const area = sessionArea()
  if (!area) return Promise.resolve(null)

  return readSessionId().then((id) => {
    if (id) {
      sessionIdPromise = Promise.resolve(id)
      return id
    }

    const newId = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`

    return Promise.resolve(area.set({ [ipcSessionStorageKey]: newId }))
      .then(() => {
        sessionIdPromise = Promise.resolve(newId)
        return newId as string | null
      })
      .catch(() => null)
  })
}

// An entry is usable only if it was created in the session we are in now.
// Entries with no stamp predate this check, which means they were written by
// the previous extension instance — the update that shipped this code ended
// their content scripts, so treating them as foreign is correct.
function isSameSession (item: TabIpcItem, sessionId: string | null): boolean {
  if (sessionId === null) return true
  return item.session === sessionId
}

export class IpcCache {
  private cuidIpcMap: Record<string, Ipc> = {}

  fetch(): Promise<Record<string, TabIpcItem>> {
    return storage.get(ipcCacheStorageKey).then(cache => cache || {})
  }


  has (tabId: number, cuid?: number): Promise<boolean> {
    return getSessionId().then(sessionId => {
      return this.fetch().then(cache => {
        const item = cache[tabId]
        return !!item && isSameSession(item, sessionId) && (!cuid || item.cuid == cuid)
      })
    })
  }

  get (tabId: number, timeout = 2000, before = Infinity): Promise<Ipc> {
    // resolved from memory after the first call in this context
    return getSessionId().then(sessionId => {
      return until('ipc by tab id', () => {
        return this.fetch().then((cache: Record<string, TabIpcItem>) => {
          const ipcObj  = cache[tabId]
          const enabled = ipcObj && ipcObj.status === IpcStatus.On
          const valid = enabled && (before === Infinity || before > ipcObj.timestamp) && isSameSession(ipcObj, sessionId)

          if (!valid) {
            return {
              pass: false,
              result: null as any
            }
          }

          return {
            pass:   true,
            result: this.getCachedIpc(`${ipcObj.cuid}`, tabId),
          }
        })
      }, 100, timeout)
    })
  }

  domReadyGet (tabId: number, timeout = 60 * 1000, c: WeakConsecutive = true): Promise<Ipc> {
    return retry(() => {
      return this.get(tabId)
      .then(ipc => {
        // Note: must respond to DOM READY for multiple times in line,
        // before we can be sure that it's ready
        return withConsecutive(c, () => {
          return ipc.ask('DOM_READY', {}, 1000)
          .then(() => true, () => false)
        })
        .then(() => ipc)
      })
    }, {
      timeout,
      retryInterval: 1000,
      shouldRetry: (e) => true
    })()
  }

  set (tabId: number, ipc: Ipc, cuid: number): Promise<void> {
    return getSessionId().then(sessionId => this.fetch().then(cache => {
      cache[tabId] = {
        ipc,
        cuid,
        status: 1,
        timestamp: new Date().getTime(),
        // the background calls ensureIpcSessionId() before it accepts any
        // connection, so this is set whenever the browser supports it
        ...(sessionId ? { session: sessionId } : {})
      }
      // remove functions from cache object to avoid errors in saving object in storage in firefox
      let cacheObj = JSON.parse(JSON.stringify(cache))
      return storage.set(ipcCacheStorageKey, cacheObj).then(() => {})
    }))
  }

  setStatus (tabId: number, status: IpcStatus, updateTimestamp = false): Promise<boolean> {
    return this.fetch().then(cache => {
      const found = cache[tabId]
      if (!found) return false

      found.status = status

      if (updateTimestamp) {
        found.timestamp = new Date().getTime()
      }

      return storage.set(ipcCacheStorageKey, cache)
    })
  }

  enable (tabId: number): Promise<boolean> {
    return this.setStatus(tabId, IpcStatus.On, true)
  }

  disable (tabId: number): Promise<boolean> {
    return this.setStatus(tabId, IpcStatus.Off)
  }

  // The RECONNECT path (ipc_bg_cs.js) asks for this to hand a content script
  // back the cuid it was paired with. Across a service-worker restart that is
  // exactly right — same session, the script is alive and re-pairs without a
  // page reload. Across an extension reload it is not: that cuid belonged to a
  // script that no longer exists, so return null and let the page connect
  // fresh (csInit falls back to CONNECT, which writes a current-session entry).
  getCuid (tabId: number): Promise<number | null> {
    return getSessionId().then(sessionId => {
      return this.fetch().then(cache => {
        const found = cache[tabId]
        if (!found || !isSameSession(found, sessionId)) return null
        return found.cuid
      })
    })
  }

  del (tabId: number): Promise<void> {
    return this.fetch().then(cache => {
      delete cache[tabId]
      return storage.set(ipcCacheStorageKey, cache).then(() => {})
    })
  }

  // Drops entries for tabs that are gone, and entries left behind by a previous
  // extension session — after a browser restart the surviving tab ids are handed
  // to different pages, so "the tab id still exists" says nothing about the
  // content script the entry describes. Runs at every background start.
  cleanup (tabIdDict: Record<string, boolean>): Promise<Record<string, TabIpcItem>> {
    return getSessionId().then(sessionId => {
      return this.fetch().then(cache => {
        Object.keys(cache).forEach(tabId => {
          if (!tabIdDict[tabId] || !isSameSession(cache[tabId], sessionId)) {
            delete cache[tabId]
          }
        })

        return storage.set(ipcCacheStorageKey, cache).then(() => cache)
      })
    })
  }

  private getCachedIpc (cuid: string, tabId: number): Ipc {
    if (!this.cuidIpcMap[cuid]) {
      this.cuidIpcMap[cuid] = openBgWithCs(cuid).ipcBg(tabId)
    }

    return this.cuidIpcMap[cuid]
  }
}

export const getIpcCache = singletonGetter(() => new IpcCache)
