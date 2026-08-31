import { useTheoryStore } from './theory'
import { useProgressionStore } from './progression'

/**
 * Actions that span the theory and progression stores.
 *
 * `chordQualityId` and the progression playhead compete for the same thing —
 * which chord the neck describes — and the playhead used to win silently, so
 * picking a quality with a step focused changed the URL and nothing else.
 * Whichever the player touched last should win.
 *
 * This lives outside both stores because `progression` already imports
 * `theory`; a rule reaching the other way from inside `theory` would close an
 * import cycle. Only components import this — see `store/invalidation.ts` for
 * the same shape applied to invalidation.
 */

/**
 * Choose a chord quality, releasing the progression playhead so the choice is
 * actually visible. Clearing the quality (`null`) leaves the playhead alone:
 * that means "stop overriding", not "take over".
 */
export function chooseChordQuality(id: string | null): void {
  if (id !== null) useProgressionStore.getState().focusStep(null)
  useTheoryStore.getState().setChordQualityId(id)
}
