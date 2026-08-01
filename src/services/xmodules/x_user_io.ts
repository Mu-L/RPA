import { XModule, XModuleTypes } from './common'
import { getNativeXYAPI, NativeXYAPI } from '../xy'
import { singletonGetter } from '../../common/ts_utils'

export class XUserIO extends XModule<NativeXYAPI> {
  getName (): string {
    return XModuleTypes.XUserIO
  }

  getAPI (): NativeXYAPI {
    return getNativeXYAPI()
  }

  initConfig () {
    return this.getConfig()
  }

  sanityCheck (): Promise<boolean> {
    return Promise.all([
      this.getConfig(),
      this.getAPI().getVersion()
        .then(
          () => this.getAPI(),
          () => this.getAPI().reconnect()
        )
        .catch(e => {
          throw new Error('Error #301: RealUser Simulation XModule is not installed yet')
        })
    ])
    .then(() => true)
  }

  checkUpdate (): Promise<string> {
    return Promise.reject(new Error('checkUpdate is not implemented yet'))
	}

  checkUpdateLink (modVersion: string, extVersion: string): string {
    return `https://go.ui.vision/?help=xclick_updatecheck&xversion=${modVersion}&kantuversion=${extVersion}`
  }

  downloadLink (): string {
    return 'https://go.ui.vision/?help=xclick_download'
  }

  infoLink (): string {
    return 'https://go.ui.vision/?help=xclick'
  }
}

export const getXUserIO = singletonGetter(() => {
  return new XUserIO()
})
