import type { PitchClass, SpellingPreference } from './types'
import { SHARP_NAMES, FLAT_NAMES, ROOT_PREFERS_SHARPS } from './constants'

const LETTERS = ['C','D','E','F','G','A','B']
const NATURAL_PITCH_CLASSES: Record<string, PitchClass> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

export function transpose(pc: PitchClass, semitones: number): PitchClass {
  return (((pc + semitones) % 12) + 12) % 12 as PitchClass
}

/** Semitone distance from `from` up to `to`, always 0–11. */
export function intervalBetween(from: PitchClass, to: PitchClass): number {
  return (to - from + 12) % 12
}

export function getPitchName(
  pc: PitchClass,
  spelling: SpellingPreference,
  root?: PitchClass,
): string {
  const useSharps =
    spelling === 'sharps' ||
    (spelling === 'auto' && (root === undefined || ROOT_PREFERS_SHARPS[root]))
  return useSharps ? SHARP_NAMES[pc] : FLAT_NAMES[pc]
}

export function parsePitchName(name: string): PitchClass | null {
  const sharp = SHARP_NAMES.indexOf(name)
  if (sharp !== -1) return sharp as PitchClass
  const flat = FLAT_NAMES.indexOf(name)
  if (flat !== -1) return flat as PitchClass

  const match = /^([A-G])([#b]{1,2})$/.exec(name)
  if (!match) return null

  const natural = NATURAL_PITCH_CLASSES[match[1]]
  const accidentals = match[2]
  const offset = [...accidentals].reduce((sum, accidental) => {
    return sum + (accidental === '#' ? 1 : -1)
  }, 0)

  return transpose(natural, offset)
}

export function getPitchNameForDegree(
  pc: PitchClass,
  root: PitchClass,
  degreeLabel: string,
): string {
  const degree = parseInt(degreeLabel.replace(/\D/g, ''), 10)
  if (!degree) return getPitchName(pc, 'auto', root)

  const rootName = getPitchName(root, 'auto', root)
  const rootLetter = rootName[0]
  const rootLetterIdx = LETTERS.indexOf(rootLetter)
  if (rootLetterIdx === -1) return getPitchName(pc, 'auto', root)

  const targetLetter = LETTERS[(rootLetterIdx + degree - 1) % LETTERS.length]
  const naturalPc = NATURAL_PITCH_CLASSES[targetLetter]
  const diff = ((pc - naturalPc + 18) % 12) - 6

  if (diff === -2) return `${targetLetter}bb`
  if (diff === -1) return `${targetLetter}b`
  if (diff === 0) return targetLetter
  if (diff === 1) return `${targetLetter}#`
  if (diff === 2) return `${targetLetter}##`

  return getPitchName(pc, 'auto', root)
}
