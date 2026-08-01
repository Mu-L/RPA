// Settings page entry (options.html) — the ONE settings surface for the
// side panel, the IDE window and the background. A normal browser tab with
// its own lightweight store bootstrap: it hydrates config from storage and
// stays in sync via storage.onChanged, so a setting changed here shows up
// live in the panel/IDE and vice versa. It never registers as the panel
// (no I_AM_PANEL), so recording/playback routing is untouched.
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ConfigProvider } from 'antd'
import en_US from 'antd/lib/locale/en_US'
import 'antd/dist/reset.css'

import { store } from '@/redux'
import storage from '@/common/storage'
import { updateConfigFromStorage } from '@/actions'
import { installGoUivLinkDecorator } from '@/common/uiv_link'
import { getStorageManager } from '@/services/storage'
import { getXFile } from '@/services/xmodules/xfile'
import SettingsApp from './settings_app'
import '@/styles/dark-theme.scss'
import './settings.scss'

// modules/ocr.ts (Show OCR Overlay test) reaches the store via window
window['store'] = store

installGoUivLinkDecorator()

const applyTheme = (useDarkTheme: boolean) => {
  document.documentElement.setAttribute('data-theme', useDarkTheme ? 'dark' : 'light')
}

const container = document.getElementById('root') as HTMLElement
const root = createRoot(container)

// getXFile().getConfig() first, same as the panel's bootstrap: in hard-drive
// mode the storage manager needs the XModule's rootDir before it can list or
// read anything. Failure is fine — browser mode does not use it.
Promise.all([
  storage.get('config'),
  getXFile().getConfig().catch(() => null)
]).then(([storedConfig]: any[]) => {
  const config = storedConfig || {}
  applyTheme(!!config.useDarkTheme)

  // FIRST call of getStorageManager on this page, and it decides the storage
  // strategy for the whole page: without the explicit mode the singleton
  // defaults to XFile, so Backup/Restore would talk to the FileAccess XModule
  // even for users storing macros in the browser — and hang when it is absent.
  getStorageManager(config.storageMode, {
    getConfig: () => (store.getState() as any).config,
    getMaxMacroCount: () => Promise.resolve(Infinity)
  })

  // hydrate WITHOUT writing back: every page persists its FULL config object,
  // so a boot-time write here could clobber keys another page just changed
  store.dispatch(updateConfigFromStorage(config))

  // live sync with the side panel / IDE (same pattern as the side panel)
  storage.addListener((changes: any[]) => {
    const change = (changes || []).find(c => c.key === 'config')
    if (!change || !change.newValue) return

    const current: any = (store.getState() as any).config || {}
    const changedConfig = Object.keys(change.newValue).reduce((acc: any, key: string) => {
      const newVal = change.newValue[key]
      const curVal = current[key]
      const changed = typeof newVal === 'object' && newVal !== null
        ? JSON.stringify(newVal) !== JSON.stringify(curVal)
        : newVal !== curVal
      if (changed) acc[key] = newVal
      return acc
    }, {})

    if (Object.keys(changedConfig).length) {
      store.dispatch(updateConfigFromStorage(changedConfig))
      if ('useDarkTheme' in changedConfig) applyTheme(!!changedConfig.useDarkTheme)
    }
  })

  document.title = 'Ui.Vision Settings'

  root.render(
    <ConfigProvider
      locale={en_US}
      theme={{
        token: {
          borderRadius: 8,
          colorPrimary: '#1a6ce0'
        }
      }}
    >
      <Provider store={store}>
        <SettingsApp />
      </Provider>
    </ConfigProvider>
  )
})
