import type { PitchClass } from './types'

export const INTERVAL_NAMES = [
  'Unison', 'Minor 2nd', 'Major 2nd', 'Minor 3rd', 'Major 3rd',
  'Perfect 4th', 'Tritone', 'Perfect 5th', 'Minor 6th', 'Major 6th',
  'Minor 7th', 'Major 7th',
] as const

const CHORD_SHAPES = [
  { ivs: [0, 4, 7],     symbol: '',     word: 'Major' },
  { ivs: [0, 3, 7],     symbol: 'm',    word: 'Minor' },
  { ivs: [0, 3, 6],     symbol: '°',    word: 'Diminished' },
  { ivs: [0, 4, 8],     symbol: '+',    word: 'Augmented' },
  { ivs: [0, 2, 7],     symbol: 'sus2', word: 'Suspended 2nd' },
  { ivs: [0, 5, 7],     symbol: 'sus4', word: 'Suspended 4th' },
  { ivs: [0, 4, 7, 11], symbol: 'maj7', word: 'Major 7th' },
  { ivs: [0, 4, 7, 10], symbol: '7',    word: 'Dominant 7th' },
  { ivs: [0, 3, 7, 10], symbol: 'm7',   word: 'Minor 7th' },
  { ivs: [0, 3, 7, 11], symbol: 'mM7',  word: 'Minor-Major 7th' },
  { ivs: [0, 3, 6, 10], symbol: 'ø7',   word: 'Half-Diminished 7th' },
  { ivs: [0, 3, 6, 9],  symbol: '°7',   word: 'Diminished 7th' },
  { ivs: [0, 4, 7, 9],  symbol: '6',    word: 'Major 6th' },
  { ivs: [0, 3, 7, 9],  symbol: 'm6',   word: 'Minor 6th' },
  { ivs: [0, 2, 4, 7],  symbol: 'add9', word: 'Added 9th' },
]

export interface IntervalResult {
  name:      string
  semitones: number
}

export interface ChordResult {
  root:   PitchClass
  symbol: string
  word:   string
}

export function detectInterval(midiA: number, midiB: number): IntervalResult {
  const semitones = Math.abs(midiB - midiA)
  const name = INTERVAL_NAMES[semitones % 12]
  const compound = semitones >= 12 ? ' + octave' : ''
  return { name: name + compound, semitones }
}

export function detectChord(pcs: PitchClass[]): ChordResult | null {
  const uniq = [...new Set(pcs)]
  if (uniq.length < 3) return null
  for (const r of uniq) {
    const ivs = [...new Set(uniq.map(p => ((p - r + 12) % 12)))].sort((a, b) => a - b)
    for (const shape of CHORD_SHAPES) {
      if (shape.ivs.length === ivs.length && shape.ivs.every((v, i) => v === ivs[i])) {
        return { root: r as PitchClass, symbol: shape.symbol, word: shape.word }
      }
    }
  }
  return null
}
