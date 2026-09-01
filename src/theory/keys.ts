import type { PitchClass } from './types'
import { ROOT_PREFERS_SHARPS } from './constants'
import { getPitchName, getPitchNameForDegree } from './pitch'

/**
 * The twelve major keys clockwise from C, each a fifth above the last. This is
 * the order the circle is drawn in, and also what gives a key its signature:
 * a key's position here *is* its accidental count.
 */
export const CIRCLE_OF_FIFTHS: PitchClass[] = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]

// Accidentals are always written in this order, and a key takes the first n of
// them. Sharps run up in fifths, flats are the same letters backwards.
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
const FLAT_ORDER  = ['B', 'E', 'A', 'D', 'G', 'C', 'F']

export interface KeySignature {
  /** `null` for C major, which carries none. */
  accidental: '#' | 'b' | null
  /** Letters carrying the accidental, in writing order. Empty for C major. */
  notes:      string[]
}

/**
 * The signature of the major key on `root`.
 *
 * Sharp-or-flat comes from `ROOT_PREFERS_SHARPS` rather than a second table, so
 * the wheel can never disagree with the note names the rest of the app spells.
 * F# sits at the bottom of the circle with six of each; the shared preference
 * settles it as six sharps, which is also how a guitarist reads it.
 */
export function getKeySignature(root: PitchClass): KeySignature {
  const i = CIRCLE_OF_FIFTHS.indexOf(root)
  if (i <= 0) return { accidental: null, notes: [] }

  const sharps = ROOT_PREFERS_SHARPS[root]
  const count  = sharps ? i : 12 - i
  if (count === 0) return { accidental: null, notes: [] }

  return {
    accidental: sharps ? '#' : 'b',
    notes:      (sharps ? SHARP_ORDER : FLAT_ORDER).slice(0, count),
  }
}

/** What one segment of the wheel offers: three keys sharing one signature. */
export interface KeyWedge {
  /** Position clockwise from C, 0–11. */
  index:    number
  major:    PitchClass
  /** Relative minor — the sixth degree. */
  minor:    PitchClass
  /** The leading-tone diminished — the seventh. */
  dim:      PitchClass
  signature: KeySignature
}

export function getKeyWedges(): KeyWedge[] {
  return CIRCLE_OF_FIFTHS.map((major, index) => ({
    index,
    major,
    minor:     ((major + 9) % 12) as PitchClass,
    dim:       ((major + 11) % 12) as PitchClass,
    signature: getKeySignature(major),
  }))
}

const GLYPHS = (name: string) => name.replace(/#/g, '♯').replace(/b/g, '♭')

/**
 * Spell a note *against its parent key*, never against its own preference.
 * The relative minor of E major is C# minor, but pitch class 1 on its own
 * prefers Db — reading it in isolation renames a third of the wheel.
 *
 * `degree` is what makes it a spelling rather than a lookup. A key has seven
 * distinct letters, and the sharp/flat tables cannot produce E# or Cb, so
 * F# major came out `F# G# A# B C# D# F` — an F twice, no E, and five sharps
 * under a wedge labelled six. Pass the degree wherever the note has one.
 */
export function spellInKey(pc: PitchClass, keyRoot: PitchClass, degree?: string): string {
  return GLYPHS(degree === undefined
    ? getPitchName(pc, 'auto', keyRoot)
    : getPitchNameForDegree(pc, keyRoot, degree))
}

/** The three rings, outermost first — one mode of the key's seven notes each. */
export type Ring = 'major' | 'minor' | 'dim'

export const RINGS: Ring[] = ['major', 'minor', 'dim']

/** A position on the wheel: which wedge, which ring. */
export interface Cursor {
  index: number
  ring:  Ring
}

/** Every ring is a mode of the same parent major, so they share a signature. */
export const RING_SCALE_ID: Record<Ring, string> = {
  major: 'major',
  minor: 'aeolian',
  dim:   'locrian',
}

/** Semitones each ring's root sits above the parent major. */
const RING_OFFSET: Record<Ring, number> = { major: 0, minor: 9, dim: 11 }

export function ringRoot(wedge: KeyWedge, ring: Ring): PitchClass {
  return ring === 'major' ? wedge.major : ring === 'minor' ? wedge.minor : wedge.dim
}

/** Each ring's root, named as a degree of the parent major, so it spells right. */
const RING_DEGREE: Record<Ring, string> = { major: '1', minor: '6', dim: '7' }

/** How a wedge reads on the card: C, am, b°. */
export function ringLabel(wedge: KeyWedge, ring: Ring): string {
  const name = spellInKey(ringRoot(wedge, ring), wedge.major, RING_DEGREE[ring])
  return ring === 'major' ? name : ring === 'minor' ? `${name}m` : `${name}\u00b0`
}

/**
 * Which wedge the app is currently sitting in, or `null` when the scale is not
 * one a key signature can describe. Lydian and the pentatonics have no wedge,
 * and lighting an approximate one would misreport the neck.
 */
export function cursorForKey(root: PitchClass, scaleId: string | undefined): Cursor | null {
  const ring = RINGS.find(r => RING_SCALE_ID[r] === scaleId)
  if (!ring) return null
  const parent = ((root - RING_OFFSET[ring] + 12) % 12) as PitchClass
  const index  = CIRCLE_OF_FIFTHS.indexOf(parent)
  return index < 0 ? null : { index, ring }
}
