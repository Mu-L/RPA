// Settings page shell: sticky left nav + one section at a time, driven by
// the location hash (#ai, #ocr, ...) so every section is deep-linkable and
// openSettings('ai') from any extension page lands on the right section.
import React from 'react'
import Ext from '@/common/web_extension'

import GeneralTab from './tabs/general'
import AITab from './tabs/ai'
import OcrTab from './tabs/ocr'
import VisionTab from './tabs/vision'
import XModulesTab from './tabs/xmodules'
import BackupTab from './tabs/backup'
import ApiTab from './tabs/api'
import ReplayTab from './tabs/replay'
import ProxyTab from './tabs/proxy'
import SecurityTab from './tabs/security'

type Section = {
  key: string
  label: string
  hint: string
  component: React.ComponentType<any>
}

type NavGroup = {
  title: string | null
  sections: Section[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: null,
    sections: [
      { key: 'general', label: 'General', hint: 'Side panel, storage mode, color theme', component: GeneralTab },
      { key: 'ai', label: 'AI ✨', hint: 'AI provider, API keys, MCP bridge', component: AITab },
      { key: 'ocr', label: 'OCR', hint: 'Text recognition engines and languages', component: OcrTab },
      { key: 'vision', label: 'Vision', hint: 'Browser vs. desktop automation scope', component: VisionTab },
      { key: 'xmodules', label: 'XModules', hint: 'Native helper apps: file access, real user input', component: XModulesTab },
      { key: 'backup', label: 'Backup', hint: 'Automatic backup reminder, restore from ZIP', component: BackupTab },
      { key: 'api', label: 'API', hint: 'Command line and embedded macro access', component: ApiTab }
    ]
  },
  {
    title: 'Advanced',
    sections: [
      { key: 'replay', label: 'Replay', hint: 'Timeouts, command interval, replay helpers', component: ReplayTab },
      { key: 'proxy', label: 'Proxy', hint: 'Default proxy for the setProxy command', component: ProxyTab },
      { key: 'security', label: 'Security', hint: 'Master password, text encryption', component: SecurityTab }
    ]
  }
]

const ALL_SECTIONS: Section[] = NAV_GROUPS.reduce(
  (acc: Section[], g) => acc.concat(g.sections),
  []
)

const DEFAULT_SECTION = 'general'

const sectionFromHash = (): string => {
  const key = (window.location.hash || '').replace(/^#/, '')
  return ALL_SECTIONS.some(s => s.key === key) ? key : DEFAULT_SECTION
}

type SettingsAppState = {
  active: string
}

export default class SettingsApp extends React.Component<{}, SettingsAppState> {
  state: SettingsAppState = {
    active: sectionFromHash()
  }

  onHashChange = () => {
    this.setState({ active: sectionFromHash() })
  }

  componentDidMount () {
    window.addEventListener('hashchange', this.onHashChange)
  }

  componentWillUnmount () {
    window.removeEventListener('hashchange', this.onHashChange)
  }

  select = (key: string) => {
    // hash drives the state via the hashchange listener
    window.location.hash = key
  }

  render () {
    const active = ALL_SECTIONS.find(s => s.key === this.state.active) || ALL_SECTIONS[0]
    const ActiveComponent = active.component
    const version = (() => {
      try {
        return Ext.runtime.getManifest().version
      } catch (e) {
        return ''
      }
    })()

    return (
      <div className="settings-page">
        <aside className="settings-nav">
          <div className="settings-brand">
            <img src="logo.png" alt="" onError={(e: any) => { e.target.style.display = 'none' }} />
            <div className="settings-brand-text">
              <div className="settings-brand-title">Ui.Vision</div>
              <div className="settings-brand-sub">Settings{version ? ` · v${version}` : ''}</div>
            </div>
          </div>

          {NAV_GROUPS.map((group, i) => (
            <div className="settings-nav-group" key={i}>
              {group.title ? <div className="settings-nav-group-title">{group.title}</div> : null}
              {group.sections.map(s => (
                <a
                  key={s.key}
                  href={'#' + s.key}
                  className={'settings-nav-item' + (s.key === active.key ? ' active' : '')}
                  onClick={(e) => {
                    e.preventDefault()
                    this.select(s.key)
                  }}
                >
                  {s.label}
                </a>
              ))}
            </div>
          ))}
        </aside>

        <main className="settings-content">
          <div className="settings-section">
            <h1 className="settings-section-title">{active.label}</h1>
            <p className="settings-section-hint">{active.hint}</p>
            <ActiveComponent />
          </div>
        </main>
      </div>
    )
  }
}
