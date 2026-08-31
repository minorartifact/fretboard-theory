import { useInteractiveStore, POSITIONS } from './interactive'

/**
 * Cross-store invalidation rules.
 *
 * The stores are independent, but some of their state is only meaningful
 * against state another store owns. Nothing enforces those relationships, and
 * almost every bug this app has had takes the same shape as a result: a
 * selection outliving the thing that gave it meaning, and the neck quietly
 * describing something the rest of the UI no longer agrees with.
 *
 * The rules live here so the whole set is visible at once rather than being
 * rediscovered one bug at a time. `__tests__/storeInvariants.test.ts` drives
 * each of them through the public setters, so a setter that forgets to call one
 * fails there rather than in the browser.
 *
 * Only `interactive` may be imported here: `progression` imports `theory`,
 * which imports this module, so reaching into progression would close an import
 * cycle. Rules that need it stay with their own store — see `songs.loadSong`.
 */

/**
 * A degree selection is stored as semitones of the scale it was picked in, so
 * it means nothing against a different one. Carried over, it left the neck lit
 * and dimmed by degrees the chips no longer showed.
 */
export function invalidateForScaleChange(): void {
  useInteractiveStore.getState().clearIntervals()
}

/**
 * Out-of-window dots sit below the pointer-events floor, so a position window
 * that runs past the end of the neck makes the fretboard inert rather than
 * merely dim.
 */
export function invalidateForFretCountChange(fretCount: number): void {
  const { posIdx, setPosIdx } = useInteractiveStore.getState()
  if (posIdx !== null && (POSITIONS[posIdx]?.hi ?? 0) > fretCount) setPosIdx(null)
}
