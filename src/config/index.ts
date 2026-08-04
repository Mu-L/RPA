import Ext from '../common/web_extension'

const platform = Ext.isFirefox() ? 'firefox' : 'chrome'

export default {
  preinstall: {
    // 9.9.9: the Classic and JS folders moved below one root folder,
    // "Demo and QA Test Scripts", so the tree opens with the user's own
    // macros at the root. Existing installs are re-offered the demos at the
    // new place; the old top-level folders stay until deleted by hand.
    // 9.9.10: the JS demos compose relative clicks from plain anchor images
    // (slider_warmth / draw_toolbar_top) + uiv.offset — existing installs
    // need the re-offer to receive those two new vision images.
    // 9.9.11: Chrome-only demos live in "Browser Vision (Chrome, Edge)";
    // the Core demos use plain DOM input and run on Firefox too, with
    // *Chrome variants for trusted CDP input.
    // 9.9.12: demo csv/vision resources install into the CURRENT storage
    // mode — file-mode installs that took 9.9.11 got the macros but not the
    // images they search for, so the offer must fire once more.
    // 9.9.13: the JS demo set installs on FRESH installs again (folder starts
    // collapsed); the "JS" level is gone — its sub-folders sit directly below
    // "Demo and QA Test Scripts" — and the classic set moved to its own
    // top-level "Demo and QA Test Scripts (Classic)" folder (button-only).
    version: '9.9.13',
    macroFolder: '/'
  },
  nativeMessaging: {
    idleTimeBeforeDisconnect: 1e4 // 10 seconds
  },
  urlAfterUpgrade: 'https://go.ui.vision/?help=k_update',
  urlAfterInstall: 'https://go.ui.vision/?help=k_welcome',
  urlAfterUninstall: 'https://go.ui.vision/?help=k_why',
  performanceLimit: {
    fileCount: Infinity
  },
  xmodulesLimit: {
    unregistered: {
      upgradeUrl: 'https://go.ui.vision/?help=k_xupgradepro'
    },
    free: {
      upgradeUrl: 'https://go.ui.vision/?help=k_xupgradepro'
    },
    pro: {
      upgradeUrl: 'https://go.ui.vision/?help=k_xupgrade_contactsupport'
    }
  },
  xfile: {
    minVersionToReadBigFile: '1.0.10'
  },
  ocr: {
    freeApiEndpoint: 'https://api.ocr.space/parse/image',
    proApi1Endpoint: 'https://apipro1.ocr.space/parse/image',
    proApi2Endpoint: 'https://apipro2.ocr.space/parse/image',

    apiTimeout: 60 * 1000,
    singleApiTimeout: 30 * 1000,
    apiHealthyResponseTime: 20 * 1000,
    resetTime: 24 * 3600 * 1000
  },
  license: {
    api: {
      url: 'https://license1.ocr.space/api/status'
    }
  },
  icons: {
    normal: 'logo38.png',
    inverted: 'inverted_logo_38.png'
  },
  forceMigrationRemedy: false,
  iframePostMessageTimeout: 500,
  ui: {
    commandItemHeight: 35
  },
  commandRunner: {
    sendKeysMaxCharCount: 1000
  },
  executeScript: {
    minimumTimeout: 5000
  }
}
