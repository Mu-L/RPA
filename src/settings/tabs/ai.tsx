import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators, Dispatch } from 'redux'
import { AutoComplete, Button, Input, Modal, Select, Switch } from 'antd'
import AnthropicService, { NO_ANTHROPIC_API_KEY_ERROR } from '@/services/ai/anthropic/anthropic.service'
import { DEFAULT_MACRO_AGENT_SYSTEM_PROMPT } from '@/services/ai/macro_agent/service'
import { Actions as simpleActions } from '@/actions/simple_actions'
import * as actions from '@/actions'
import { State } from '@/reducers/state'
import { message } from 'antd'

// Provider ids stored in config.aiProvider
export type AIProvider = 'anthropic' | 'openrouter' | 'local' | 'uivision'

import { ANTHROPIC, MCP_BRIDGE, OPENAI_COMPAT } from '@/common/constant'
import { getInstallId, mapUIVisionFreeTierError } from '@/services/ai/uivision_free_tier'
import { testMcpBridge } from '@/services/mcp_bridge'
import { normalizeApiKey } from '@/services/ai/computer_use/service'

// One-line Claude Code registration for the MCP bridge (shown with a Copy
// button in the bridge settings). Uses the published npm package so end users
// never need the repo; developers can point at mcp/uivision-mcp-bridge.js
// directly instead (see mcp/README.md).
const MCP_BRIDGE_SETUP_CMD = 'claude mcp add uivision -- npx -y uivision-mcp-bridge'

const OPENROUTER_BASE_URL = OPENAI_COMPAT.OPENROUTER_BASE_URL
const DEFAULT_OPENROUTER_MODEL = OPENAI_COMPAT.DEFAULT_OPENROUTER_MODEL
const DEFAULT_LOCAL_BASE_URL = OPENAI_COMPAT.DEFAULT_LOCAL_BASE_URL
const UIVISION_BASE_URL = OPENAI_COMPAT.UIVISION_BASE_URL

// Curated picks (vision-capable models with good UI grounding — same family
// of recommendations as Midscene/Nanobrowser). Users can type any model id.
const OPENROUTER_MODEL_OPTIONS = [
  { value: 'anthropic/claude-sonnet-5', label: 'anthropic/claude-sonnet-5 — recommended: best results' },
  { value: 'qwen/qwen3.7-plus', label: 'qwen/qwen3.7-plus — low cost, slower on visual tasks' }
]

const ANTHROPIC_MODEL_OPTIONS = [
  { value: 'claude-opus-4-8', label: 'claude-opus-4-8 — recommended for computer use' },
  { value: 'claude-sonnet-5', label: 'claude-sonnet-5 — faster and cheaper' }
]
interface AiTabProps {
  config: { [key: string]: any }
  updateConfig: (config: { [key: string]: any }) => void
}

interface AiTabAppState {
  apiKeyInput: string
  prompt: string
  promptResponse: string
  error: string
  testing: boolean
  // system prompt editor is collapsed by default to keep the tab compact
  showSystemPrompt: boolean
  // MCP bridge "Test" button: a connection attempt is in flight
  testingBridge: boolean
}

class AITab extends React.Component<AiTabProps, AiTabAppState> {
  constructor(props: any) {
    super(props)
    this.onClickTestPrompt = this.onClickTestPrompt.bind(this)
  }

  state: AiTabAppState = {
    apiKeyInput: '',
    prompt: 'Explain a random uiv. api command',
    promptResponse: '',
    error: '',
    testing: false,
    showSystemPrompt: false,
    testingBridge: false
  }

  testBridge = () => {
    this.setState({ testingBridge: true })
    testMcpBridge()
      .then((r) => (r.ok ? message.success(r.text, 5) : message.error(r.text, 6)))
      .finally(() => this.setState({ testingBridge: false }))
  }

  getProvider(): AIProvider {
    // free tier as default so new installs have working AI out of the box;
    // keep in sync with getAIProviderConfig() in computer_use/service.ts
    return this.props.config.aiProvider || 'uivision'
  }

  // Which config key stores the API key of the currently selected provider
  getApiKeyConfigName(): string | null {
    switch (this.getProvider()) {
      case 'anthropic':
        return 'anthropicAPIKey'
      case 'openrouter':
        return 'openRouterAPIKey'
      case 'local':
        return null // local endpoints usually need no key
      case 'uivision':
        return null // free tier authenticates with a generated install ID
    }
  }

  saveApiKey = () => {
    const configName = this.getApiKeyConfigName()
    if (!configName) return

    const doSave = () => {
      // strip paste artifacts (whitespace, auto-capitalized "Sk-") that make
      // providers reject the key with confusing 401s
      this.props.updateConfig({ [configName]: normalizeApiKey(this.state.apiKeyInput) })
      this.setState({ apiKeyInput: '' })
      message.success('API key saved')
    }

    if (this.props.config[configName]) {
      Modal.confirm({
        title: 'Confirm',
        content: 'Do you want to overwrite the existing API key?',
        okText: 'Yes',
        cancelText: 'No',
        onOk: doSave
      })
    } else {
      doSave()
    }
  }

  // Test the prompt against the ACTIVE provider, so a misconfigured
  // key/endpoint/model shows up here and not first in the AI chat
  async onClickTestPrompt() {
    const provider = this.getProvider()
    this.setState({ testing: true, promptResponse: '' })

    try {
      if (provider === 'anthropic') {
        const anthropicAPIKey = normalizeApiKey(this.props.config.anthropicAPIKey || '')
        if (!anthropicAPIKey) {
          message.error(NO_ANTHROPIC_API_KEY_ERROR)
          return
        }

        const anthropicService = new AnthropicService(anthropicAPIKey)
        const response = await anthropicService.getPromptResponse(this.state.prompt)
        this.setState({ promptResponse: response, error: '' })
        return
      }

      // OpenRouter, local endpoints and the Ui.Vision free tier all speak
      // the OpenAI chat format
      const isLocal = provider === 'local'
      const isUIVision = provider === 'uivision'
      const baseURL = isUIVision
        ? UIVISION_BASE_URL
        : isLocal
          ? (this.props.config.localAIBaseURL || DEFAULT_LOCAL_BASE_URL)
          : OPENROUTER_BASE_URL
      const model = isUIVision
        ? OPENAI_COMPAT.UIVISION_PLACEHOLDER_MODEL // server forces the real model
        : isLocal
          ? (this.props.config.localAIModel || '')
          : (this.props.config.openRouterModel || DEFAULT_OPENROUTER_MODEL)
      const apiKey = isUIVision
        ? await getInstallId()
        : isLocal ? '' : normalizeApiKey(this.props.config.openRouterAPIKey || '')

      if (provider === 'openrouter' && !apiKey) {
        message.error('Please enter and save your OpenRouter API key first.')
        return
      }
      if (isLocal && !model) {
        message.error('Please enter the local model name (e.g. qwen3-vl).')
        return
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
      if (!isLocal) headers['X-Title'] = 'Ui.Vision RPA'

      const res = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: this.state.prompt }],
          max_tokens: 300
        })
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`)
      }

      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content
      if (!text) throw new Error(`Empty response: ${JSON.stringify(data).slice(0, 300)}`)

      this.setState({ promptResponse: text, error: '' })
    } catch (error: any) {
      console.error('Error getting response:', error)
      const freeTierMessage = mapUIVisionFreeTierError(error?.message || '')
      message.error(freeTierMessage || error.message)
    } finally {
      this.setState({ testing: false })
    }
  }

  render() {
    const onConfigChange = (key: string, val: any) => {
      this.props.updateConfig({ [key]: val })
    }

    const provider = this.getProvider()
    const apiKeyConfigName = this.getApiKeyConfigName()
    const hasSavedKey = !!(apiKeyConfigName && this.props.config[apiKeyConfigName])
    const isPromptOverridden = ((this.props.config.aiMacroAgentSystemPrompt || '') as string).trim().length > 0

    return (
      <div className="ai-tab">
        <div className="row" style={{ marginBottom: '20px' }}>
          The AI commands feature is currently experimental/beta. The built-in Ui.Vision AI works without an API key; for the
          other providers, enter their API key{' '}
          <a href="https://go.ui.vision/?help=ai" target="_blank">
            (more information)
          </a>
          :
        </div>

        <div className="ai-settings-item">
          <span className="label-text">AI Provider:</span>
          <Select
            style={{ minWidth: 320 }}
            value={provider}
            onChange={(val: AIProvider) => {
              onConfigChange('aiProvider', val)
              this.setState({ apiKeyInput: '', promptResponse: '' })
            }}
            options={[
              { value: 'uivision', label: 'Ui.Vision AI (Free Beta) — no API key needed' },
              { value: 'anthropic', label: 'Anthropic Claude — best overall results' },
              { value: 'openrouter', label: 'OpenRouter — many models, one key' },
              { value: 'local', label: 'Local — OpenAI-compatible (e.g. Ollama), no key' }
            ]}
          />
        </div>

        {apiKeyConfigName && (
          <div className="ai-settings-item">
            <span className="label-text">API Key{hasSavedKey ? ' (saved)' : ''}:</span>
            <Input
              type="password"
              placeholder={hasSavedKey ? '••••••••  (enter a new key to replace it)' : 'Enter API key'}
              value={this.state.apiKeyInput}
              onChange={(e) => {
                this.setState({ apiKeyInput: e.target.value })
              }}
            />
            <Button type="primary" disabled={!this.state.apiKeyInput} onClick={this.saveApiKey}>
              Save
            </Button>
          </div>
        )}

        {provider === 'anthropic' && (
          <div className="ai-settings-item">
            <span className="label-text">Model:</span>
            <AutoComplete
              style={{ minWidth: 420 }}
              value={this.props.config.anthropicModel || ANTHROPIC.COMPUTER_USE_MODEL}
              options={ANTHROPIC_MODEL_OPTIONS}
              onChange={(val: string) => onConfigChange('anthropicModel', val)}
              placeholder="Pick a model or type any Anthropic model id"
            />
          </div>
        )}

        {provider === 'openrouter' && (
          <div className="ai-settings-item">
            <span className="label-text">Model:</span>
            <AutoComplete
              style={{ minWidth: 420 }}
              value={this.props.config.openRouterModel || DEFAULT_OPENROUTER_MODEL}
              options={OPENROUTER_MODEL_OPTIONS}
              onChange={(val: string) => onConfigChange('openRouterModel', val)}
              placeholder="Pick a model or type any OpenRouter model id"
            />
          </div>
        )}

        {provider === 'local' && (
          <>
            <div className="ai-settings-item">
              <span className="label-text">Base URL:</span>
              <Input
                type="text"
                placeholder={DEFAULT_LOCAL_BASE_URL}
                value={this.props.config.localAIBaseURL || ''}
                onChange={(e) => onConfigChange('localAIBaseURL', e.target.value)}
              />
            </div>
            <div className="ai-settings-item">
              <span className="label-text">Model name:</span>
              <Input
                type="text"
                placeholder="e.g. qwen3-vl"
                value={this.props.config.localAIModel || ''}
                onChange={(e) => onConfigChange('localAIModel', e.target.value)}
              />
            </div>
            <div className="row" style={{ marginBottom: '10px', fontSize: '12px' }}>
              For Ollama, allow extension access first: set OLLAMA_ORIGINS=chrome-extension://* before starting Ollama.
            </div>
          </>
        )}

        {provider === 'uivision' && (
          <div className="row" style={{ marginBottom: '10px', fontSize: '12px' }}>
            Free beta: no API key needed, but there is a daily request limit per installation and no uptime guarantee.
            For unlimited and reliable use, select another provider and add your own API key.
          </div>
        )}

        {provider !== 'anthropic' && provider !== 'uivision' && (
          <div className="row" style={{ marginBottom: '10px', fontSize: '12px' }}>
            The AI chat and aiComputerUse use this provider. The models in the list above are tested with Ui.Vision; other
            (vision-capable) models may work but can misplace clicks.
          </div>
        )}

        <div className="ai-settings-item">
          <span className="label-text">Test Prompt:</span>
          <Input
            type="text"
            value={this.state.prompt}
            onChange={(e) => {
              this.setState({ prompt: e.target.value })
            }}
          />
          <Button type="primary" loading={this.state.testing} onClick={this.onClickTestPrompt}>
            Test
          </Button>
        </div>
        {/* answer area only exists once a test ran — keeps the tab compact */}
        {this.state.testing || this.state.promptResponse ? (
          <>
            <div className="row" style={{ marginBottom: '10px' }}>
              AI Answer:
            </div>
            <div className="ai-response">
              <pre>{this.state.promptResponse}</pre>
            </div>
          </>
        ) : null}
        <div className="ai-settings-item">
          <span className="label-text">
            <strong>aiComputerUse:</strong> Max loops before stopping:{' '}
          </span>
          <Input
            type="number"
            min="0"
            style={{ marginLeft: '10px', width: '70px' }}
            value={this.props.config.aiComputerUseMaxLoops}
            onChange={(e) => onConfigChange('aiComputerUseMaxLoops', e.target.value)}
            placeholder=""
          />
        </div>

        <div className="ai-settings-item" style={{ marginTop: '20px' }}>
          <span className="label-text">
            <strong>MCP bridge (Claude Code):</strong>
          </span>
          <Switch
            checked={!!this.props.config.mcpBridgeEnabled}
            onChange={(checked: boolean) => onConfigChange('mcpBridgeEnabled', checked)}
          />
        </div>
        {this.props.config.mcpBridgeEnabled ? (
          <>
            <div className="row" style={{ marginBottom: '10px', fontSize: '12px' }}>
              Lets Claude Code (or any MCP client) build and run macros in this browser. Requires the local bridge
              process from the Ui.Vision <code>mcp/</code> folder (see its README). The side panel connects to it on
              127.0.0.1 and must stay open while Claude works. Paste the token from the bridge&apos;s{' '}
              <code>.uivision_mcp_token</code> file below.
            </div>
            <div className="ai-settings-item">
              <span className="label-text">Bridge port:</span>
              <Input
                type="number"
                style={{ width: '120px' }}
                placeholder={String(MCP_BRIDGE.DEFAULT_PORT)}
                value={this.props.config.mcpBridgePort || ''}
                onChange={(e) => onConfigChange('mcpBridgePort', e.target.value)}
              />
            </div>
            <div className="ai-settings-item">
              <span className="label-text">Bridge token:</span>
              <Input
                type="password"
                placeholder="Contents of the bridge's .uivision_mcp_token file"
                value={this.props.config.mcpBridgeToken || ''}
                onChange={(e) => onConfigChange('mcpBridgeToken', e.target.value)}
              />
              <Button loading={this.state.testingBridge} onClick={this.testBridge}>
                Test
              </Button>
            </div>
            <div className="ai-settings-item">
              <span className="label-text">Claude Code setup:</span>
              <Input readOnly value={MCP_BRIDGE_SETUP_CMD} style={{ fontFamily: 'monospace', fontSize: '12px' }} />
              <Button
                onClick={() => {
                  navigator.clipboard
                    .writeText(MCP_BRIDGE_SETUP_CMD)
                    .then(() => message.success('Command copied — run it in a terminal, then restart Claude Code'))
                    .catch(() => message.error('Could not copy — select the text and copy manually'))
                }}
              >
                Copy
              </Button>
            </div>
            <div className="row" style={{ marginBottom: '10px', fontSize: '12px' }}>
              Run the copied command once in a terminal to register Ui.Vision with Claude Code. Then, in any Claude Code
              chat: &quot;build a Ui.Vision macro that ...&quot;.
            </div>
          </>
        ) : null}

        <div className="ai-system-prompt">
          <div className="row" style={{ marginBottom: '5px' }}>
            <strong>AI Chat system prompt</strong>
            {isPromptOverridden ? <span style={{ marginLeft: '8px', color: '#ad6800' }}>(edited)</span> : null}
            <Button
              size="small"
              style={{ marginLeft: '10px' }}
              onClick={() => this.setState({ showSystemPrompt: !this.state.showSystemPrompt })}
            >
              {this.state.showSystemPrompt ? 'Hide' : 'Show'}
            </Button>
            {this.state.showSystemPrompt ? (
              <Button
                size="small"
                style={{ marginLeft: '10px' }}
                disabled={!isPromptOverridden}
                onClick={() => {
                  // empty override = use the built-in default (and pick up
                  // future improvements of it automatically)
                  onConfigChange('aiMacroAgentSystemPrompt', '')
                  message.success('Restored the default system prompt')
                }}
              >
                Restore default
              </Button>
            ) : null}
          </div>
          {this.state.showSystemPrompt ? (
            <>
              <div className="row" style={{ marginBottom: '5px', fontSize: '12px' }}>
                The instructions the sidebar AI Chat (macro assistant) works with. Edit at your own risk — the tool
                descriptions and working rules are tuned; as long as it is unedited, updates to Ui.Vision may improve it.
              </div>
              <Input.TextArea
                rows={10}
                style={{ fontFamily: 'monospace', fontSize: '11px' }}
                value={
                  isPromptOverridden
                    ? this.props.config.aiMacroAgentSystemPrompt
                    : DEFAULT_MACRO_AGENT_SYSTEM_PROMPT
                }
                onChange={(e) => {
                  onConfigChange('aiMacroAgentSystemPrompt', e.target.value)
                }}
              />
            </>
          ) : null}
        </div>

        <div className="row" style={{ marginBottom: '10px', color: 'red' }}>
          {this.state.error}
        </div>
      </div>
    )
  }
}

export default connect(
  (state: State) => ({
    status: state.status,
    config: state.config
  }),
  (dispatch: Dispatch) => bindActionCreators({ ...actions, ...simpleActions }, dispatch)
)(AITab)
