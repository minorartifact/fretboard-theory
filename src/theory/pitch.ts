import type { PitchClass, ScaleDef, SpellingPreference } from './types'
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

/**
 * Spell `pc` as the given degree of a root that is already spelled: the degree
 * picks the letter, the accidentals bend that letter onto `pc`. Null when that
 * would take more than a double.
 */
export function spellDegreeFrom(
  rootName: string,
  pc: PitchClass,
  degreeLabel: string,
): string | null {
  const degree = parseInt(degreeLabel.replace(/\D/g, ''), 10)
  if (!degree) return null

  const rootLetterIdx = LETTERS.indexOf(rootName[0])
  if (rootLetterIdx === -1) return null

  const targetLetter = LETTERS[(rootLetterIdx + degree - 1) % LETTERS.length]
  const diff = ((pc - NATURAL_PITCH_CLASSES[targetLetter] + 18) % 12) - 6

  if (diff < -2 || diff > 2) return null
  return targetLetter + (diff < 0 ? 'b'.repeat(-diff) : '#'.repeat(diff))
}

export function getPitchNameForDegree(
  pc: PitchClass,
  root: PitchClass,
  degreeLabel: string,
): string {
  const rootName = getPitchName(root, 'auto', root)
  return spellDegreeFrom(rootName, pc, degreeLabel) ?? getPitchName(pc, 'auto', root)
}

/** Every way to write `root` with at most one accidental: D# and Eb, C and B#. */
function rootCandidates(root: PitchClass): string[] {
  const out: string[] = []
  for (const letter of LETTERS) {
    const diff = ((root - NATURAL_PITCH_CLASSES[letter] + 18) % 12) - 6
    if (diff === 0)  out.push(letter)
    if (diff === 1)  out.push(`${letter}#`)
    if (diff === -1) out.push(`${letter}b`)
  }
  return out
}

/** Degrees using 1-7 once each: the scales that owe seven distinct letters. */
function isDiatonicallyLabelled(scale: ScaleDef): boolean {
  return scale.degrees.length === 7 &&
    new Set(scale.degrees.map(d => d.replace(/\D/g, ''))).size === 7
}

function spellScaleFrom(rootName: string, root: PitchClass, scale: ScaleDef): (string | null)[] {
  return scale.pattern.map((semi, i) =>
    spellDegreeFrom(rootName, ((root + semi) % 12) as PitchClass, scale.degrees[i]))
}

/**
 * Accidentals the scale needs from this root, counting the root's own twice so
 * a key that can sit on a natural letter wins a tie. A repeated letter is
 * disqualifying: seven notes over six letters is a collision, not a spelling.
 */
function spellingCost(rootName: string, root: PitchClass, scale: ScaleDef): number {
  const names = spellScaleFrom(rootName, root, scale)
  if (names.some(n => n === null)) return Infinity

  const spelled = names as string[]
  if (isDiatonicallyLabelled(scale) && new Set(spelled.map(n => n[0])).size !== 7) return Infinity

  return spelled.join('').replace(/[A-G]/g, '').length + (rootName.length - 1)
}

/**
 * The letter a key is named by, chosen against the scale rather than the root
 * alone. `ROOT_PREFERS_SHARPS` answers only for major keys, and asking it about
 * a mode spelled aeolian on 1 as Db minor — eight flats, a Bbb in it — where
 * every musician writes C# minor. So spell the scale from each candidate letter
 * and keep the cheapest. Ties are all the one F#/Gb ambiguity that table
 * already settles as sharps; taking sharps here too keeps the key strip honest.
 */
export function spellRoot(root: PitchClass, scale: ScaleDef | null): string {
  if (!scale) return getPitchName(root, 'auto', root)

  return rootCandidates(root)
    .map(name => ({ name, cost: spellingCost(name, root, scale) }))
    .sort((a, b) =>
      a.cost - b.cost ||
      a.name.length - b.name.length ||
      (a.name.includes('#') ? -1 : 1))[0].name
}

/** Which side a key writes the notes that have no degree to spell against. */
function keyUsesSharps(rootName: string, root: PitchClass, scale: ScaleDef | null): boolean {
  const accidentals = rootName + (scale ? spellScaleFrom(rootName, root, scale).join('') : '')
  if (accidentals.includes('#')) return true
  if (accidentals.includes('b')) return false
  return ROOT_PREFERS_SHARPS[root]
}

/**
 * Spell `pc` as it functions in the key of `root`/`scale`. Every note the app
 * shows goes through here: a pitch-class table cannot write Cb, E# or a double,
 * and those are exactly what a correctly spelled key needs.
 */
export function spellInScale(
  pc: PitchClass,
  root: PitchClass,
  scale: ScaleDef | null,
): string {
  const rootName = spellRoot(root, scale)

  if (scale) {
    const idx = scale.pattern.indexOf((pc - root + 12) % 12)
    if (idx !== -1) {
      const spelled = spellDegreeFrom(rootName, pc, scale.degrees[idx])
      if (spelled) return spelled
    }
  }

  return keyUsesSharps(rootName, root, scale) ? SHARP_NAMES[pc] : FLAT_NAMES[pc]
}

/**
 * Spell a chord tone in the key the chord functions in. The chord's own root is
 * spelled against the key first: the ii° of D# minor sits on E#, and rooting it
 * on F prints `F G# B` — a diminished triad with no third in it.
 */
export function spellChordTone(
  pc: PitchClass,
  degreeLabel: string,
  chordRoot: PitchClass,
  keyRoot: PitchClass,
  scale: ScaleDef | null,
): string {
  const chordRootName = spellInScale(chordRoot, keyRoot, scale)
  return spellDegreeFrom(chordRootName, pc, degreeLabel) ?? spellInScale(pc, keyRoot, scale)
}

export function spellChordTones(
  pcs: PitchClass[],
  degreeLabels: string[],
  chordRoot: PitchClass,
  keyRoot: PitchClass,
  scale: ScaleDef | null,
): string[] {
  return pcs.map((pc, i) => spellChordTone(pc, degreeLabels[i], chordRoot, keyRoot, scale))
}
