import { Modal } from 'antd'
import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import * as actions from '@/actions'

// A one-time NOTICE for upgrading users. It used to be a choice — "show
// classic macros, or JS, or both" — but there is nothing left to choose: the
// tree shows every macro, and the Table/Source views appear whenever the
// selected macro is a classic one. The setting that question fed no longer
// gates anything, so all that remains is telling people what changed.
//
// NEW USERS NEVER SEE THIS. They have no macros and no habits, nothing has
// changed for them, and they already meet the AI-provider card on first run.
//
// Which case applies comes from config.macroFreshInstall, written by bg.js from
// chrome.runtime.onInstalled — the only reliable signal. Asking whether a
// config exists cannot tell a first install from a reload of an unpacked
// extension, and got this exactly backwards for new users.
class MacroSetupDialog extends React.Component {
  dismiss = () => {
    this.props.updateConfig({ macroSetupDone: true })
  }

  isFreshInstall () {
    const { config } = this.props
    // explicit signal from onInstalled when present; otherwise fall back to
    // the install-time default (classic hidden == this looked like a new
    // install when the config was first written)
    if (typeof config.macroFreshInstall === 'boolean') return config.macroFreshInstall
    return !config.showClassicMacros
  }

  // ---- upgrading user: what changed, and what did not ----------------------
  renderUpgrade () {
    return (
      <Modal
        open
        centered
        closable={false}
        maskClosable={false}
        keyboard={false}
        width={460}
        title="Your macros are all still here"
        onOk={this.dismiss}
        okText="OK"
        cancelButtonProps={{ style: { display: 'none' } }}
        className="macro-setup-dialog"
      >
        <p>
          Ui.Vision now has a second macro format: <strong>JS scripts</strong> — real JavaScript, with loops,
          conditions and error handling written the normal way. It is the recommended format for new macros, and the
          one the AI writes.
        </p>

        {/* The whole point of this dialog is that nothing was taken away. It
            says so plainly rather than implying it, because an update that
            looks like it ate your work is the fear this is here to answer. */}
        <p className="macro-setup-reassure">
          <strong>Your existing macros work and replay exactly as before.</strong> Nothing was converted, nothing was
          deleted, and every macro is still in your list. The core engine has not changed — it has only been improved.
        </p>
      </Modal>
    )
  }

  // A fresh install has nothing to decide, so the setup is recorded as done
  // without ever showing anything. Doing it here rather than in render keeps
  // the config write out of the render path, and means a later version update
  // will not re-ask someone who was never asked in the first place.
  componentDidMount () {
    const { config } = this.props
    if (config && !config.macroSetupDone && this.isFreshInstall()) {
      this.props.updateConfig({ macroSetupDone: true })
    }
  }

  render () {
    const { config } = this.props
    if (!config || config.macroSetupDone) return null
    if (this.isFreshInstall()) return null // handled in componentDidMount

    return this.renderUpgrade()
  }
}

export default connect(
  (state) => ({ config: state.config }),
  (dispatch) => bindActionCreators({ ...actions }, dispatch)
)(MacroSetupDialog)
