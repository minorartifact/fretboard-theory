import type { Tuning, FretboardNote, PitchClass } from './types'

export const TUNINGS: Tuning[] = [
  { id: 'standard',        name: 'Standard (EADGBe)',              openNotes: [40,45,50,55,59,64] },
  { id: 'drop-d',          name: 'Drop D (DADGBe)',                openNotes: [38,45,50,55,59,64] },
  { id: 'half-step-down',  name: 'Eb Standard (Eb Ab Db Gb Bb Eb)',openNotes: [39,44,49,54,58,63] },
  { id: 'open-g',          name: 'Open G (DGDGBd)',                openNotes: [38,43,50,55,59,62] },
  { id: 'open-e',          name: 'Open E (EBE G#Be)',              openNotes: [40,47,52,56,59,64] },
  { id: 'dadgad',          name: 'DADGAD',                         openNotes: [38,45,50,55,57,62] },
]

export const TUNINGS_BY_ID: Record<string, Tuning> =
  Object.fromEntries(TUNINGS.map(t => [t.id, t]))

/**
 * Build a 2-D grid [string][fret] of FretboardNotes.
 * Strings are ordered low-to-high (index 0 = lowest string).
 * Frets range from 0 (open) to `fretCount` inclusive.
 */
export function buildFretboardGrid(tuning: Tuning, fretCount: number): FretboardNote[][] {
  if (!Number.isInteger(fretCount) || fretCount < 0) {
    throw new RangeError('fretCount must be a non-negative integer')
  }

  return tuning.openNotes.map((openMidi, stringIdx) =>
    Array.from({ length: fretCount + 1 }, (_, fret) => {
      const midiNote = openMidi + fret
      return {
        string: stringIdx,
        fret,
        midiNote,
        pitchClass: (midiNote % 12) as PitchClass,
      }
    }),
  )
}

export function getNoteAtPosition(tuning: Tuning, string: number, fret: number): FretboardNote {
  if (!Number.isInteger(string) || string < 0 || string >= tuning.openNotes.length) {
    throw new RangeError(`String index ${string} is outside ${tuning.name}`)
  }
  if (!Number.isInteger(fret) || fret < 0) {
    throw new RangeError('fret must be a non-negative integer')
  }

  const midiNote = tuning.openNotes[string] + fret
  return {
    string,
    fret,
    midiNote,
    pitchClass: (midiNote % 12) as PitchClass,
  }
}
