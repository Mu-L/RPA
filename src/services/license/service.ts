import { Feature, ILicenseService, LegacyXModuleStatus, LicenseInfo, LicenseType } from './types'
import * as HttpAPI from '@/services/api/http_api'
import config from '@/config'

export type LicenseServiceParams = {
  getLegacyXModuleStatus: () => LegacyXModuleStatus;
  setLegacyXModuleStatus: (status: LegacyXModuleStatus) => Promise<void>;
  getVersion: () => Promise<string>;
  save: (license: LicenseInfo) => Promise<void>;
  read: () => Promise<LicenseInfo | null>;
}

export class LicenseService implements ILicenseService {
  static StorageKey = 'a9t9'

  private license: LicenseInfo | null = null

  private get legacyXModuleStatus (): LegacyXModuleStatus {
    return this.params.getLegacyXModuleStatus()
  }

  constructor (private params: LicenseServiceParams) {
    this.getLatestInfo()
  }

  checkLicense (licenseKey: string): Promise<LicenseInfo> {
    return this.params.getVersion().then(version => {
      return HttpAPI.checkLicense({
        licenseKey,
        version
      })
    })
    .then(license => {
      // Only persist valid license
      if (license.status === 'key_not_found') {
        return license
      }

      this.license = license

      return Promise.all([
        this.params.save(license),
        this.params.setLegacyXModuleStatus('checked_by_remote')
      ])
      .then(() => license)
    })
  }

  recheckLicenseIfPossible (): Promise<boolean> {
    if (this.legacyXModuleStatus !== 'checked_by_remote' || !this.license) {
      return Promise.resolve(false)
    }

    return this.checkLicense(this.license?.licenseKey).then(() => true)
  }

  getLatestInfo (): Promise<LicenseInfo | null> {
    return Promise.all([
      this.params.read()
    ])
    .then(tuple => {
      this.license = tuple[0]
      return tuple[0]
    })
  }

  // Ui.Vision is totally free since 2026-07: every feature is available to
  // everyone. The license service remains as the single place feature gates
  // ask, but it now always answers "allowed" — the license-key UI and the
  // "get a license" upsell links were removed together with this change.
  canPerform (feature: Feature): boolean {
    return true
  }

  isProLicense (): boolean {
    return true
  }

  isPersonalLicense (): boolean {
    return false
  }

  isPlayerLicense (): boolean {
    return false
  }

  hasNoLicense (): boolean {
    return false
  }

  isLicenseExpired (): boolean {
    return false
  }

  getEditionName (): string {
    if (this.legacyXModuleStatus === 'checked_by_remote' && this.license?.status === 'on') {
      return this.license.name
    }

    switch (this.legacyXModuleStatus) {
      case 'free':
        return 'Personal Edition'

      case 'pro':
        return 'PRO Edition'

      case 'unregistered':
      case 'checked_by_remote':
      default:
        return 'Free Edition'
    }
  }

  getUpgradeUrl (): string {
    if (this.legacyXModuleStatus === 'checked_by_remote' && this.license?.status === 'on') {
      return this.license.upgradeUrl
    }

    switch (this.legacyXModuleStatus) {
      case 'free':
        return config.xmodulesLimit.free.upgradeUrl

      case 'pro':
        return config.xmodulesLimit.pro.upgradeUrl

      case 'unregistered':
      case 'checked_by_remote':
      default:
        return config.xmodulesLimit.unregistered.upgradeUrl
    }
  }

  private convertToLegacyStatus (): LegacyXModuleStatus {
      if (this.legacyXModuleStatus && this.legacyXModuleStatus !== 'checked_by_remote') {
        return this.legacyXModuleStatus
      }

      if (this.license?.status !== 'on') {
        return 'unregistered'
      }

      switch (this.license.type) {
        case LicenseType.Player:
        case LicenseType.Enterprise:
        case LicenseType.Pro:
          return 'pro'

        case LicenseType.Personal:
          return 'free'
      }
  }
}
