const mk = (list: string[]): Record<string, string> =>
  list.reduce(
    (prev, key) => {
      prev[key] = key
      return prev
    },
    {} as Record<string, string>
  )

export const APP_STATUS = mk(['NORMAL', 'INSPECTOR', 'RECORDER', 'PLAYER'])

export const INSPECTOR_STATUS = mk(['PENDING', 'INSPECTING', 'STOPPED'])

export const RECORDER_STATUS = mk(['PENDING', 'RECORDING', 'STOPPED'])

export const PLAYER_STATUS = mk(['PLAYING', 'PAUSED', 'STOPPED'])

export const PLAYER_MODE = mk(['TEST_CASE', 'TEST_SUITE'])

export const CONTENT_SCRIPT_STATUS = mk(['NORMAL', 'RECORDING', 'INSPECTING', 'PLAYING'])

export const TEST_CASE_STATUS = mk(['NORMAL', 'SUCCESS', 'ERROR', 'ERROR_IN_SUB'])

// Every URL/bookmark invocation parameter the panel understands (its
// guardCommandLineArgs warns about anything else). The content script uses
// the same list to FILTER the page's own query string before a bookmark run
// merges it in — an arbitrary page's ?production=true must not surface as an
// "Unknown command line parameter" warning.
export const INVOKE_URL_PARAMS = [
  'direct', 'closeBrowser', 'closeKantu', 'closeRPA', 'continueInLastUsedTab', 'nodisplay',
  'folder', 'savelog', 'storage', 'macro', 'testsuite', 'storageMode', 'loadmacrotree',
  'cmd_var1', 'cmd_var2', 'cmd_var3', 'cmd_var4', 'cmd_var5', 'cmd_var6',
  'cmd_var7', 'cmd_var8', 'cmd_var9', 'cmd_var10'
]

export const LAST_SCREENSHOT_FILE_NAME = '__lastscreenshot'

export const LAST_DESKTOP_SCREENSHOT_FILE_NAME = '__last_desktop_screenshot'

export const UNTITLED_ID = '__untitled__'

// Note: in Ubuntu, you have to take some delay after activating some tab, otherwise there are chances
// Chrome still think the panel is the window you want to take screenshot, and weird enough in Ubuntu,
// You can't take screenshot of tabs with 'chrome-extension://' schema, even if it's your own extension
export const SCREENSHOT_DELAY = /Linux/i.test(self.navigator.userAgent) ? 200 : 0

export const CS_IPC_TIMEOUT = 4000

export const STATE_STORAGE_KEY = 'background_state'

// MCP bridge (Claude Code integration) — the side panel connects out to a
// local bridge process (mcp/uivision-mcp-bridge.js) that exposes the macro
// agent tools to MCP clients. Keep the default port in sync with the bridge.
export const MCP_BRIDGE = {
  DEFAULT_PORT: 50888
} as const

export const ANTHROPIC = {
  // Default model for AI commands/chat when provider is Anthropic. Users can
  // pick claude-sonnet-5 (faster/cheaper) in Settings > AI (config.anthropicModel).
  COMPUTER_USE_MODEL: 'claude-opus-4-8',
  COMPUTER_USE_TOOL_VERSION: 'computer_20251124',
  COMPUTER_USE_BETA_FLAG: 'computer-use-2025-11-24'
} as const

// OpenAI-compatible AI providers (config.aiProvider: 'anthropic' | 'openrouter' | 'local' | 'uivision')
export const OPENAI_COMPAT = {
  OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
  DEFAULT_OPENROUTER_MODEL: 'qwen/qwen3.7-plus',
  DEFAULT_LOCAL_BASE_URL: 'http://localhost:11434/v1',
  // Ui.Vision free AI tier proxy (for local testing: 'http://localhost:5001/v1')
  UIVISION_BASE_URL: 'https://ai.ui.vision/v1',
  // The proxy forces the real model server-side and ignores this value; it
  // only needs to be non-empty. Do not surface it in the UI.
  UIVISION_PLACEHOLDER_MODEL: 'uivision-free'
} as const
