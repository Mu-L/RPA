import * as act from '@/actions'
import { store } from '@/redux'
import { isFirefox } from '@/common/dom_utils'
import { getState, updateState, ExtensionState } from '../common/global_state'
import { Command } from '@/services/player/macro'
import Ext from '@/common/web_extension'
import log from '@/common/log'
import ipc from '@/common/ipc/ipc_cs'
import * as C from '@/common/constant'
import { delay, retry } from '@/common/ts_utils'
import { clearTimerForTimeoutStatus, startSendingTimeoutStatus } from './timeout_counter'
import { withTimeout } from '@/common/utils'
import { getPlayTab, getPlayTabOpenB } from '../common/tab'

// Note: There are several versions of runCommandXXX here. One by one, they have a better tolerence of error
// 1. sendRunCommand:
//      Run a command, and wait until we can confirm that command is completed (e.g.  xxxAndWait)
//
// 2. runCommandWithRetry:
//      Enhance sendRunCommand with retry mechanism, only retry when element is not found
//
// 3. runCommandWithClosureAndErrorProcess:
//      Include `args` in closure, and take care of `errorIgnore`
//
// 4. runWithHeartBeat:
//      Run a heart beat check along with `runCommandWithClosureAndErrorProcess`.
//      Heart beat check requires cs Ipc must be created before heart beat check starts.
//      With this, we can ensure the page is not closed or refreshed
//
// 5. runWithRetryOnLostHeartBeat:
//      Run `runWithHeartBeat` with retry mechanism. only retry when it's a 'lost heart beat' error
//      When closed/refresh is detected, it will try to send same command to that tab again.

export async function runCommandInPlayTab(command: Command): Promise<RunCommandResult> {
  log('2. runCommandInPlayTab:>> command:', command)
  clearTimerForTimeoutStatus()

  const superFast = (command.extra?.superFast && !['open'].includes(command.cmd)) || false

  // Note: `disableHeartBeat` is only set to true when current tab will
  // be closed ("reload tab" / "change url" excluded).
  // For exmaple `selectWindow tab=close`
  // TODO: maybe omit it?? it takes 15ms.
  if (!superFast) {
    await updateState({ disableHeartBeat: false })
  }

  // TODO: reduce time here or Omit it??. it takes 100ms
  // **Solution: prepare the tab only once in the beginning of the macro
  const shouldSkipCommandRun = superFast ? false : await preparePlayTab(command)
  console.log('shouldSkipCommandRun:>>', shouldSkipCommandRun, command)

  // fix here:
  //|| command.cmd !== 'open'

  if (command.cmd === 'open') {
    console.log("shouldSkipCommandRun:>> command.cmd === 'open'")

    const timeoutPageLoad = getTimeoutPageLoad(command)

    const promise1 = callPlayTab({
      command: 'DOM_READY',
      args: {},
      ipcCallTimeout: timeoutPageLoad
    })

    const promise2 = bestEffortPlayTabCall({
      command: 'HACK_ALERT',
      args: {},
      ipcCallTimeout: C.CS_IPC_TIMEOUT
    })

    await Promise.all([promise1, promise2]).then(() => {})
  }

  if (shouldSkipCommandRun) {
    return {}
  }

  try {
    return await runWithRetryOnLostHeartBeat(command)
  } catch (err) {
    const e = err as Error
    log.error('catched in runCommandInPlayTab', e.stack)

    if (
      e &&
      e.message &&
      (e.message.indexOf('lost heart beat when running command') !== -1 || e.message.indexOf('Could not establish connection') !== -1)
    ) {
      return await runWithRetryOnLostHeartBeat(command)
    }

    return Promise.reject(e)
  }
}

function updateHeartBeatSecret(options?: { disabled?: boolean }): Promise<void> {
  if (options?.disabled) {
    return updateState({ heartBeatSecret: -1 })
  } else {
    return updateState((state) => {
      const oldHeartBeatSecret = state.heartBeatSecret || 0

      return {
        ...state,
        heartBeatSecret: (Math.max(0, oldHeartBeatSecret) + 1) % 10000
      }
    })
  }
}

type PlayTabIPCParams = {
  tabIpcTimeout?: number
  tabIpcNoLaterThan?: number
  ipcCallTimeout?: number
  command: string
  args: any
}

function callPlayTab<T = any>(params: PlayTabIPCParams): Promise<T> {
  const defaultTimeout = 100
  // Default expired at is infinity, but to make it easy to pass it via ipc,
  // use the double of current timestamp
  const defaultNoLaterThan = Date.now() * 2
  const defaultIpcCallTimeout = -1

  const ipcTimeout = params.tabIpcTimeout ?? defaultTimeout
  const ipcNoLaterThan = params.tabIpcNoLaterThan ?? defaultNoLaterThan
  const ipcCallTimeout = params.ipcCallTimeout ?? defaultIpcCallTimeout

  return ipc.ask(
    'PANEL_CALL_PLAY_TAB',
    {
      ipcTimeout,
      ipcNoLaterThan,
      payload: {
        command: params.command,
        args: params.args
      }
    },
    ipcCallTimeout
  )
}

// Recovered-from trouble goes in the log as INFO, not as a warning.
//
// A user should not have to care that a page missed a ping and the command was
// retried: it worked, and a yellow line invites a support ticket about a
// non-problem. But the run log is also what the sidebar AI macro agent reads to
// decide whether a macro needs fixing (see services/ai/macro_agent), and what
// comes back over the MCP bridge — and to those readers "passed" and "passed on
// the second try, after a 4s stall" are very different facts. Info says it
// without alarming anyone.
//
// Routed panel-side on purpose. The old Warning #300 was sent with
// callPlayTab({command: 'ADD_LOG'}), i.e. panel -> bg -> the PLAY TAB, whose
// content script has no ADD_LOG handler at all — the panel was posting a log
// line to itself by way of the web page, and the page dropped it. (The handler
// that does exist is the panel's own, in src/index.js, reached the other way
// round by the content script's CS_ADD_LOG.) Worse, that ipc runs with
// timeout -1, so every one of those calls left a promise that never settled.
function logToPanel(message: string): void {
  try {
    store.dispatch(act.addLog('info', message))
  } catch (e) {
    log.warn('could not log to panel:', message)
  }
}

// Bookkeeping pings to the play tab — they set a flag or a status, and nothing
// downstream reads the ANSWER. Each one is capped at CS_IPC_TIMEOUT (4s), which
// a live but BUSY page misses easily: a heavy first load (a Google Forms page,
// any big SPA) keeps the main thread blocked well past that while it renders,
// so the ping sits in the queue and the ipc rejects with Error #102 — killing
// a macro whose page was, in fact, perfectly fine.
//
// Failing the run on an unanswered ping is the wrong trade. None of these is
// load-bearing on its own: SET_STATUS is re-sent before every single command
// (sendRunCommand), HACK_ALERT is re-applied by the SET_STATUS handler in the
// content script, and MARK_NO_COMMANDS_YET only lets an already-loaded page
// skip a redundant re-navigation. Warn and carry on; a page that is genuinely
// gone still fails at the next real command, with a real error.
function bestEffortPlayTabCall(params: PlayTabIPCParams): Promise<void> {
  return callPlayTab(params).then(
    () => {},
    () => {
      logToPanel(
        `#301: the page was busy and did not answer the '${params.command}' status ping within ` +
          `${(params.ipcCallTimeout || 0) / 1000}s — continuing (it is re-sent with the next command)`
      )
    }
  )
}

type CheckHeartBeatResponse = {
  secret: string
}

async function checkHeartBeat(
  tabIpcTimeout?: number,
  tabIpcExpiredAt?: number,
  // A deadline for callers that retry. A missing content script is reported in
  // milliseconds now (ipcBg.ask in common/ipc/ipc_bg_cs.js), but a page whose
  // main thread is blocked still answers nothing at all — and retry() only
  // arms its own timeout after a first rejection, so one hung attempt would
  // mean no retry ever happens.
  ipcCallTimeout?: number
): Promise<CheckHeartBeatResponse> {
  const disableHeartBeat = await getState('disableHeartBeat')

  if (disableHeartBeat) {
    return { secret: 'heart_beat_disabled' }
  }

  await updateHeartBeatSecret()

  return callPlayTab<CheckHeartBeatResponse>({
    tabIpcTimeout,
    tabIpcNoLaterThan: tabIpcExpiredAt,
    ipcCallTimeout,
    command: 'HEART_BEAT',
    args: {}
  }).catch((e) => {
    log.error('at least I catched it', e.message)
    throw new Error('heart beat error thrown')
  })
}

function shouldWaitForDownloadAfterRun(command: Command): boolean {
  // log('shouldWaitForDownloadAfterRun', command)
  return command.cmd === 'click'
}

function shouldWaitForCommand(command: Command): boolean {
  log('shouldWaitForCommand:>>', command)
  return /andWait/i.test(command.cmd) || ['open', 'refresh'].indexOf(command.cmd) !== -1
}

function getCommandTimeout(command: Command): number {
  const defaultTimeout = command.extra.timeoutElement * 1000

  switch (command.cmd) {
    case 'waitForElementVisible':
    case 'waitForElementNotVisible':
    case 'waitForElementPresent':
    case 'waitForElementNotPresent': {
      const timeout = parseInt(command.value, 10)
      return !isNaN(timeout) ? timeout : defaultTimeout
    }

    default:
      return defaultTimeout
  }
}

// Note: -1 will disable ipc timeout for 'pause', and 'onDownload' command
function getIpcTimeout(command: Command): number {
  const pageLoadTimeout = (command?.extra?.timeoutPageLoad || 60) * 1000

  switch (command.cmd) {
    case 'open':
    case 'openBrowser':
    case 'clickAndWait':
    case 'selectAndWait':
      return pageLoadTimeout

    case 'selectWindow': {
      const target = command.target
      const isTabOpen = (target && target.toUpperCase()) === 'TAB=OPEN'

      return isTabOpen ? pageLoadTimeout : getCommandTimeout(command)
    }

    case 'pause':
    case 'onDownload':
    case 'captureEntirePageScreenshot':
      return -1

    default:
      return getCommandTimeout(command)
  }
}

function getTimeoutPageLoad(command: Command): number {
  return (command?.extra?.timeoutPageLoad || 60) * 1000
}

function withPageLoadCheck<T>(command: Command, timeoutPageLoad: number, promiseFunc: () => Promise<T>): Promise<T> {
  const shouldWait = shouldWaitForCommand(command)
  console.log('shouldWait:>>', shouldWait)

  if (!shouldWait) {
    return promiseFunc()
  }

  // Note: send timeout status to dashboard once "xxxWait" and "open" returns
  const clear = startSendingTimeoutStatus(timeoutPageLoad)

  return Promise.race([
    promiseFunc().then(
      (data) => {
        clear()
        return data
      },
      (e) => {
        clear()
        throw e
      }
    ),
    delay(() => {
      // the three #230 sites are indistinguishable in the log otherwise, and
      // each means something different — say which wait ran out
      throw new Error(`Error #230: Page load ${timeoutPageLoad / 1000} seconds time out (no page load event after '${command.cmd}')`)
    }, timeoutPageLoad)
  ])
}

type RunCommandResult = {
  pageUrl?: string
  vars?: Record<string, unknown>
  log?: {
    info?: string
    warning?: string
    error?: string
    options?: {
      notification?: boolean
      noStack?: boolean
    }
  }
  screenshot?: {
    name: string
  }
  extra?: Record<string, unknown>
}

type RunCommandResponse<T = any> = {
  data: RunCommandResult
  isIFrame: boolean
}

function waitForCommandToComplete(command: Command, res: RunCommandResponse): Promise<void> {
  const timeoutPageLoad = getTimeoutPageLoad(command)
  const timeoutHeartbeat = ((res?.data?.extra?.timeoutElement as number) || 10) * 1000
  const shouldWait = shouldWaitForCommand(command)

  // console.log('shouldWait=:>>', shouldWait)
  // console.log('shouldWait=:>> command', command)

  if (!shouldWait) {
    return Promise.resolve()
  }

  return delay(() => {}, 2000)
    .then(() => {
      // Note: After refresh/redirect, ipc secret in content script changes,
      // use this fact to tell whether a page is loaded or not
      return retry(
        () => {
          // bounded, so a dead content script fails this attempt (and the loop
          // below can retry / report #210) instead of hanging until the 60s
          // page-load race turns it into a misleading Error #230
          return checkHeartBeat(undefined, undefined, CS_ALIVE_TIMEOUT).then(async (heartBeatResult) => {
            const lastSecret = await getState('lastCsIpcSecret')
            const heartBeatSecret = heartBeatResult.secret

            if (lastSecret === heartBeatSecret) {
              throw new Error('Error #220: Still same ipc secret')
            }
            return true
          })
        },
        {
          shouldRetry: () => true,
          timeout: timeoutHeartbeat,
          retryInterval: 250
        }
      )()
    })
    .catch((e) => {
      const { cmd } = command
      const isAndWait = /AndWait/.test(cmd)

      console.warn(e)

      if (isAndWait) {
        const instead = cmd.replace('AndWait', '')
        throw new Error(
          `Error #200: '${cmd}' failed. No page load event detected after ${timeoutHeartbeat / 1000} seconds. Try '${instead}' instead. Error details: ` +
            e.message
        )
      } else {
        throw new Error(
          `Error #210: '${cmd}' failed. No page load event detected after ${timeoutHeartbeat / 1000}s (!TIMEOUT_WAIT). Error details: ` +
            e.message
        )
      }
    })
    .then(() => {
      const promise1 = callPlayTab({
        command: 'DOM_READY',
        args: {},
        ipcCallTimeout: timeoutPageLoad
      })

      const promise2 = callPlayTab({
        command: 'HACK_ALERT',
        args: {},
        ipcCallTimeout: C.CS_IPC_TIMEOUT
      })

      return Promise.all([promise1, promise2]).then(() => {})
    })
}

async function sendRunCommand(command: Command, retryInfo: any): Promise<RunCommandResult> {
  const state = await getState()
  const ipcTimeout = getIpcTimeout(command)

  console.log('sendRunCommand command:>> ', command)

  const superFast = (command.extra?.superFast && !['open'].includes(command.cmd)) || false

  if (state.status !== C.APP_STATUS.PLAYER) {
    throw new Error("can't run command when it's not in player mode")
  }

  // Note: clear timer whenever we execute a new command, and it's not a retry
  if (retryInfo.retryCount === 0) {
    clearTimerForTimeoutStatus()
  }

  // TODO: re-consider this, it takes 80+ms
  // Note: each command keeps target page's status as PLAYING
  if (!superFast) {
    await callPlayTab({
      command: 'SET_STATUS',
      args: {
        status: C.CONTENT_SCRIPT_STATUS.PLAYING
      }
    })
  }

  // TODO: re-consider this, it takes 20ms
  if (!superFast) {
    await callPlayTab({
      command: 'DOM_READY',
      args: {},
      ipcCallTimeout: ipcTimeout
    })
  }

  console.log('run command:>> ', command)

  const res = await callPlayTab<RunCommandResponse>({
    command: 'RUN_COMMAND',
    args: {
      command: {
        ...command,
        extra: {
          ...(command.extra || {}),
          retryInfo
        }
      }
    },
    ipcCallTimeout: ipcTimeout
  })

  await withPageLoadCheck(command, getTimeoutPageLoad(command), () => waitForCommandToComplete(command, res))

  const secret = (res.data as any)?.secret

  if (secret) {
    await updateState({ lastCsIpcSecret: secret })
  }

  return res.data
}

function isTimeoutError(msg: string): boolean {
  return (
    !!msg &&
    (msg.indexOf('timeout reached when looking for') !== -1 ||
      msg.indexOf('timeout reached when waiting for') !== -1 ||
      msg.indexOf('element is found but not visible yet') !== -1 ||
      msg.indexOf('IPC Promise has been destroyed') !== -1)
  )
}

async function runCommandWithRetry(command: Command): Promise<RunCommandResult> {
  // Note: add timerSecret to ensure it won't clear timer that is not created by this function call
  const timerSecret = Math.random()
  await updateState({ timerSecret })

  console.log(`runCommandWithRetry:>> command:>> `, command)

  const commandTimeout = getCommandTimeout(command)
  const maxRetryOnIpcTimeout = 1
  let retryCountOnIpcTimeout = 0

  const fn = retry(sendRunCommand, {
    timeout: commandTimeout,
    shouldRetry: (e) => {
      log('runCommandWithRetry - shouldRetry', e.message)

      // Note: for rare cases when guest page doesn't respond to RUN_COMMAND, it will timeout for `timeoutElement`
      // And we should retry RUN_COMMAND for only once in that case, and also show this as warning to users
      // related issue: #513
      //
      // `Error #102` is what an ipc timeout actually looks like today (see
      // ipc_promise.js) — the /ipcPromise.*timeout/ pattern matches a message
      // that string was replaced by, so this whole retry, and the Warning #300
      // that goes with it, had quietly stopped happening: every transient ipc
      // timeout failed the macro on the first try.
      if (/ipcPromise.*timeout/i.test(e.message) || /Error #102/.test(e.message)) {
        if (retryCountOnIpcTimeout < maxRetryOnIpcTimeout) {
          logToPanel(`#300: the page did not answer in time, retrying this command once — ${e.message}`)

          retryCountOnIpcTimeout++
          return true
        } else {
          return false
        }
      }

      return isTimeoutError(e.message)
    },
    onFirstFail: (e: Error) => {
      const title =
        e && e.message && e.message.indexOf('element is found but not visible yet') !== -1
          ? 'Tag waiting' // All use Tag Waiting for now  // 'Visible waiting'
          : 'Tag waiting'

      startSendingTimeoutStatus(commandTimeout, title)
    },
    onFinal: async (err: Error, data: any) => {
      const state = await getState()
      log('onFinal', err, data)

      if (state.timer && state.timerSecret === timerSecret) {
        clearInterval(state.timer)
      }
    }
  })

  try {
    return (await fn(command)) as Promise<RunCommandResult>
  } catch (err) {
    const e = err as Error

    if (!isTimeoutError(e.message)) {
      return Promise.reject(e)
    }

    if (command.targetOptions && command.targetOptions.length) {
      return sendRunCommand(command, { final: true })
    }

    return Promise.reject(e)
  }
}

function runCommandWithClosureAndErrorProcess(command: Command): Promise<RunCommandResult> {
  return runCommandWithRetry(command).catch((e) => {
    console.log('runCommandWithClosureAndErrorProcess c:>>', e)
    // Return default value for storeXXX commands
    if (['storeText', 'storeValue', 'storeChecked', 'storeAttribute'].indexOf(command.cmd) !== -1) {
      const value = command.value
      const LOCATOR_NOT_FOUND = '#LNF'

      return {
        vars: {
          [value]: LOCATOR_NOT_FOUND
        },
        log: {
          error: e.message
        }
      }
    }

    // Note: if variable !ERRORIGNORE is set to true,
    // it will just log errors instead of a stop of whole macro
    if (command.extra?.errorIgnore) {
      return {
        log: {
          error: e.message
        }
      }
    }

    throw e
  })
}

function runWithHeartBeat(command: Command): Promise<RunCommandResult> {
  const isTabOpenForSelectWindow = command.cmd === 'selectWindow' && /^\s*tab=open\s*$/i.test(command.target)

  const superFast = (command.extra?.superFast && !['open'].includes(command.cmd)) || false
  console.log('2a. runWithHeartBeat:>> superFast:', superFast)

  const neverResolvePromise = new Promise<void>(() => {})
  const [infiniteCheckHeartBeat, stopInfiniteCheck] = (() => {
    const startTime = new Date().getTime()
    let stop = false

    const check = (): Promise<void> => {
      // log('starting heart beat')
      // Note: do not check heart beat when
      // 1. it's a 'open' command, which is supposed to reconnect ipc
      // 2. it's going to download files, which will kind of reload page and reconnect ipc

      const pNoNeedForHearBeat = ((): Promise<boolean> => {
        if (shouldWaitForCommand(command)) {
          return Promise.resolve(true)
        }

        return ipc.ask('PANEL_HAS_PENDING_DOWNLOAD', {})
      })()

      return pNoNeedForHearBeat.then((noNeedForHeartBeat) => {
        if (noNeedForHeartBeat) {
          updateHeartBeatSecret({ disabled: true })
          return neverResolvePromise
        }

        if (stop) {
          return Promise.resolve()
        }

        return checkHeartBeat(100, startTime).then(
          () => delay(check, 1000),
          (e) => {
            log.error('lost heart beart!!', e.stack)
            throw new Error('lost heart beat when running command')
          }
        )
      })
    }

    const stopIt = () => {
      // log('stopping heart beat')
      stop = true
    }

    return [check, stopIt]
  })()

  return Promise.race([
    runCommandWithClosureAndErrorProcess(command)
      .then((data) => {
        console.log('runCommandWithClosureAndErrorProcess data:>> ', data)
        stopInfiniteCheck()
        return data
      })
      .catch((e) => {
        stopInfiniteCheck()
        return Promise.reject(e)
      }),
    superFast
      ? (new Promise(() => {}) as any as Promise<RunCommandResult>)
      : ((isTabOpenForSelectWindow ? new Promise(() => {}) : infiniteCheckHeartBeat()) as any as Promise<RunCommandResult>)
  ])
}

async function runWithRetryOnLostHeartBeat(command: Command): Promise<RunCommandResult> {
  const runWithHeartBeatRetry = retry(runWithHeartBeat, {
    timeout: getCommandTimeout(command),
    shouldRetry: (e) => {
      log('runWithHeartBeatRetry - shouldRetry', e.message)
      return !!e && !!e.message && e.message.indexOf('lost heart beat when running command') !== -1
    },
    retryInterval: (retryCount, lastRetryInterval) => {
      return Math.max(1 * 1000, Math.min(5 * 1000, lastRetryInterval * 1.2))
    }
  })

  const superFast = (command.extra?.superFast && !['open'].includes(command.cmd)) || false
  console.log('2b. runWithRetryOnLostHeartBeat:>> superFast', superFast)

  const result = await runWithHeartBeatRetry(command)

  const hasOnDownloadCmd = command.extra?.hasOnDownloadCmd

  // TODO: it takes some considerable amount of time in case of 'click' command, try to optimize it
  if (hasOnDownloadCmd && shouldWaitForDownloadAfterRun(command)) {
    console.log('waiting for download:>>')
    // Note: wait for download to either be create or completed
    await ipc.ask('PANEL_WAIT_FOR_ANY_DOWNLOAD', {})
  }

  // log('before PANEL_WAIT_FOR_ANY_DOWNLOAD')
  // await ipc.ask('PANEL_WAIT_FOR_ANY_DOWNLOAD', {})
  // log('after PANEL_WAIT_FOR_ANY_DOWNLOAD')

  const state: ExtensionState = await getState()

  try {
    // Note: use bg to set pageUrl, so that we can be sure that this `pageUrl` is 100% correct
    const tab = await Ext.tabs.get(state.tabIds.toPlay)
    return { ...result, pageUrl: tab.url }
  } catch (e) {
    log.error('Error in fetching play tab url')
    return result
  }
}

type PreparePlayTabIntermediateResult = {
  tab: chrome.tabs.Tab
  shouldSkipCommandRun: boolean
  hasOpenedUrl: boolean
}

async function openNewUrlInPlayTab(command: Command, startPageLoadCountDown: () => void): Promise<PreparePlayTabIntermediateResult> {
  const { cmd, target, value } = command
  const [isOpenCommand, shouldSkipCommandRun, url] = (() => {
    if (cmd === 'open' || cmd === 'openBrowser') {
      return [true, false, target]
    }

    if (cmd === 'selectWindow' && target && target.toLowerCase().trim() === 'tab=open') {
      return [true, true, value]
    }

    return [false, false, null]
  })()

  if (!isOpenCommand) {
    // Reached whenever the play tab has no content script to run this command
    // in — most often a page that was already open before Ui.Vision started
    // (or before its last update), since only a page load injects one.
    throw new Error(
      'Error #101: Ui.Vision is not connected to a browser tab. If the page was already open before Ui.Vision started, reload it (F5), or begin the macro with an "open" command.'
    )
  }

  startPageLoadCountDown()
  if (cmd === 'openBrowser') {
    return getPlayTabOpenB(url! as string).then(
      (tab: chrome.tabs.Tab) => ({ tab, shouldSkipCommandRun, hasOpenedUrl: true }) as PreparePlayTabIntermediateResult
    )
  } else {
    return getPlayTab(url! as string).then(
      (tab: chrome.tabs.Tab) => ({ tab, shouldSkipCommandRun, hasOpenedUrl: true }) as PreparePlayTabIntermediateResult
    )
  }
}

// Cap for heart beats that a retry loop depends on. The handler in the page is
// a no-op, so a live content script answers in single-digit milliseconds; the
// cap only matters when the page cannot answer at all, and it costs nothing
// when it does (the timer is cleared on the answer).
const CS_ALIVE_TIMEOUT = 3000

function preparePlayTabIPC(
  command: Command,
  tab: chrome.tabs.Tab,
  startCountDown: () => void,
  stopCountDown: () => void
): Promise<PreparePlayTabIntermediateResult> {
  return ipc
    .ask('PANEL_CS_IPC_READY', {
      tabId: tab.id!,
      timeout: 100
    })
    .then(
      () => {
        // A cache hit only proves that a content script once registered for
        // this tab id — the entry outlives the script in the page. That is no
        // longer a problem to probe for here: the heart beat below now fails
        // in milliseconds when the receiving end is gone (see ipcBg.ask in
        // common/ipc/ipc_bg_cs.js), and ensurePlayTabIPC reloads the page on
        // exactly that error. Probing first would cost a round trip per open
        // and would misjudge a page whose main thread is briefly blocked.
        return { tab, hasOpenedUrl: false } as PreparePlayTabIntermediateResult
      },
      () => {
        return openNewUrlInPlayTab(command, startCountDown)
      }
    )
    .then(({ tab, hasOpenedUrl, shouldSkipCommandRun }: PreparePlayTabIntermediateResult) => {
      // For an open-like command that has NOT yet navigated, this heart beat
      // only decides WHERE the open runs: a live content script gets the
      // command, a dead one means we load the URL directly. A ZOMBIE page —
      // registered in the ipc cache but too blocked/throttled to ever answer
      // (real case: the play tab still held the previous demo's game, a heavy
      // canvas loop in a background tab) — used to eat the ENTIRE page-load
      // budget here, so open died with #230 without ever navigating. The old
      // page now gets CS_ALIVE_TIMEOUT to prove it is alive; after a
      // navigation (hasOpenedUrl) the heart beat IS the page-load wait and
      // keeps the full budget.
      const capForOpen = isOpenLikeCommand(command) && !hasOpenedUrl
      return callPlayTab({
        command: 'HEART_BEAT',
        args: '',
        tabIpcTimeout: capForOpen ? CS_ALIVE_TIMEOUT : getTimeoutPageLoad(command)
      }).then(
        () => {
          stopCountDown()
          return { tab, hasOpenedUrl, shouldSkipCommandRun }
        },
        (e: Error) => {
          if (!capForOpen || !/timeout/.test(String(e && e.message))) {
            return Promise.reject(e)
          }
          // zombie old page: load the URL directly (same recovery the
          // dead-content-script path takes), then wait for the NEW page with
          // the full page-load budget
          return openNewUrlInPlayTab(command, startCountDown).then((r) =>
            callPlayTab({
              command: 'HEART_BEAT',
              args: '',
              tabIpcTimeout: getTimeoutPageLoad(command)
            }).then(() => {
              stopCountDown()
              return r
            })
          )
        }
      )
    })
}

function ensurePlayTabIPC(
  command: Command,
  tab: chrome.tabs.Tab,
  startCountDown: () => void,
  stopCountDown: () => void
): Promise<PreparePlayTabIntermediateResult> {
  // Note: in case the playing tab exists but not has a broken page, and is not reachable by tabs.sendMessage
  // We should try to run open command again if any
  let timeout = getTimeoutPageLoad(command)
  return withTimeout(timeout, async () => {
    try {
      return await preparePlayTabIPC(command, tab, startCountDown, stopCountDown)
    } catch (err) {
      const e = err as Error

      if (!/Could not establish connection/.test(e.message)) {
        return Promise.reject(e)
      }

      // The play tab has no content script answering. For 'open' the recovery
      // is to load the URL there, which is the command itself. Anything else
      // has nothing to run in and ends at #101 — but retry once first: a
      // content script that has just reconnected attaches its listener a beat
      // after the background marks its ipc available (RECONNECT in
      // common/ipc/ipc_bg_cs.js enables the cache entry before answering), and
      // that gap must not cost the user a failed macro. Failure path only.
      if (!isOpenLikeCommand(command)) {
        await delay(() => {}, 300)

        try {
          return await preparePlayTabIPC(command, tab, startCountDown, stopCountDown)
        } catch (e2) {
          return await openNewUrlInPlayTab(command, startCountDown)
        }
      }

      const newTabResult = await openNewUrlInPlayTab(command, startCountDown)
      return await preparePlayTabIPC(command, newTabResult.tab, startCountDown, stopCountDown)
    }
  }).catch((e) => {
    if (/withTimeout/.test(e.message)) {
      throw new Error(`Ui.Vision fails to open this url`)
    }

    if (e.message === 'timeout') {
      throw new Error(`Error #230: Page load ${timeout / 1000} seconds time out (the play tab never answered)`)
    }

    throw e
  })
}

function createCountDown(timeout: number): [() => void, () => void] {
  let stopPageLoadCountDown: () => void = () => {}
  const startPageLoadCountDown = () => {
    stopPageLoadCountDown()
    stopPageLoadCountDown = startSendingTimeoutStatus(timeout)
  }

  return [startPageLoadCountDown, stopPageLoadCountDown]
}

function isChromeSpecialPage(url: string): boolean {
  return url.startsWith('chrome://') || url.startsWith('chrome-error://') || url.startsWith('edge://')
}

// 'open' / 'openBrowser' are the only commands whose whole job is to bring up
// a page, so they are also the only ones that may legitimately start on a tab
// that cannot run a content script.
function isOpenLikeCommand(command: Command): boolean {
  return command.cmd === 'open' || command.cmd === 'openBrowser'
}

function isExtensionPage(url?: string): boolean {
  return !!url && /^(chrome|moz|edge)-extension:/i.test(url)
}

// Can a content script possibly live in this tab? Only pages the extension may
// inject into qualify. Everything else — no play tab yet, browser-internal
// pages (Firefox starts on about:newtab, chrome://…, edge://…), extension
// pages — can never answer an IPC probe, so waiting for one there only burns
// the page-load timeout. Note this replaces two URL blacklists that both
// missed about:newtab, the page a freshly started Firefox sits on.
function canHostContentScript(url?: string): boolean {
  return !!url && /^(https?|file|ftp):/i.test(url)
}

function waitForPageLoadComplete(tab: chrome.tabs.Tab): Promise<boolean> {
  // Poll the tab's own load state instead of injecting a script: script
  // injection is not possible while the tab is still on a chrome:// or
  // chrome-error:// page, which made this wait spin until the page-load
  // timeout (Error #230) when a macro started on e.g. chrome://extensions/
  return new Promise((resolve, reject) => {
    const timeout = 60 * 1000
    const interval = 300
    let elapsed = 0
    const timer = setInterval(() => {
      elapsed += interval
      if (elapsed > timeout) {
        clearInterval(timer)
        return reject(new Error('timeout'))
      }

      Ext.tabs
        .get(tab.id)
        .then((t: chrome.tabs.Tab) => {
          // done once the tab left the special page and finished loading
          if (t && t.status === 'complete' && t.url && !isChromeSpecialPage(t.url)) {
            clearInterval(timer)
            resolve(true)
          }
        })
        .catch((e: any) => {
          // tab gone — no point in polling on
          clearInterval(timer)
          reject(new Error('E231: Page load error'))
        })
    }, interval)
  })
}

function preparePlayTab(command: Command): Promise<boolean> {
  const [startPageLoadCountDown, stopPageLoadCountDown] = createCountDown(getTimeoutPageLoad(command))
  console.log('preparePlayTab:>> command:>>', command)

  // `selectWindow tab=open` must NOT be prepared against the current play
  // tab: the bg handler creates a brand new tab itself (and waits for its DOM
  // there). Preparing here meant that whenever the current tab's content
  // script did not answer PANEL_CS_IPC_READY within 100ms, the recovery path
  // (openNewUrlInPlayTab) NAVIGATED the play tab to the URL and set
  // shouldSkipCommandRun — so the real command never ran and no new tab was
  // created. DemoTabs then ended with a single tab instead of three.
  if (command.cmd === 'selectWindow' && /^\s*tab=open\s*$/i.test(command.target || '')) {
    return Promise.resolve(false)
  }

  return (
    getPlayTab()
      // Note: catch any error, and make it run 'getPlayTab(args.url)' instead
      .catch((e: Error) => ({ id: -1 }) as chrome.tabs.Tab)
      .then((tab: chrome.tabs.Tab) => {
        // to check if the playTab window is closed
        const windowId = tab.windowId
        // the getPlayTab fallback tab ({ id: -1 }) has no windowId; calling
        // windows.get(undefined) throws "No matching signature" — skip the
        // window-closed check and let the !tab.url branch below reopen the page
        if (typeof windowId !== 'number' || windowId < 0) {
          return tab
        }
        // check if window is closed
        return Ext.windows.get(windowId, { populate: true }).then((win: any) => {
          // when window is closed, it will return a popup window
          if (
            win &&
            win.type == 'popup' &&
            win.tabs.length === 1 &&
            (win.tabs[0].url.startsWith(`chrome-extension://${Ext.runtime.id}`) || win.tabs[0].url.match(/moz-extension:\/\/[a-z0-9-]+\//))
          ) {
            throw new Error('E530: No browser open. Please close the IDE and then start the browser.')
          }
          return tab
        })
      })
      .then((tab: chrome.tabs.Tab) => {
        // log('after first getPlayTab', tab)

        const ipcTimeout = getIpcTimeout(command)
        const timeoutPromise = new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error(`Error #230: Page load ${ipcTimeout / 1000} seconds time out (the tab never finished loading)`))
          }, ipcTimeout)
        })

        // `open` on a tab that can never host a content script: no play tab yet
        // ({ id: -1 } below), a browser-internal page, an extension page. This
        // is the "macro hangs at open" case — probing such a tab for a content
        // script fails, and every wait on the recovery path that follows is one
        // page-load timeout long, so the run died 60s later with Error #230.
        // Loading the URL into a real tab and waiting for it IS the open
        // command, so go straight there.
        if (isOpenLikeCommand(command) && !canHostContentScript(tab.url)) {
          // an extension page (the IDE window, or the side panel opened as a
          // tab) must not be navigated away — drop it and open a fresh tab
          const pTarget: Promise<void> = isExtensionPage(tab.url)
            ? updateState((state) => ({ ...state, tabIds: { ...state.tabIds, toPlay: null } }))
            : Promise.resolve()

          const openNewURLPromise = pTarget
            .then(() => openNewUrlInPlayTab(command, startPageLoadCountDown))
            .then((res: PreparePlayTabIntermediateResult) => waitForPageLoadComplete(res.tab))

          return Promise.race([openNewURLPromise, timeoutPromise.then(() => false)])
        }

        // On Firefox, it does get ipc from "about:blank", but somehow the connection is not good
        // it's always reconnecting. so instead of trying to run command on "about:blank",
        // redirect it to meaningful url
        const nonresponsiveFirefoxURLs = ['about:home', 'about:blank', 'about:config', 'about:debugging']

        // if tab.url starts with any of the nonresponsiveFirefoxURLs
        // (tab.url is undefined for the { id: -1 } fallback — guard, or this
        // throws before the !tab.url branch below can handle that case)
        if (Ext.isFirefox() && tab.url && nonresponsiveFirefoxURLs.some((url) => tab.url!.startsWith(url))) {
          // must wait on the tab returned by openNewUrlInPlayTab — on a fresh first
          // run `tab` is the { id: -1 } fallback and polling it throws E231
          const openNewURLPromise = openNewUrlInPlayTab(command, startPageLoadCountDown).then((res) => waitForPageLoadComplete(res.tab))
          return Promise.race([openNewURLPromise, timeoutPromise.then(() => false)])
        }

        // For chrome special URLs like "chrome://extensions/", "chrome://settings/" etc,
        // if command is "open", we should open it in the same tab
        // and wait for it to be ready
        // in some uncertain cases url property in tab object is turned out not to be available
        if (!tab.url || isChromeSpecialPage(tab.url!)) {
          // must wait on the tab returned by openNewUrlInPlayTab — on a fresh first
          // run `tab` is the { id: -1 } fallback and polling it throws E231
          const openNewURLPromise = openNewUrlInPlayTab(command, startPageLoadCountDown).then((res) => waitForPageLoadComplete(res.tab))
          return Promise.race([openNewURLPromise, timeoutPromise.then(() => false)])
        }

        return ensurePlayTabIPC(command, tab, startPageLoadCountDown, stopPageLoadCountDown).then(
          ({ tab, hasOpenedUrl, shouldSkipCommandRun }) => {
            // const p = args.shouldNotActivateTab ? Promise.resolve() : activateTab(tab.id, true)
            const p = Promise.resolve()

            // Note: wait for tab to confirm it has loaded
            return p
              .then(() =>
                ipc.ask('PANEL_CS_IPC_READY', {
                  tabId: tab.id!,
                  timeout: 6000 * 10
                })
              )
              .then(async () => {
                if (hasOpenedUrl) {
                  await bestEffortPlayTabCall({
                    command: 'MARK_NO_COMMANDS_YET',
                    args: {},
                    ipcCallTimeout: C.CS_IPC_TIMEOUT
                  })
                }

                await bestEffortPlayTabCall({
                  command: 'SET_STATUS',
                  args: { status: C.CONTENT_SCRIPT_STATUS.PLAYING },
                  ipcCallTimeout: C.CS_IPC_TIMEOUT
                })
              })
              .then(() => shouldSkipCommandRun)
          }
        )
      })
  )
}
