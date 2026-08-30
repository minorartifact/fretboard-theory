import type { ChordQuality, Chord, PitchClass } from './types'
import type { ScaleDef } from './types'
import { SEMITONE_TO_DEGREE } from './constants'

export const CHORD_QUALITIES: ChordQuality[] = [
  // ── Triads ───────────────────────────────────────────────────────────────
  { id: 'maj',     name: 'Major',          symbol: '',      pattern: [0,4,7],    degreeLabels: ['1','3','5'] },
  { id: 'min',     name: 'Minor',          symbol: 'm',     pattern: [0,3,7],    degreeLabels: ['1','b3','5'] },
  { id: 'dim',     name: 'Diminished',     symbol: '°',     pattern: [0,3,6],    degreeLabels: ['1','b3','b5'] },
  { id: 'aug',     name: 'Augmented',      symbol: '+',     pattern: [0,4,8],    degreeLabels: ['1','3','#5'] },
  { id: 'sus2',    name: 'Suspended 2',    symbol: 'sus2',  pattern: [0,2,7],    degreeLabels: ['1','2','5'] },
  { id: 'sus4',    name: 'Suspended 4',    symbol: 'sus4',  pattern: [0,5,7],    degreeLabels: ['1','4','5'] },

  // ── Seventh chords ───────────────────────────────────────────────────────
  { id: 'maj7',     name: 'Major 7',          symbol: 'maj7',  pattern: [0,4,7,11],  degreeLabels: ['1','3','5','7'] },
  { id: 'dom7',     name: 'Dominant 7',       symbol: '7',     pattern: [0,4,7,10],  degreeLabels: ['1','3','5','b7'] },
  { id: 'min7',     name: 'Minor 7',          symbol: 'm7',    pattern: [0,3,7,10],  degreeLabels: ['1','b3','5','b7'] },
  { id: 'min-maj7', name: 'Minor-Major 7',    symbol: 'mMaj7', pattern: [0,3,7,11],  degreeLabels: ['1','b3','5','7'] },
  { id: 'dim7',     name: 'Diminished 7',     symbol: '°7',    pattern: [0,3,6,9],   degreeLabels: ['1','b3','b5','bb7'] },
  { id: 'm7b5',     name: 'Half-Diminished 7',symbol: 'ø7',    pattern: [0,3,6,10],  degreeLabels: ['1','b3','b5','b7'] },
  { id: 'aug-maj7', name: 'Augmented Major 7',symbol: '+maj7', pattern: [0,4,8,11],  degreeLabels: ['1','3','#5','7'] },
  { id: 'aug7',     name: 'Augmented 7',      symbol: '+7',    pattern: [0,4,8,10],  degreeLabels: ['1','3','#5','b7'] },

  // ── Extended (pitch-class reduced) ───────────────────────────────────────
  { id: 'dom9',  name: 'Dominant 9',  symbol: '9',     pattern: [0,4,7,10,2],   degreeLabels: ['1','3','5','b7','9'] },
  { id: 'maj9',  name: 'Major 9',     symbol: 'maj9',  pattern: [0,4,7,11,2],   degreeLabels: ['1','3','5','7','9'] },
  { id: 'min9',  name: 'Minor 9',     symbol: 'm9',    pattern: [0,3,7,10,2],   degreeLabels: ['1','b3','5','b7','9'] },
]

export const CHORD_QUALITIES_BY_ID: Record<string, ChordQuality> =
  Object.fromEntries(CHORD_QUALITIES.map(q => [q.id, q]))

function unknownChordQuality(pattern: number[]): ChordQuality {
  return {
    id: 'unknown',
    name: 'Unknown',
    symbol: '?',
    pattern,
    degreeLabels: pattern.map(offset => SEMITONE_TO_DEGREE[offset] ?? `${offset}`),
  }
}

export function getChordNotes(chord: Chord): PitchClass[] {
  return chord.quality.pattern.map(offset => ((chord.root + offset) % 12) as PitchClass)
}

export function isInChord(pc: PitchClass, chord: Chord): boolean {
  const offset = (pc - chord.root + 12) % 12
  return chord.quality.pattern.includes(offset)
}

/** Returns the degree label for `pc` within `chord`, or null if not a chord tone. */
export function getChordToneLabel(pc: PitchClass, chord: Chord): string | null {
  const offset = (pc - chord.root + 12) % 12
  const idx = chord.quality.pattern.indexOf(offset)
  return idx !== -1 ? chord.quality.degreeLabels[idx] : null
}

export function getChordToneRole(
  pc: PitchClass,
  chord: Chord,
): 'root' | 'chord-third' | 'chord-fifth' | 'chord-seventh' | 'chord-tone' | null {
  const offset = (pc - chord.root + 12) % 12
  const idx = chord.quality.pattern.indexOf(offset)
  if (idx === -1) return null
  const label = chord.quality.degreeLabels[idx]
  const degree = parseInt(label.replace(/\D/g, ''), 10)
  if (label === '1') return 'root'
  if (degree === 3) return 'chord-third'
  if (degree === 5) return 'chord-fifth'
  if (degree === 7) return 'chord-seventh'
  return 'chord-tone'
}

/**
 * Build diatonic 7th chords for every degree of a 7-tone scale.
 * For scales with anything other than 7 tones, returns an empty array.
 */
export function getDiatonicChords(root: PitchClass, scale: ScaleDef): Chord[] {
  const n = scale.pattern.length
  if (n !== 7) return []

  const notes = scale.pattern.map(offset => ((root + offset) % 12) as PitchClass)

  return notes.map((degreeRoot, i) => {
    const third   = notes[(i + 2) % n]
    const fifth   = notes[(i + 4) % n]
    const seventh = notes[(i + 6) % n]

    const t3 = (third   - degreeRoot + 12) % 12
    const t5 = (fifth   - degreeRoot + 12) % 12
    const t7 = (seventh - degreeRoot + 12) % 12

    const pattern = [0, t3, t5, t7]
    return { root: degreeRoot, quality: findChordQuality(pattern) ?? unknownChordQuality(pattern) }
  })
}

/**
 * Returns the secondary dominant (V7) that resolves to the given diatonic degree.
 * The secondary dominant root is a perfect fifth (7 semitones) above the target degree's root.
 */
export function getSecondaryDominant(targetRoot: PitchClass): Chord {
  const secDomRoot = ((targetRoot + 7) % 12) as PitchClass
  return { root: secDomRoot, quality: CHORD_QUALITIES_BY_ID['dom7'] }
}

function findChordQuality(pattern: number[]): ChordQuality | null {
  const match = CHORD_QUALITIES.find(
    q => q.pattern.length === pattern.length && q.pattern.every((p, i) => p === pattern[i]),
  )
  if (match) return match

  return null
}
