import type { PitchClass } from './types'
import { intervalBetween } from './pitch'
import { SEMITONE_TO_INTERVAL } from './constants'

/** The 12 chromatic interval offsets, in ascending order. */
export const ALL_INTERVALS: number[] = Array.from({ length: 12 }, (_, i) => i)

/**
 * Pitch classes sitting at each of `semitones` above `anchor`.
 * Offsets outside 0–11 wrap; duplicates collapse.
 */
export function intervalPitchClasses(anchor: PitchClass, semitones: number[]): Set<PitchClass> {
  const out = new Set<PitchClass>()
  for (const semi of semitones) {
    out.add((((anchor + semi) % 12) + 12) % 12 as PitchClass)
  }
  return out
}

/** Short interval label ('P1', 'm3', 'P5', …) from `anchor` up to `pc`. */
export function intervalLabelFrom(anchor: PitchClass, pc: PitchClass): string {
  return SEMITONE_TO_INTERVAL[intervalBetween(anchor, pc)]
}
