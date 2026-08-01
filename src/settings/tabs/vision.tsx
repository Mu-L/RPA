// Settings > Vision — extracted from the old settings modal in header.js
import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators, Dispatch } from 'redux'
import { Button, Checkbox, Input, message, Radio, Select } from 'antd'

import * as actions from '@/actions'
import { Actions as simpleActions } from '@/actions/simple_actions'
import { isMac } from '@/common/ts_utils'
import { range, updateIn } from '@/common/utils'
import Ext from '@/common/web_extension'
import { getXDesktop } from '@/services/xmodules/xdesktop'
import { getXScreenCapture } from '@/services/xmodules/x_screen_capture'
import { State } from '@/reducers/state'

interface VisionTabProps {
  config: { [key: string]: any }
  updateConfig: (config: { [key: string]: any }) => void
}

interface VisionTabState {
  xModuleData: { [key: string]: any }
}

class VisionTab extends React.Component<VisionTabProps, VisionTabState> {
  state: VisionTabState = {
    xModuleData: {}
  }

  componentDidMount () {
    // the desktop radio and the screen-capture checkbox need the installed
    // state of their XModules; fetch just those two on mount
    ;[getXDesktop(), getXScreenCapture()].forEach((mod: any) => {
      mod.initConfig()
        .catch(() => {})
        .then(() => mod.getVersion())
        .then((versionInfo: any) => {
          this.setState(
            updateIn(
              ['xModuleData', mod.getName()],
              (orig: any) => ({ ...orig, ...versionInfo, config: mod.getCachedConfig() }),
              this.state
            )
          )
        })
    })
  }

  onConfigChange = (key: string, val: any) => {
    this.props.updateConfig({ [key]: val })
  }

  refreshScreenCaptureStatus = () => {
    getXScreenCapture()
      .getVersion()
      .then((data: any) => {
        const { installed, version } = data
        const msg = installed ? `Installed (v${version})` : 'Not Installed'
        message.info(`status updated: ${msg}`)

        this.setState(
          updateIn(
            ['xModuleData', getXScreenCapture().getName()],
            (orig: any) => ({
              ...orig,
              ...data,
              config: getXScreenCapture().getCachedConfig()
            }),
            this.state
          )
        )
      })
  }

  render () {
    const { config } = this.props
    const onConfigChange = this.onConfigChange
    const xDesktopData = this.state.xModuleData[getXDesktop().getName()]
    const xScreenCaptureData = this.state.xModuleData[getXScreenCapture().getName()]

    return (
      <div className="vision-pane">
        <p>
          Ui.Vision's eyes can look inside the web browser or search the
          complete desktop.
        </p>
        <div className="row">
          <Radio.Group value={config.cvScope}>
            <Radio value="browser" onClick={() => onConfigChange('cvScope', 'browser')}>
              Browser Automation (Look inside browser)
            </Radio>
            <Radio
              value="desktop"
              onClick={() => onConfigChange('cvScope', 'desktop')}
              disabled={!(xDesktopData && xDesktopData.installed)}
            >
              <span>Desktop Automation (Search complete desktop)</span>
              {xDesktopData && xDesktopData.installed ? null : (
                <a
                  target="_blank"
                  href={getXDesktop().downloadLink()}
                  style={{ marginLeft: '15px' }}
                >
                  Install the DesktopAutomation XModule first.
                </a>
              )}

              <div>
                <Checkbox
                  onChange={(e: any) =>
                    onConfigChange('useDesktopScreenCapture', e.target.checked)
                  }
                  checked={config.useDesktopScreenCapture}
                  disabled={
                    config.cvScope !== 'desktop' ||
                    !(xScreenCaptureData && xScreenCaptureData.installed)
                  }
                >
                  <span>
                    Use native{' '}
                    <a href={getXScreenCapture().infoLink()} target="_blank">
                      desktop screen capture
                    </a>{' '}
                    if installed (see XModule below)
                  </span>
                  {xScreenCaptureData && xScreenCaptureData.installed ? null : (
                    <a
                      target="_blank"
                      href={getXScreenCapture().downloadLink()}
                      style={{ marginLeft: '15px' }}
                    >
                      Install the ScreenCapture XModule first.
                    </a>
                  )}
                </Checkbox>
              </div>

              {/* desktop-only: the wait exists so the user can bring another
                  window to the front before the screen is captured */}
              <div>
                <Checkbox
                  onChange={(e: any) =>
                    onConfigChange('waitBeforeDesktopScreenCapture', e.target.checked)
                  }
                  checked={config.waitBeforeDesktopScreenCapture}
                  disabled={config.cvScope !== 'desktop'}
                >
                  <span>Wait</span>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    disabled={config.cvScope !== 'desktop'}
                    value={config.secondsBeforeDesktopScreenCapture}
                    style={{ width: '60px', margin: '0 10px' }}
                    onChange={(e) =>
                      onConfigChange(
                        'secondsBeforeDesktopScreenCapture',
                        Math.min(60, Number(e.target.value))
                      )
                    }
                  />
                  <span>
                    seconds before taking screenshots. This allows you to switch
                    windows
                  </span>
                </Checkbox>
              </div>
            </Radio>
          </Radio.Group>
        </div>

        <p>
          In JS macros the vision scope is set per call: pass{' '}
          <code>{"{scope: 'desktop'}"}</code> to a finder like{' '}
          <code>uiv.findImage</code> or <code>uiv.ocr.findText</code> to search
          the whole screen instead of the browser tab. To restrict the search
          to one region, pass <code>{'{area: ...}'}</code> with a match or a
          rectangle.
        </p>

        <div className="row" style={{ marginTop: '30px' }}>
          <p>Default Vision Search Confidence</p>
          <Select
            style={{ width: '200px' }}
            placeholder="interval"
            value={'' + config.defaultVisionSearchConfidence}
            onChange={(val) =>
              onConfigChange('defaultVisionSearchConfidence', parseFloat(val))
            }
          >
            {range(1, 11, 1).map((n: number) => (
              <Select.Option key={n} value={'' + (0.1 * n).toFixed(1)}>
                {(0.1 * n).toFixed(1)}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div style={{ margin: '30px 0 0' }} className="xmodule-item">
          <div className="xmodule-title">
            <span>
              <b>Screen Capture XModule</b> - Select images more quickly
            </span>
            <a href={getXScreenCapture().infoLink()} target="_blank">
              More Info
            </a>
            <Button type="primary" onClick={this.refreshScreenCaptureStatus}>
              Test it
            </Button>
          </div>

          <div className="xmodule-status">
            <label>Status:</label>

            {xScreenCaptureData && xScreenCaptureData.installed ? (
              <div className="status-box">
                <span>Installed (v{xScreenCaptureData.version})</span>
                <a
                  target="_blank"
                  href={getXScreenCapture().checkUpdateLink(
                    xScreenCaptureData && xScreenCaptureData.version,
                    Ext.runtime.getManifest().version
                  )}
                >
                  Check for update
                </a>
              </div>
            ) : (
              <div className="status-box">
                <span> {isMac() ? 'Not available/not needed for Mac' : 'Not Installed'} </span>
                <a href={getXScreenCapture().downloadLink()} target="_blank">
                  Download it
                </a>
              </div>
            )}
          </div>
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
)(VisionTab as any)
