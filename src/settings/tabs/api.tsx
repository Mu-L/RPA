// Settings > API — extracted from the old settings modal in header.js.
// The embedded-macro website whitelist modal moved here with it.
import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators, Dispatch } from 'redux'
import { Button, Checkbox, Form, Input, message, Modal } from 'antd'

import * as actions from '@/actions'
import { Actions as simpleActions } from '@/actions/simple_actions'
import { generateEmptyHtml } from '@/common/convert_utils'
import FileSaver from '@/common/lib/file_saver'
import { State } from '@/reducers/state'

const displayConfig = {
  labelCol: { span: 6 },
  wrapperCol: { span: 16 }
}

interface ApiTabProps {
  config: { [key: string]: any }
  updateConfig: (config: { [key: string]: any }) => void
}

interface ApiTabState {
  showWhiteList: boolean
  websiteWhiteListText: string
}

class ApiTab extends React.Component<ApiTabProps, ApiTabState> {
  state: ApiTabState = {
    showWhiteList: false,
    websiteWhiteListText: ''
  }

  onConfigChange = (key: string, val: any) => {
    this.props.updateConfig({ [key]: val })
  }

  openWhiteList = () => {
    this.setState({
      showWhiteList: true,
      websiteWhiteListText: (this.props.config.websiteWhiteList || []).join('\n')
    })
  }

  renderWhiteListModal () {
    return (
      <Modal
        title="Embedded Macros Website Whitelist"
        className="whitelist-modal"
        width={450}
        okText="Save"
        open={this.state.showWhiteList}
        onCancel={() => this.setState({ showWhiteList: false })}
        onOk={() => {
          const text = this.state.websiteWhiteListText
          const lines = text
            .split(/\n/g)
            .map((str) => str.trim())
            .filter((str) => str.length > 0)

          this.props.updateConfig({ websiteWhiteList: lines })
          this.setState({ showWhiteList: false })
          message.success('Saved')

          return Promise.resolve(true)
        }}
      >
        <p style={{ marginBottom: '10px' }}>
          Allow embedded macros to run <em>without warning dialog</em>, if
          started from the following sites:
        </p>
        <Input.TextArea
          placeholder="One url per line, e. g. https://ui.vision/rpa"
          autoSize={{ minRows: 6, maxRows: 12 }}
          value={this.state.websiteWhiteListText}
          style={{ resize: 'vertical' }}
          onChange={(e) => this.setState({ websiteWhiteListText: e.target.value })}
        />
        <p style={{ color: 'green', marginTop: '20px' }}>
          <a
            style={{ float: 'right', marginLeft: '20px' }}
            href="https://go.ui.vision/?help=website_whitelist"
            target="_blank"
          >
            More info
          </a>
          Only run embedded macros from websites you trust
        </p>
      </Modal>
    )
  }

  render () {
    const { config } = this.props
    const onConfigChange = this.onConfigChange

    return (
      <div className="api-pane">
        <p>
          The RPA command line API allows you to run macros and test suites
          from the command line and to control Ui.Vision from any
          scripting or programming language (
          <a href="https://go.ui.vision/?help=cmdline" target="_blank">
            more info
          </a>
          ).
        </p>

        <p>
          <Button
            type="primary"
            onClick={() => {
              const str = generateEmptyHtml()
              const blob = new Blob([str], {
                type: 'text/plain;charset=utf-8'
              })

              FileSaver.saveAs(blob, `ui.vision.html`, true)
            }}
          >
            Generate Autostart HTML Page
          </Button>
        </p>

        <Form>
          <Form.Item
            label={
              <a target="_blank" href="https://go.ui.vision/?help=cmdline">
                Allow Command Line
              </a>
            }
            {...displayConfig}
          >
            <Checkbox
              onChange={(e: any) =>
              onConfigChange('allowRunFromBookmark', e.target.checked)
              }
              checked={config.allowRunFromBookmark}
            >
              Run macro and test suite shortcuts from Javascript Bookmarklets
            </Checkbox>
            <Checkbox
              onChange={(e: any) =>
              onConfigChange('allowRunFromFileSchema', e.target.checked)
              }
              checked={config.allowRunFromFileSchema}
            >
              Run embedded macros from local files
            </Checkbox>
            <Checkbox
              onChange={(e: any) =>
              onConfigChange('allowRunFromHttpSchema', e.target.checked)
              }
              checked={config.allowRunFromHttpSchema}
            >
              Run embedded macros from public websites
              <a
                href="#"
                style={{
                  position: 'relative',
                  marginLeft: '10px',
                  padding: '15px 0'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  this.openWhiteList()
                }}
              >
                Edit Whitelist
              </a>
            </Checkbox>
          </Form.Item>
        </Form>

        <p style={{ marginTop: '20px' }}>
          💡 Use Claude Code? The MCP API lets it (and any other MCP
          client) build and run macros in this browser. Enable the
          MCP bridge in the{' '}
          <a
            href="#ai"
            onClick={(e) => {
              e.preventDefault()
              window.location.hash = 'ai'
            }}
          >
            AI settings
          </a>
          .
        </p>

        {this.renderWhiteListModal()}
      </div>
    )
  }
}

export default connect(
  (state: State) => ({
    config: (state as any).config
  }),
  (dispatch: Dispatch) => bindActionCreators({ ...actions, ...simpleActions } as any, dispatch)
)(ApiTab as any)
