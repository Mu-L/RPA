import { UnlimitedCounter } from '@/common/counter/counter'
import { getOcrCommandCounter } from '@/services/ocr/command_counter'

// None of these are limits any more (2026-07-26 — the licence caps were
// retired). They are kept because things other than limiting read them:
//   xCmdCounter   — "is this the first X command of the run?" drives hiding
//                   and restoring the download bar, which would otherwise sit
//                   over the screen coordinates XClick works in
//   ocrCmdCounter — persists a per-day conversion count (storage-backed)
//   proxyCounter  — reset/incremented by the players alongside the others
export const xCmdCounter = new UnlimitedCounter()

export const proxyCounter = new UnlimitedCounter()

export const ocrCmdCounter = getOcrCommandCounter({ initial: 0 })
