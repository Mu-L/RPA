// Settings > XModules — extracted from the old settings modal in header.js
import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators, Dispatch } from 'redux'
import { Button, Input, message } from 'antd'

import * as actions from '@/actions'
import { Actions as simpleActions } from '@/actions/simple_actions'
import { compose, setIn, updateIn } from '@/common/utils'
import Ext from '@/common/web_extension'
import { getStorageManager, StorageManagerEvent } from '@/services/storage'
import { getXDesktop } from '@/services/xmodules/xdesktop'
import { getXFile } from '@/services/xmodules/xfile'
import { getXUserIO } from '@/services/xmodules/x_user_io'
import { State } from '@/reducers/state'

interface XModulesTabProps {
  config: { [key: string]: any }
  updateConfig: (config: { [key: string]: any }) => void
}

interface XModulesTabState {
  xModuleData: { [key: string]: any }
  xFileRootDirChanged: boolean
}

class XModulesTab extends React.Component<XModulesTabProps, XModulesTabState> {
  state: XModulesTabState = {
    xModuleData: {},
    xFileRootDirChanged: false
  }

  componentDidMount () {
    this.initXModules()
  }

  initXModules () {
    const xModules: any[] = [getXFile(), getXUserIO(), getXDesktop()]

    Promise.all(
      xModules.map((mod) => {
        // Note: call init config for each xmodule and discard any error
        return mod
          .initConfig()
          .catch(() => {})
          .then(() => mod.getVersion())
          .then((versionInfo: any) => {
            if (versionInfo.installed) {
              return mod
                .sanityCheck()
                .then(
                  () => ({ error: null }),
                  (e: Error) => ({ error: e.message })
                )
                .then((checkResult: any) => ({ versionInfo, checkResult }))
            } else {
              return { versionInfo, checkResult: null }
            }
          })
      })
    ).then((results) => {
      const xModuleData = results.reduce((prev: any, r: any, i: number) => {
        prev[xModules[i].getName()] = {
          ...r.versionInfo,
          checkResult: r.checkResult,
          config: xModules[i].getCachedConfig()
        }
        return prev
      }, {})

      this.setState({ xModuleData, xFileRootDirChanged: false })
    })
  }

  refreshModuleStatus = (mod: any) => {
    mod.getVersion().then((data: any) => {
      const { installed, version } = data
      const msg = installed ? `Installed (v${version})` : 'Not Installed'
      message.info(`status updated: ${msg}`)

      const p = !installed || !mod.initConfig ? Promise.resolve() : mod.initConfig()

      Promise.resolve(p).catch(() => {}).then(() => {
        this.setState(
          updateIn(
            ['xModuleData', mod.getName()],
            (orig: any) => ({ ...orig, ...data, config: mod.getCachedConfig() }),
            this.state
          )
        )
      })
    })
  }

  renderModuleStatus (mod: any) {
    const data = this.state.xModuleData[mod.getName()]

    return (
      <div className="xmodule-status">
        <label>Status:</label>

        {data && data.installed ? (
          <div className="status-box">
            <span>Installed (v{data.version})</span>
            <a
              target="_blank"
              href={mod.checkUpdateLink(
                data && data.version,
                Ext.runtime.getManifest().version
              )}
            >
              Check for update
            </a>
          </div>
        ) : (
          <div className="status-box">
            <span>Not Installed</span>
            <a href={mod.downloadLink()} target="_blank">
              Download it
            </a>
          </div>
        )}
      </div>
    )
  }

  render () {
    const xFileData = this.state.xModuleData[getXFile().getName()]

    return (
      <div className="xmodules-pane">
        <div className="xmodule-item">
          <div className="xmodule-title">
            <span>
              <b>FileAccess XModule</b> - Read and write to your hard drive
            </span>
            <a href={getXFile().infoLink()} target="_blank">
              More Info
            </a>
            <Button type="primary" onClick={() => this.refreshModuleStatus(getXFile())}>
              Test it
            </Button>
          </div>

          {this.renderModuleStatus(getXFile())}

          <div className="xmodule-settings">
            <h3>Settings</h3>
            <div className="xmodule-settings-item">
              <div className="settings-detail">
                <label>Home Folder</label>
                <div className="settings-detail-content">
                  <Input
                    type="text"
                    value={getXFile().getCachedConfig().rootDir}
                    disabled={!(xFileData && xFileData.installed)}
                    onChange={(e) => {
                      const rootDir = e.target.value

                      this.setState(
                        compose(
                          setIn(
                            ['xModuleData', getXFile().getName(), 'config', 'rootDir'],
                            rootDir
                          ),
                          setIn(['xFileRootDirChanged'], true)
                        )(this.state)
                      )

                      getXFile().setConfig({ rootDir })
                    }}
                    onBlur={() => {
                      if (this.state.xFileRootDirChanged) {
                        this.setState({ xFileRootDirChanged: false })

                        getXFile()
                          .sanityCheck()
                          .then(
                            () => {
                              this.setState(
                                setIn(
                                  ['xModuleData', getXFile().getName(), 'checkResult'],
                                  { error: null },
                                  this.state
                                )
                              )

                              getStorageManager().emit(StorageManagerEvent.RootDirChanged)
                            },
                            (e: Error) => {
                              this.setState(
                                setIn(
                                  ['xModuleData', getXFile().getName(), 'checkResult'],
                                  { error: e.message },
                                  this.state
                                )
                              )
                            }
                          )
                      }
                    }}
                  />

                  {xFileData &&
                  xFileData.checkResult &&
                  xFileData.checkResult.error ? (
                    <div className="check-result">
                      {xFileData.checkResult.error}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="settings-desc">
                In this folder, Ui.Vision creates /macros, /images, /datasources
              </div>
            </div>
          </div>
        </div>

        <div className="xmodule-item">
          <div className="xmodule-title">
            <span>
              <b>RealUser XModule</b> - Click / Type / Drag with OS native events
            </span>
            <a href={getXUserIO().infoLink()} target="_blank">
              More Info
            </a>
            <Button type="primary" onClick={() => this.refreshModuleStatus(getXUserIO())}>
              Test it
            </Button>
          </div>

          {this.renderModuleStatus(getXUserIO())}
        </div>

        <div className="xmodule-item">
          <div className="xmodule-title">
            <span>
              <b>DesktopAutomation XModule</b> - Visual Desktop Automation
            </span>
            <a href={getXDesktop().infoLink()} target="_blank">
              More Info
            </a>
            <Button type="primary" onClick={() => this.refreshModuleStatus(getXDesktop())}>
              Test it
            </Button>
          </div>

          {this.renderModuleStatus(getXDesktop())}
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
)(XModulesTab as any)
