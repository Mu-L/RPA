// Settings > Advanced > Security — extracted from the old settings modal in
// header.js: master password + "create encrypted text string" helper.
import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators, Dispatch } from 'redux'
import { Button, Checkbox, Input, message, Radio } from 'antd'
import copyToClipboard from 'copy-to-clipboard'

import * as actions from '@/actions'
import { Actions as simpleActions } from '@/actions/simple_actions'
import { encrypt } from '@/common/encrypt'
import { State } from '@/reducers/state'

interface SecurityTabProps {
  config: { [key: string]: any }
  updateConfig: (config: { [key: string]: any }) => void
}

interface SecurityTabState {
  textToEncrypt: string
  encryptedText: string
  showText: boolean
}

class SecurityTab extends React.Component<SecurityTabProps, SecurityTabState> {
  state: SecurityTabState = {
    textToEncrypt: '',
    encryptedText: '',
    showText: false
  }

  onConfigChange = (key: string, val: any) => {
    this.props.updateConfig({ [key]: val })
  }

  render () {
    const { config } = this.props
    const onConfigChange = this.onConfigChange

    return (
      <div className="security-pane">
        <h4>Master password for Password Encryption</h4>
        <p>
          A master password is used to encrypt and decrypt all stored
          website passwords. The websites passwords are encrypted using
          strong encryption.&nbsp;&nbsp;
          <a target="_blank" href="https://go.ui.vision/?help=encryption">
            More info &gt;&gt;
          </a>
        </p>
        <div>
          <Radio.Group value={config.shouldEncryptPassword}>
            <Radio value="no" onClick={() => onConfigChange('shouldEncryptPassword', 'no')}>
              Do not encrypt passwords
            </Radio>
            <Radio
              value="master_password"
              onClick={() => onConfigChange('shouldEncryptPassword', 'master_password')}
            >
              Enter master password here to store it
            </Radio>
          </Radio.Group>

          {config.shouldEncryptPassword === 'master_password' ? (
            <div>
              <div>
                <label>Master password:</label>
                <Input
                  type="password"
                  style={{ width: '200px' }}
                  value={config.masterPassword}
                  onChange={(e) => onConfigChange('masterPassword', e.target.value)}
                />
              </div>
              <div>
                <hr style={{ margin: '20px 0' }} />
                <h4>Create encrypted text string</h4>
                <p>
                  The feature uses the master password to encrypt text. The
                  encrypted string can be used with TYPE, SENDKEY and XTYPE.
                </p>
                <div className="input-line">
                  <span className="input-label">Text to encrypt:</span>
                  <Input
                    type={this.state.showText ? 'text' : 'password'}
                    style={{ width: '200px' }}
                    value={this.state.textToEncrypt}
                    onChange={(e) => {
                      this.setState({
                        textToEncrypt: e.target.value,
                        encryptedText: ''
                      })
                    }}
                  />
                  <Checkbox
                    onChange={(e: any) => {
                      this.setState({ showText: e.target.checked })
                    }}
                    checked={this.state.showText}
                  >
                    Show text
                  </Checkbox>
                </div>
                <div className="input-line">
                  <span className="input-label">Encrypted string:</span>
                  <Input
                    readOnly={true}
                    type="text"
                    style={{ width: '200px' }}
                    value={this.state.encryptedText}
                  />
                </div>
                <div className="input-line">
                  <span className="input-label"></span>
                  <Button
                    type="primary"
                    onClick={() => {
                      encrypt(this.state.textToEncrypt).then((text: string) => {
                        this.setState({ encryptedText: text })

                        copyToClipboard(text, {
                          format: 'text/plain'
                        })

                        message.success('Copied to clipboard')
                      })
                    }}
                  >
                    Encrypt &amp; Copy
                  </Button>

                  <a href="https://go.ui.vision/?help=encrypt" target="_blank">
                    (More info)
                  </a>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }
}

export default connect(
  (state: State) => ({
    config: (state as any).config
  }),
  (dispatch: Dispatch) => bindActionCreators({ ...actions, ...simpleActions } as any, dispatch)
)(SecurityTab as any)
