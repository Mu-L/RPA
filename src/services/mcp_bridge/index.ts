import { message } from 'antd'
import * as act from '@/actions'
import { Actions as simpleActions } from '@/actions/simple_actions'
import { MCP_BRIDGE } from '@/common/constant'
import { getActiveWebTab } from '@/common/tab_utils'
import { getVarsInstance } from '@/common/variables'
import { delayMs } from '@/common/utils'
import Ext from '@/common/web_extension'
import { captureScreenShot } from '@/modules/helper'
import { getMacroFileNodeList } from '@/recomputed'
import { store } from '@/redux'
import { getStorageManager } from '@/services/storage'
import { DEFAULT_MACRO_AGENT_SYSTEM_PROMPT } from '@/services/ai/macro_agent/service'
import { MacroAgentTools } from '@/services/ai/macro_agent/tools'

// MCP bridge client — lets Claude Code (or any MCP client) drive Ui.Vision.
//
// The local bridge process (mcp/uivision-mcp-bridge.js) runs a WebSocket
// server on 127.0.0.1; this client dials out to it from the SIDE PANEL
// context (the tools need the panel: redux store, screenshot pipeline,
// devicePixelRatio) and executes forwarded tool calls with the same
// MacroAgentTools the built-in AI chat uses. Enabled via Settings > AI
// (config.mcpBridgeEnabled / mcpBridgePort / mcpBridgeToken); the panel must
// be open for the connection to exist — by design, so the user can watch.

// The two things a stuck user has almost always missed: they never ran the
// installer, or they ran it and did not FULLY restart the MCP client (servers
// are loaded only at startup, so an already-open client never spawns the
// bridge and the port stays dead). Say both wherever the bridge is unreachable
// — "is the bridge process running?" alone leaves them with nothing to try.
const NOT_REACHABLE_HINT =
  'Run "npx uivision-mcp-bridge --setup" in a terminal, then fully restart Claude Code (a new session/tab is not enough) — MCP servers load only at startup.'

// Where to get the token, said the same way everywhere.
const TOKEN_HINT =
  'The setup command prints it; it is also in the .uivision_mcp_token file in your home folder, and the AI can read it off the bridge and show it to you.'

const RECONNECT_MIN_MS = 3000
// capped low: after the bridge process restarts (new Claude Code session),
// the panel should be back within seconds — a 60s cap read as "it hangs"
const RECONNECT_MAX_MS = 15000

type BridgeToolCall = { type: 'tool_call'; id: string; tool: string; args: any }

class McpBridgeClient {
  private ws: WebSocket | null = null
  private tools: MacroAgentTools | null = null
  private reconnectMs = RECONNECT_MIN_MS
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private connectionKey = '' // "enabled|port|token" the current socket was opened with
  private currentCallId: string | null = null
  private cancelledIds = new Set<string>()
  private wasConnected = false
  // the macro id THIS session last put into the editor (open/create/set) —
  // run_macro and set_macro check it so an agent call cannot silently land on
  // a macro the USER opened in the panel meanwhile (that race once re-ran a
  // user's download macro)
  private lastTouchedMacroId: string | null = null
  private bannerClearTimer: ReturnType<typeof setTimeout> | null = null
  // the reconnect loop retries a bad token every few seconds — complain once
  // per config change, not once per retry
  private tokenErrorShown = false
  // "replaced by new connection" fires every few seconds while TWO browsers
  // fight over the bridge — warn loudly, but at most once a minute
  private replacedWarnAt = 0
  // one-shot callback for the Settings > AI "Test" button: the next
  // hello_ok/close settles it with a human-readable verdict
  private testWaiter: ((r: { ok: boolean; text: string }) => void) | null = null

  // one log line per state change in the Logs tab — noisy retries stay silent
  private log = (text: string, type: 'info' | 'error' = 'info') => {
    store.dispatch(act.addLog(type, `[Claude bridge] ${text}`, { noStack: true }) as any)
  }

  private getConfig = () => {
    const config = store.getState().config as any
    return {
      enabled: !!config.mcpBridgeEnabled,
      port: parseInt(config.mcpBridgePort, 10) || MCP_BRIDGE.DEFAULT_PORT,
      token: (config.mcpBridgeToken || '').trim()
    }
  }

  // called on every store change — (re)connects or disconnects to match config
  sync = () => {
    const { enabled, port, token } = this.getConfig()
    const key = `${enabled}|${port}|${token}`
    if (key === this.connectionKey) return
    this.connectionKey = key
    this.tokenErrorShown = false

    this.teardown()
    if (enabled) this.connect()
  }

  private teardown = () => {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      const ws = this.ws
      this.ws = null // onclose sees null -> no reconnect
      try { ws.close() } catch (e) { /* already closed */ }
    }
    this.reconnectMs = RECONNECT_MIN_MS
  }

  private scheduleReconnect = () => {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (this.getConfig().enabled) this.connect()
    }, this.reconnectMs)
    this.reconnectMs = Math.min(this.reconnectMs * 2, RECONNECT_MAX_MS)
  }

  private connect = () => {
    const { port, token } = this.getConfig()
    let ws: WebSocket
    try {
      ws = new WebSocket(`ws://127.0.0.1:${port}/`)
    } catch (e) {
      this.scheduleReconnect()
      return
    }
    this.ws = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'hello',
        token,
        client: 'uivision-extension',
        version: (chrome.runtime.getManifest && chrome.runtime.getManifest().version) || ''
      }))
    }

    ws.onmessage = (event) => {
      let msg: any
      try {
        msg = JSON.parse(String(event.data))
      } catch (e) {
        return
      }
      if (msg.type === 'hello_ok') {
        this.reconnectMs = RECONNECT_MIN_MS
        this.wasConnected = true
        if (this.testWaiter) this.testWaiter({ ok: true, text: `Connected to the MCP bridge on port ${port}.` })
        this.log(`Connected to the MCP bridge (port ${port}) — Claude Code can now control Ui.Vision`)
        // the log line lives in the Data tab where nobody is looking right
        // after entering the token in Settings — confirm where the user is
        message.success('Connected to the Claude Code MCP bridge', 3)
      } else if (msg.type === 'tool_call') {
        this.handleToolCall(msg as BridgeToolCall)
      } else if (msg.type === 'cancel' && msg.id) {
        this.cancelledIds.add(msg.id)
      }
    }

    ws.onclose = (event) => {
      if (this.ws !== ws) return // closed by teardown
      this.ws = null
      if (this.testWaiter) {
        // the Test button is waiting on this attempt — turn the close code
        // into a verdict (the reconnect loop below still runs as usual)
        if (event && event.code === 4003) {
          this.testWaiter({ ok: false, text: `The bridge on port ${port} rejected the token. ${TOKEN_HINT}` })
        } else if (event && event.code === 4002) {
          this.testWaiter({ ok: false, text: 'Reached the bridge, but another browser immediately took the connection — disable the MCP bridge in that browser.' })
        } else {
          this.testWaiter({ ok: false, text: `Could not reach the bridge on 127.0.0.1:${port}. ${NOT_REACHABLE_HINT}` })
        }
      }
      if (event && event.code === 4002) {
        // the bridge holds ONE extension connection ("newest wins") — this
        // close means another browser with the same token just took it.
        // Without a visible warning the two sides silently steal it back
        // and forth every few seconds and tool calls land in whichever
        // browser happens to hold the socket.
        this.wasConnected = false
        const now = Date.now()
        if (now - this.replacedWarnAt > 60000) {
          this.replacedWarnAt = now
          this.log('Another browser took the MCP bridge connection — enable the bridge in only ONE browser (Settings > AI).', 'error')
          message.warning('MCP bridge: another browser took the connection — disable the bridge there or here', 6)
        }
        // rejoin on the slow cadence: stealing the socket right back would
        // only continue the ping-pong
        this.reconnectMs = RECONNECT_MAX_MS
      } else if (this.wasConnected) {
        this.wasConnected = false
        this.log('Disconnected from the MCP bridge — retrying in the background')
      } else if (event && event.code === 4003 && !this.tokenErrorShown) {
        // the server rejects a bad token BEFORE hello_ok, so without this the
        // failure is completely silent and the client just retries forever
        this.tokenErrorShown = true
        this.log(`The MCP bridge rejected the connection: wrong or missing token. ${TOKEN_HINT}`, 'error')
        message.error('MCP bridge: wrong token — see Settings > AI', 5)
      }
      this.scheduleReconnect()
    }

    ws.onerror = () => { /* onclose follows and handles the retry */ }
  }

  // Settings > AI "Test" button: answer NOW instead of leaving the user to
  // guess whether the background reconnect loop is getting anywhere. Already
  // connected reports success immediately; otherwise one fresh connection
  // attempt is forced (the backoff may be sitting out up to 15s) and its
  // hello_ok / close code becomes the verdict.
  test = (): Promise<{ ok: boolean; text: string }> => {
    const { enabled, port, token } = this.getConfig()
    if (!enabled) {
      return Promise.resolve({ ok: false, text: 'The MCP bridge is switched off — enable it first.' })
    }
    if (!token) {
      return Promise.resolve({ ok: false, text: `Enter the bridge token first. ${TOKEN_HINT}` })
    }
    if (this.wasConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve({ ok: true, text: `Connected to the MCP bridge on port ${port}.` })
    }
    return new Promise((resolve) => {
      let settled = false
      const finish = (r: { ok: boolean; text: string }) => {
        if (settled) return
        settled = true
        if (this.testWaiter === finish) this.testWaiter = null
        resolve(r)
      }
      this.testWaiter = finish
      // nothing at all answered — neither hello_ok nor a close event
      setTimeout(() => finish({ ok: false, text: `No answer from 127.0.0.1:${port} within 5 seconds. ${NOT_REACHABLE_HINT}` }), 5000)
      this.teardown()
      this.connect()
    })
  }

  private getTools = (): MacroAgentTools => {
    if (!this.tools) {
      this.tools = new MacroAgentTools({
        logMessage: (message) => this.log(message),
        // the bridge's cancel message (Claude Code hit Esc) stops a running
        // script; the player run is stopped via the same flag in tools.ts
        shouldStop: () => this.currentCallId != null && this.cancelledIds.has(this.currentCallId),
        captureScreenShotFunction: async () => {
          const vars = getVarsInstance()
          const isDesktop = (store.getState().config as any).cvScope === 'desktop'
          const shot = await captureScreenShot({ vars, isDesktop })
          if (!shot) throw new Error('screenshot capture failed')
          return shot
        }
      })
    }
    return this.tools
  }

  // --- "under MCP control" banner ------------------------------------------
  // ui.mcpControl drives a banner in the side panel: the user must be able to
  // SEE that an external agent is driving the extension, because they may be
  // working in the same panel. Set on every call; cleared a moment after the
  // last call ends, so back-to-back calls read as one continuous session
  // instead of a flickering banner.
  private showBanner = (tool: string) => {
    if (this.bannerClearTimer) {
      clearTimeout(this.bannerClearTimer)
      this.bannerClearTimer = null
    }
    store.dispatch(act.updateUI({ mcpControl: { tool } }) as any)
  }

  private scheduleBannerClear = () => {
    if (this.bannerClearTimer) clearTimeout(this.bannerClearTimer)
    this.bannerClearTimer = setTimeout(() => {
      this.bannerClearTimer = null
      store.dispatch(act.updateUI({ mcpControl: null }) as any)
    }, 2500)
  }

  // id formats drift for the same file (tree fullPath vs stored id) — compare
  // like actions/removeTestCase does
  private normId = (p: any): string => String(p || '').toLowerCase().replace(/\\/g, '/').replace(/\.json$/i, '')

  private currentEditingId = (): string | null => {
    const src = (store.getState() as any).editor.editing.meta && (store.getState() as any).editor.editing.meta.src
    return (src && src.id) || null
  }

  private rememberEditorMacro = () => {
    this.lastTouchedMacroId = this.currentEditingId()
  }

  // the guard for editor-state tools: refuse to act if the editor no longer
  // shows the macro this session last opened/created/edited — the user (or
  // another session) switched it in between
  private editorRaceError = (tool: string): { text: string; isError: true } | null => {
    if (!this.lastTouchedMacroId) return null // nothing tracked yet — "act on what is open" flow
    const now = this.currentEditingId()
    if (this.normId(now) === this.normId(this.lastTouchedMacroId)) return null
    return {
      text: `Error: the editor no longer shows the macro this session last worked on (it now shows "${now || 'an unsaved macro'}") — ` +
        'someone is using the panel, or another session switched macros. Call open_macro with the macro you mean, then retry ' +
        `${tool}. Never assume the editor still holds what you left there.`,
      isError: true
    }
  }

  private handleToolCall = async (call: BridgeToolCall) => {
    const reply = (result: { text: string; base64Image?: string; isError?: boolean }) => {
      this.cancelledIds.delete(call.id)
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'tool_result', id: call.id, ...result }))
      }
    }

    // the tools are stateful (editor, lastShot) — one call at a time
    if (this.currentCallId) {
      reply({ text: 'Error: another tool call is still running. Wait for it to finish.', isError: true })
      return
    }

    this.currentCallId = call.id
    const why = call.args && call.args.why
    this.log(`Claude: ${call.tool}${why ? ` — ${why}` : ''}`)
    this.showBanner(call.tool)

    try {
      // these need a web page to act on; a fresh browser (or one sitting on a
      // chrome:// page) has none — open one instead of failing the call
      if (call.tool === 'run_macro' || call.tool === 'screenshot' || call.tool === 'get_page') {
        await this.ensureWebTab()
      }

      // editor-state tools must not race a user working in the panel
      if (call.tool === 'run_macro' || call.tool === 'set_macro') {
        const race = this.editorRaceError(call.tool)
        if (race) {
          reply(race)
          return
        }
      }

      switch (call.tool) {
        case 'list_macros':
          reply(this.listMacros())
          break
        case 'open_macro':
          reply(await this.openMacro(call.args && call.args.name))
          break
        case 'delete_macro':
          reply(await this.deleteMacro(call.args && call.args.name))
          break
        case 'get_authoring_guide':
          // the same tuned instructions the in-panel AI chat works with —
          // command table, uiv.* JS API, locator and OCR rules
          reply({ text: DEFAULT_MACRO_AGENT_SYSTEM_PROMPT })
          break
        default: {
          const result = await this.getTools().execute(call.tool, call.args || {})
          // create_macro / set_macro leave their (possibly newly created)
          // macro open in the editor — that is now this session's macro
          if (call.tool === 'create_macro' || call.tool === 'set_macro') {
            this.rememberEditorMacro()
          }
          reply(result)
        }
      }
    } catch (e: any) {
      reply({ text: `Tool ${call.tool} failed: ${(e && e.message) || e}`, isError: true })
    } finally {
      this.currentCallId = null
      this.scheduleBannerClear()
    }
  }

  // run_macro / screenshot / get_page target the active web tab; when none
  // exists (fresh browser, chrome:// page focused) open ui.vision instead of
  // failing — the macro's own open command navigates away as needed
  private ensureWebTab = async (): Promise<void> => {
    if (await getActiveWebTab()) return
    this.log('No web tab open — opening https://ui.vision as the play tab')
    const created: any = await Ext.tabs.create({ url: 'https://ui.vision', active: true })
    const deadline = Date.now() + 20000
    while (Date.now() < deadline) {
      const t: any = await Ext.tabs.get(created.id).catch(() => null)
      if (t && t.status === 'complete') return
      await delayMs(250)
    }
    // page still loading after 20s — let the tool proceed against the tab anyway
  }

  // the authoritative macro list is the folder structure (file nodes) — NOT
  // editor.testCases, which is never populated in this build (SET_TEST_CASES
  // has no dispatchers); reading it made list_macros report an empty tree
  private getMacroNodes = (): any[] => getMacroFileNodeList(store.getState() as any) || []

  // display/match name: tree path without leading slash and .json extension
  private nodeDisplayName = (node: any): string =>
    String(node.relativePath || node.name || '').replace(/^\//, '').replace(/\.json$/i, '')

  private listMacros = () => {
    const nodes = this.getMacroNodes()
    if (!nodes.length) {
      return { text: 'No macros stored yet. Use create_macro to build one.' }
    }
    const names = nodes.map(this.nodeDisplayName).sort()
    return { text: `${names.length} macros (folder paths relative to the macro root):\n${names.join('\n')}` }
  }

  // find a macro node by tree path or bare file name; retries once after a
  // storage re-list, because the folder structure can be mid-rebuild
  private resolveMacroNode = async (name: string): Promise<any | null> => {
    const wanted = name.toLowerCase().replace(/^\//, '').replace(/\.json$/i, '')
    const findNode = () => this.getMacroNodes().find((n: any) => {
      const rel = this.nodeDisplayName(n).toLowerCase()
      const base = String(n.name || '').replace(/\.json$/i, '').toLowerCase()
      return rel === wanted || base === wanted
    })
    let node = findNode()
    if (!node) {
      // the folder structure rebuilds on storage-change events and can be
      // mid-rebuild (observed: a whole subfolder transiently missing right
      // after a run or a demo restore) — re-list from storage and retry once
      try {
        const entryNodes = await getStorageManager().getMacroStorage().listR()
        store.dispatch(simpleActions.setMacroFolderStructure(entryNodes as any) as any)
        await delayMs(150)
        node = findNode()
      } catch (e) { /* stale structure stays — the caller reports it */ }
    }
    return node || null
  }

  private noSuchMacroError = (name: string): { text: string; isError: true } => {
    const wanted = name.toLowerCase().replace(/^\//, '').replace(/\.json$/i, '')
    const similar = this.getMacroNodes()
      .map(this.nodeDisplayName)
      .filter((n: string) => n.toLowerCase().includes(wanted))
      .slice(0, 10)
    return {
      text: `Error: no macro named "${name}".${similar.length ? ` Similar names: ${similar.join(', ')}` : ' Use list_macros to see what exists.'}`,
      isError: true
    }
  }

  private openMacro = async (name: string): Promise<{ text: string; isError?: boolean }> => {
    if (!name || typeof name !== 'string') {
      return { text: 'Error: open_macro requires a macro name (see list_macros).', isError: true }
    }

    // try the (possibly stale) tree first; on a verification failure below,
    // re-list from storage and try once more — external file changes (a
    // rename on disk) leave tree nodes pointing at paths that no longer exist
    for (let attempt = 0; attempt < 2; attempt++) {
      const node = attempt === 0
        ? await this.resolveMacroNode(name)
        : await (async () => {
          try {
            const entryNodes = await getStorageManager().getMacroStorage().listR()
            store.dispatch(simpleActions.setMacroFolderStructure(entryNodes as any) as any)
            await delayMs(150)
          } catch (e) { /* stale structure stays; resolve may still work */ }
          return this.resolveMacroNode(name)
        })()
      if (!node) return this.noSuchMacroError(name)

      store.dispatch(act.editTestCase(node.fullPath) as any)
      await delayMs(300) // let the editor state settle before reading it back

      // VERIFY the editor actually switched — editTestCase fails silently
      // when the node's file vanished (renamed/deleted on disk), and
      // reporting "Opened X" while the editor still shows Y once made a
      // session act on the wrong macro
      const editing = (store.getState() as any).editor.editing
      const editingName = (editing.meta && editing.meta.src && editing.meta.src.name) || ''
      if (this.normId(editingName) === this.normId(String(node.name || ''))) {
        this.rememberEditorMacro()
        const macro = await this.getTools().execute('get_macro', {})
        return { text: `Opened "${this.nodeDisplayName(node)}" in the editor.\n${macro.text}` }
      }
    }

    return {
      text: `Error: "${name}" is listed but could not be opened — its file may have been renamed or deleted outside Ui.Vision. The macro list was refreshed; call list_macros and retry.`,
      isError: true
    }
  }

  // cleanup for the scratch macros a session creates. Restricted to the
  // "AI Generated" folder on purpose: an agent may delete what agents create;
  // everything else is the user's and is deleted in the panel, by the user.
  private deleteMacro = async (name: string): Promise<{ text: string; isError?: boolean }> => {
    if (!name || typeof name !== 'string') {
      return { text: 'Error: delete_macro requires a macro name (see list_macros).', isError: true }
    }
    const node = await this.resolveMacroNode(name)
    if (!node) return this.noSuchMacroError(name)
    const displayName = this.nodeDisplayName(node)
    // both separators: browser-mode paths use '/', win32 file mode '\'
    if (!/^AI Generated[\\/]/i.test(displayName)) {
      return {
        text: `Error: "${displayName}" is not in the "AI Generated" folder — delete_macro only removes agent-created macros there. The user deletes everything else in the panel.`,
        isError: true
      }
    }
    await store.dispatch(act.removeTestCase(node.fullPath) as any)
    if (this.normId(this.lastTouchedMacroId) === this.normId(node.fullPath)) {
      this.lastTouchedMacroId = null
    }
    this.log(`Deleted "${displayName}"`)
    return { text: `Deleted "${displayName}" from the "AI Generated" folder.` }
  }
}

let instance: McpBridgeClient | null = null

// Idempotent — called from the side panel's componentDidMount. Subscribes to
// the store so enabling/disabling or editing port/token in Settings takes
// effect immediately, without a panel reload.
export function initMcpBridge (): void {
  if (instance) return
  instance = new McpBridgeClient()
  store.subscribe(instance.sync)
  instance.sync()
}

// The Settings > AI "Test" button. Settings always open in the IDE window,
// where the bridge client does NOT run (it lives in the side panel) — so
// when there is no client here, run a one-shot PROBE instead: same hello,
// plus probe:true, which the bridge answers and closes WITHOUT touching the
// side panel's real connection. (A pre-probe bridge treats it as a normal
// hello — the test still answers correctly, but briefly takes the panel's
// connection, which rejoins on its own within ~15s.)
export function testMcpBridge (): Promise<{ ok: boolean; text: string }> {
  if (instance) return instance.test()

  const config = store.getState().config as any
  const port = parseInt(config.mcpBridgePort, 10) || MCP_BRIDGE.DEFAULT_PORT
  const token = (config.mcpBridgeToken || '').trim()
  if (!config.mcpBridgeEnabled) {
    return Promise.resolve({ ok: false, text: 'The MCP bridge is switched off — enable it first.' })
  }
  if (!token) {
    return Promise.resolve({ ok: false, text: `Enter the bridge token first. ${TOKEN_HINT}` })
  }

  return new Promise((resolve) => {
    let ws: WebSocket
    let settled = false
    const finish = (r: { ok: boolean; text: string }) => {
      if (settled) return
      settled = true
      try { if (ws) ws.close() } catch (e) { /* already closed */ }
      resolve(r)
    }
    try {
      ws = new WebSocket(`ws://127.0.0.1:${port}/`)
    } catch (e) {
      return finish({ ok: false, text: `Could not open a socket to 127.0.0.1:${port}.` })
    }
    setTimeout(() => finish({ ok: false, text: `No answer from 127.0.0.1:${port} within 5 seconds. ${NOT_REACHABLE_HINT}` }), 5000)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'hello', token, probe: true, client: 'uivision-settings-test' }))
    }
    ws.onmessage = (event) => {
      let msg: any
      try { msg = JSON.parse(String(event.data)) } catch (e) { return }
      if (msg.type === 'hello_ok') {
        finish(msg.extensionConnected
          ? { ok: true, text: `Bridge on port ${port} reachable, token correct — side panel connected. Everything works.` }
          : { ok: true, text: `Bridge on port ${port} reachable and the token is correct. Now open the side panel — the bridge client runs there and connects within seconds.` })
      }
    }
    ws.onclose = (event) => {
      if (event && event.code === 4003) {
        finish({ ok: false, text: `The bridge on port ${port} rejected the token. ${TOKEN_HINT}` })
      } else {
        finish({ ok: false, text: `Could not reach the bridge on 127.0.0.1:${port}. ${NOT_REACHABLE_HINT}` })
      }
    }
    ws.onerror = () => { /* onclose follows and reports */ }
  })
}
