// Settings > Advanced > Replay — extracted from the old settings modal in
// header.js. The "If error happens in loop" and "Show notifications when
// recording" settings were removed in the move (2026-07 settings cleanup).
import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators, Dispatch } from 'redux'
import { Checkbox, Form, Input, Select } from 'antd'

import * as actions from '@/actions'
import { Actions as simpleActions } from '@/actions/simple_actions'
import { State } from '@/reducers/state'

const displayConfig = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 }
}

interface ReplayTabProps {
  config: { [key: string]: any }
  updateConfig: (config: { [key: string]: any }) => void
}

class ReplayTab extends React.Component<ReplayTabProps> {
  onConfigChange = (key: string, val: any) => {
    this.props.updateConfig({ [key]: val })
  }

  render () {
    const { config } = this.props
    const onConfigChange = this.onConfigChange

    return (
      <Form>
        <Form.Item label="Replay Helper" {...displayConfig}>
          <Checkbox
            onChange={(e: any) =>
              onConfigChange('playScrollElementsIntoView', e.target.checked)
            }
            checked={config.playScrollElementsIntoView}
          >
            Scroll elements into view during replay
          </Checkbox>

          <Checkbox
            onChange={(e: any) =>
              onConfigChange('playHighlightElements', e.target.checked)
            }
            checked={config.playHighlightElements}
          >
            Highlight elements during replay
          </Checkbox>
        </Form.Item>

        <Form.Item
          label={
            <a target="_blank" href="https://go.ui.vision/?help=command_interval">
              Command Interval
            </a>
          }
          {...displayConfig}
        >
          <Select
            style={{ width: '200px' }}
            placeholder="interval"
            value={'' + config.playCommandInterval}
            onChange={(val) => onConfigChange('playCommandInterval', val)}
          >
            <Select.Option value={'0'}>Fast (no delay)</Select.Option>
            <Select.Option value={'0.3'}>Medium (0.3s delay)</Select.Option>
            <Select.Option value={'2'}>Slow (2s delay)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={
            <a target="_blank" href="https://go.ui.vision/?help=timeout_pageload">
              !TIMEOUT_PAGELOAD
            </a>
          }
          {...displayConfig}
        >
          <Input
            type="number"
            min="0"
            style={{ width: '70px' }}
            value={config.timeoutPageLoad}
            onChange={(e) => onConfigChange('timeoutPageLoad', e.target.value)}
            placeholder="in seconds"
          />
          <span className="tip">Max. time for new page load</span>
        </Form.Item>

        <Form.Item
          label={
            <a target="_blank" href="https://go.ui.vision/?help=timeout_wait">
              !TIMEOUT_WAIT
            </a>
          }
          {...displayConfig}
        >
          <Input
            type="number"
            min="0"
            style={{ width: '70px' }}
            value={config.timeoutElement}
            onChange={(e) => onConfigChange('timeoutElement', e.target.value)}
            placeholder="in seconds"
          />
          <span className="tip">Max. time per step</span>
        </Form.Item>
        <Form.Item
          label={
            <a target="_blank" href="https://go.ui.vision/?help=timeout_macro">
              !TIMEOUT_MACRO
            </a>
          }
          {...displayConfig}
        >
          <Input
            type="number"
            min="0"
            style={{ width: '70px' }}
            value={config.timeoutMacro}
            onChange={(e) => onConfigChange('timeoutMacro', e.target.value)}
            placeholder="in seconds"
          />
          <span className="tip">Max. overall macro runtime</span>
        </Form.Item>
        <Form.Item
          label={
            <a target="_blank" href="https://go.ui.vision/?help=timeout_download">
              !TIMEOUT_DOWNLOAD
            </a>
          }
          {...displayConfig}
        >
          <Input
            type="number"
            min="0"
            style={{ width: '70px' }}
            value={config.timeoutDownload}
            onChange={(e) => onConfigChange('timeoutDownload', e.target.value)}
            placeholder="in seconds"
          />
          <span className="tip">Max. allowed time for file</span>
        </Form.Item>
      </Form>
    )
  }
}

export default connect(
  (state: State) => ({
    config: (state as any).config
  }),
  (dispatch: Dispatch) => bindActionCreators({ ...actions, ...simpleActions } as any, dispatch)
)(ReplayTab as any)
