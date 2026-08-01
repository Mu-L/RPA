import { CounterOptions, ICounter } from './types'

export class Counter implements ICounter {
  protected n: number = 0
  protected initial: number
  protected getMax:  () => number
  protected onMax:   (current: number, max: number, initial: number) => void

  constructor (options: CounterOptions = {}) {
    const { initial, getMax, onMax } = options

    // No ceiling by default: counters are mostly used to answer "how many so
    // far" / "is this the first one". A limit is opt-in via getMax + onMax.
    this.initial  = initial || 0
    this.getMax   = typeof getMax === 'function' ? getMax : () => Infinity
    this.onMax    = typeof onMax === 'function' ? onMax : () => {}

    this.reset()
  }

  reset (): void {
    this.n = this.initial
  }

  get (): number {
    return this.n
  }

  getMaximum (): number {
    return this.getMax()
  }

  check (): boolean {
    const max = this.getMax()

    if (this.n + 1 > max) {
      this.onMax(this.n, max, this.initial)
      return false
    }

    return true
  }

  inc (): boolean {
    const max = this.getMax()

    if (this.n < max) {
      this.n += 1
      return true
    } else {
      this.onMax(this.n, max, this.initial)
      return false
    }
  }
}

// Explicit name for "counts, never refuses" at the call site. Same as Counter
// with no getMax — the subclass exists so the intent is readable.
export class UnlimitedCounter extends Counter {}
