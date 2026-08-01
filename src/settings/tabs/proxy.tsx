// Settings > Advanced > Proxy — extracted from the old settings modal in
// header.js. The ON/OFF radio talks to the background (PANEL_SET_PROXY);
// this page keeps its own view of the switch because redux `state.proxy`
// only lives in pages the background pushes proxy events to.
import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators, Dispatch } from 'redux'
import { Checkbox, Form, Input, message, Radio } from 'antd'

import * as actions from '@/actions'
import { Actions as simpleActions } from '@/actions/simple_actions'
import ipc from '@/common/ipc/ipc_cs'
import { parseProxyUrl } from '@/services/proxy'
import { State } from '@/reducers/state'

const displayConfig = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 }
}

interface ProxyTabProps {
  config: { [key: string]: any }
  proxy: any
  updateConfig: (config: { [key: string]: any }) => void
}

interface ProxyTabState {
  // null = unknown (no proxy event reached this page yet) — fall back to
  // redux state.proxy, which is null unless a proxy was set this session
  proxyOn: boolean | null
}

class ProxyTab extends React.Component<ProxyTabProps, ProxyTabState> {
  state: ProxyTabState = {
    proxyOn: null
  }

  onConfigChange = (key: string, val: any) => {
    this.props.updateConfig({ [key]: val })
  }

  onChangeProxyStatus = (value: string) => {
    switch (value) {
      case 'off':
        return ipc.ask('PANEL_SET_PROXY', { proxy: null })
          .then(() => this.setState({ proxyOn: false }))

      case 'on': {
        let proxy

        try {
          proxy = parseProxyUrl(
            this.props.config.defaultProxy,
            this.props.config.defaultProxyAuth
          )
        } catch (e: any) {
          return message.error(e.message)
        }

        return ipc.ask('PANEL_SET_PROXY', { proxy })
          .then(() => this.setState({ proxyOn: true }))
      }
    }
  }

  render () {
    const { config } = this.props
    const onConfigChange = this.onConfigChange
    const proxyOn = this.state.proxyOn !== null ? this.state.proxyOn : !!this.props.proxy

    return (
      <Form>
        <Form.Item label="Default Proxy (IP:Port)" {...displayConfig}>
          <Input
            type="text"
            style={{ width: '300px' }}
            value={config.defaultProxy}
            onChange={(e) => onConfigChange('defaultProxy', e.target.value)}
            placeholder="eg. http://0.0.0.0:1234"
          />
        </Form.Item>
        <Form.Item label="User name, Password" {...displayConfig}>
          <Input
            type="text"
            style={{ width: '300px' }}
            value={config.defaultProxyAuth}
            onChange={(e) => onConfigChange('defaultProxyAuth', e.target.value)}
            placeholder="eg. admin, mypassword"
          />
        </Form.Item>
        <Form.Item label="Status" {...displayConfig}>
          <Radio.Group value={proxyOn ? 'on' : 'off'}>
            <Radio value="on" onClick={() => this.onChangeProxyStatus('on')}>Proxy ON</Radio>
            <Radio value="off" onClick={() => this.onChangeProxyStatus('off')}>Proxy OFF</Radio>
          </Radio.Group>

          <Checkbox
            onChange={(e: any) =>
              onConfigChange('turnOffProxyAfterReplay', e.target.checked)
            }
            checked={config.turnOffProxyAfterReplay}
            style={{ marginTop: '10px' }}
          >
            Turn off at end of replay (Proxy controlled by{' '}
            <a href="https://go.ui.vision/?cmd=setproxy" target="_blank">
              setProxy command
            </a>
            )
          </Checkbox>
        </Form.Item>
      </Form>
    )
  }
}

export default connect(
  (state: State) => ({
    config: (state as any).config,
    proxy: (state as any).proxy
  }),
  (dispatch: Dispatch) => bindActionCreators({ ...actions, ...simpleActions } as any, dispatch)
)(ProxyTab as any)
