import storage from '@/common/storage'

// Ui.Vision free AI tier (provider id 'uivision'): pseudonymous install ID and
// friendly messages for the proxy's rate-limit error codes. Server side lives
// in the uivision-ai-proxy repo (see its HANDOVER-extension-work.md).

// chrome.storage.local on purpose (NOT storage.sync): the free-tier quota is
// per-machine, so every machine must have its own ID.
const INSTALL_ID_STORAGE_KEY = 'uivisionAIInstallId'

let cachedInstallId: string | null = null

// 20 chars [A-Za-z0-9] containing the "4499" marker the proxy validates
const generateInstallId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let id = ''
  for (let i = 0; i < 16; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id.slice(0, 8) + '4499' + id.slice(8)
}

export const getInstallId = async (): Promise<string> => {
  if (cachedInstallId) return cachedInstallId
  const stored = await storage.get(INSTALL_ID_STORAGE_KEY)
  if (typeof stored === 'string' && stored.length > 0) {
    cachedInstallId = stored
    return stored
  }
  const id = generateInstallId()
  cachedInstallId = id
  await storage.set(INSTALL_ID_STORAGE_KEY, id)
  return id
}

// getAIProviderConfig() is synchronous, so the ID must be available without
// awaiting. The module-load warm-up below makes that the normal case; the
// generate-first fallback only covers AI use before the warm-up finished, and
// still keeps a previously stored ID once the read returns.
export const getInstallIdSync = (): string => {
  if (cachedInstallId) return cachedInstallId
  const tentative = generateInstallId()
  cachedInstallId = tentative
  storage
    .get(INSTALL_ID_STORAGE_KEY)
    .then((stored: any) => {
      if (typeof stored === 'string' && stored.length > 0) {
        cachedInstallId = stored
      } else {
        return storage.set(INSTALL_ID_STORAGE_KEY, tentative)
      }
    })
    .catch(() => {})
  return tentative
}

getInstallId().catch(() => {})

// True until the user explicitly picked an AI setup (free tier opt-in in the
// AI chat, or a provider chosen in Settings > AI — both save config.aiProvider).
// While pending, nothing may be sent to the free-tier server: the effective
// default is 'uivision', and using it means chat content (incl. screenshots)
// flows through the a9t9 server — that needs the user's one-time consent.
export const isFreeTierConsentPending = (config: { [key: string]: any }): boolean => !config.aiProvider

// Friendly texts for the proxy error codes users should understand (E703
// daily limit, E704/E705 tier unavailable, E706/E710 busy). Returns null for
// everything else so those keep the generic error path.
export const mapUIVisionFreeTierError = (message: string): string | null => {
  if (!message) return null
  if (message.includes('E703')) {
    return 'Daily free AI limit reached. It resets at midnight. Add your own API key in Settings > AI for unlimited use.'
  }
  if (message.includes('E704') || message.includes('E705')) {
    return 'The free AI tier is currently unavailable (beta, no uptime guarantee). Add your own API key in Settings > AI for reliable service.'
  }
  if (message.includes('E706') || message.includes('E710')) {
    return 'The free AI service is busy. Please try again in a moment.'
  }
  return null
}
