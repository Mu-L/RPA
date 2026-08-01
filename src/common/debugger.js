import Ext from './web_extension'
import { partial, composePromiseFn } from './utils'

const PROTOCOL_VERSION = '1.2'
const ClEANUP_TIMEOUT = 0

export const withDebugger = (function () {
  const state = {
    connected: null,
    cleanupTimer: null,
    externalDetachListener: null
  }

  const setState = (obj) => {
    Object.assign(state, obj)
  }

  const cancelCleanup = () => {
    if (state.cleanupTimer) clearTimeout(state.cleanupTimer)
    setState({ cleanupTimer: null })
  }

  const isSameDebuggee = (a, b) => {
    return a && b && a.tabId && b.tabId && a.tabId === b.tabId
  }

  // The user can detach us externally (the "started debugging" infobar's Cancel
  // button, or opening DevTools on the tab). Without clearing our state, the
  // next call would assume it's still attached and fail on sendCommand.
  const ensureExternalDetachListener = () => {
    if (state.externalDetachListener) return

    const listener = (source) => {
      if (isSameDebuggee(state.connected, source)) {
        cancelCleanup()
        setState({ connected: null })
      }
    }
    Ext.debugger.onDetach.addListener(listener)
    setState({ externalDetachListener: listener })
  }

  return (debuggee, fn, options = {}) => {
    const cleanupTimeout = options.cleanupTimeout || ClEANUP_TIMEOUT

    const attach = (debuggee) => {
      // On Firefox the web_extension adapter leaves Ext.debugger as an empty
      // stub (no chrome.debugger API), so fail with a clear message instead of
      // crashing on Ext.debugger.onDetach.addListener below
      if (typeof Ext.debugger.attach !== 'function') {
        return Promise.reject(new Error('E331: This command needs the browser debugger API, which Firefox does not provide to extensions (Chrome/Edge only)'))
      }

      ensureExternalDetachListener()

      if (isSameDebuggee(state.connected, debuggee)) {
        cancelCleanup()
        return Promise.resolve()
      }

      return detach(state.connected)
      .then(() => Ext.debugger.attach(debuggee, PROTOCOL_VERSION))
      .then(() => setState({ connected: debuggee }))
    }
    const detach = (debuggee) => {
      if (!debuggee)  return Promise.resolve()

      return Ext.debugger.detach(debuggee)
      .then(() => {
        if (state.cleanupTimer) clearTimeout(state.cleanupTimer)

        setState({
          connected: null,
          cleanupTimer: null
        })
      }, e => console.error('error in detach', e.stack))
    }
    const scheduleDetach = () => {
      const timer = setTimeout(() => detach(debuggee), cleanupTimeout)
      setState({ cleanupTimer: timer })
    }
    const sendCommand = (cmd, params) => {
      return Ext.debugger.sendCommand(debuggee, cmd, params)
    }
    const onEvent = (callback) => {
      Ext.debugger.onEvent.addListener(callback)
    }
    const onDetach = (callback) => {
      Ext.debugger.onDetach.addListener(callback)
    }

    return new Promise((resolve, reject) => {
      const done = (error, result) => {
        scheduleDetach()

        if (error)  return reject(error)
        else        return resolve(result)
      }

      return attach(debuggee).then(
        () => {
          fn({ sendCommand, onEvent, onDetach, done })
        },
        e => reject(e)
      )
    })
  }
})()

const __getDocument = ({ sendCommand, done }) => () => {
  return sendCommand('DOM.getDocument')
  .then(obj => obj.root)
}

const __querySelector = ({ sendCommand, done }) => partial((selector, nodeId) => {
  return sendCommand('DOM.querySelector', { nodeId, selector })
  .then(res => res && res.nodeId)
})

const __setFileInputFiles = ({ sendCommand, done }) => partial((files, nodeId) => {
  return sendCommand('DOM.setFileInputFiles', { nodeId, files })
  .then(() => true)
})

export const setFileInputFiles = ({ tabId, selector, files }) => {
  return withDebugger({ tabId }, api => {
    const go = composePromiseFn(
      __setFileInputFiles(api)(files),
      __querySelector(api)(selector),
      node => node.nodeId,
      __getDocument(api)
    )

    return go().then(res => api.done(null, res))
  })
}
