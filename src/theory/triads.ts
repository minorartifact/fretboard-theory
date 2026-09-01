import type { Chord, PitchClass, Tuning } from './types'
import { CHORD_QUALITIES_BY_ID } from './chords'

/**
 * Triads on three adjacent strings.
 *
 * These are *computed* from the tuning, not looked up. `chordVoicings.ts` reads
 * a database of standard-tuning fingerings and therefore has nothing to offer
 * in any other tuning; a triad is pure geometry, so it works everywhere and for
 * every root.
 *
 * A triad on one string set has exactly three shapes per octave — one for each
 * chord tone taken as the lowest note. That is the whole idea the printed card
 * teaches: the same chord, three shapes, moving up the neck.
 */

/** Which chord tone sits on the lowest string of the set. */
export type Inversion = 'root' | 'first' | 'second'

export const INVERSIONS: Inversion[] = ['root', 'first', 'second']

/** How the three tones stack, low to high, for each inversion. */
const STACK: Record<Inversion, number[]> = {
  root:   [0, 1, 2],
  first:  [1, 2, 0],
  second: [2, 0, 1],
}

/** Three adjacent strings, given low to high. */
export interface StringSet {
  /** String indices, low to high. 0 is the lowest string. */
  strings: [number, number, number]
}

export interface TriadNote {
  string:      number
  fret:        number
  midiNote:    number
  pitchClass:  PitchClass
  /** '1', '3', 'b3', '5', '#5', '2', '4' — whichever this tone is. */
  degreeLabel: string
}

export interface TriadShape {
  inversion: Inversion
  /** Low string first, so `notes[0]` is the bass note the inversion is named for. */
  notes:     [TriadNote, TriadNote, TriadNote]
  lowestFret: number
  /** Reach in frets, open strings included. */
  span:      number
}

/**
 * The four adjacent triples on a six-string neck, low to high.
 * Derived from the tuning's string count so a different instrument still works.
 */
export function stringSets(tuning: Tuning): StringSet[] {
  const n = tuning.openNotes.length
  const sets: StringSet[] = []
  for (let low = 0; low + 2 < n; low++) {
    sets.push({ strings: [low, low + 1, low + 2] })
  }
  return sets
}

/**
 * Every quality reduces to the triad underneath it. A learner comping over
 * Cmaj7 wants the C triad, and without this the 7th chords the progression
 * builder produces by default would have no shapes at all.
 */
export function triadQualityFor(qualityId: string): string | null {
  const q = CHORD_QUALITIES_BY_ID[qualityId]
  if (!q) return null
  const [, ...rest] = q.pattern
  const third = rest.find(s => s === 3 || s === 4 || s === 2 || s === 5)
  const fifth = rest.find(s => s === 6 || s === 7 || s === 8)
  if (third === undefined || fifth === undefined) return null

  if (third === 2) return 'sus2'
  if (third === 5) return 'sus4'
  if (third === 3) return fifth === 6 ? 'dim' : 'min'
  return fifth === 8 ? 'aug' : 'maj'
}

/** The triad a chord reduces to, or null when it has no third-and-fifth to reduce. */
export function triadFor(chord: Chord): Chord | null {
  const id = triadQualityFor(chord.quality.id)
  return id ? { root: chord.root, quality: CHORD_QUALITIES_BY_ID[id] } : null
}

/** Lowest fret ≥ `from` on `string` sounding `pc`, or null past `fretCount`. */
function fretFor(
  tuning: Tuning, string: number, pc: PitchClass, from: number, fretCount: number,
): number | null {
  const open = tuning.openNotes[string]
  const base = ((pc - (open % 12)) % 12 + 12) % 12
  for (let fret = base; fret <= fretCount; fret += 12) {
    if (fret >= from) return fret
  }
  return null
}

interface Options {
  fretCount?: number
  /** Shapes wider than this are dropped as unplayable. */
  maxSpan?:   number
}

/**
 * Every shape of `chord` on `set`, up the neck, one per inversion per octave.
 *
 * The tones are stacked strictly ascending in pitch across the three strings,
 * which is what makes a shape an inversion rather than an arbitrary grip.
 */
export function triadShapes(
  chord: Chord,
  tuning: Tuning,
  set: StringSet,
  { fretCount = 15, maxSpan = 5 }: Options = {},
): TriadShape[] {
  const triad = triadFor(chord)
  if (!triad) return []

  const tones = triad.quality.pattern.map((semi, i) => ({
    pc:    (((chord.root + semi) % 12) + 12) % 12 as PitchClass,
    label: triad.quality.degreeLabels[i],
  }))

  const shapes: TriadShape[] = []

  for (const inversion of INVERSIONS) {
    const order = STACK[inversion].map(i => tones[i])
    const bassString = set.strings[0]

    // Walk the bass tone up the neck; `fretFor` steps an octave at a time, so
    // this visits each occurrence of the shape exactly once.
    let bassFret = fretFor(tuning, bassString, order[0].pc, 0, fretCount)
    while (bassFret !== null) {
      const notes: TriadNote[] = []
      let prevMidi = -1
      let ok = true

      for (let i = 0; i < 3; i++) {
        const string = set.strings[i]
        const open   = tuning.openNotes[string]
        // The bass is fixed by the octave we are on. The other two must sound
        // strictly above it, or the "inversion" is a lie and the bass is not
        // the note it claims to be.
        let fret: number | null = bassFret
        if (i > 0) {
          fret = fretFor(tuning, string, order[i].pc, 0, fretCount)
          while (fret !== null && open + fret <= prevMidi) {
            fret = fretFor(tuning, string, order[i].pc, fret + 1, fretCount)
          }
        }
        if (fret === null) { ok = false; break }
        prevMidi = open + fret
        notes.push({
          string,
          fret,
          midiNote:    open + fret,
          pitchClass:  ((open + fret) % 12) as PitchClass,
          degreeLabel: order[i].label,
        })
      }

      if (ok) {
        // Open strings count towards the reach. Excluding them let an open bass
        // pair with notes ten frets up and still report a span of zero.
        const frets = notes.map(n => n.fret)
        const span  = Math.max(...frets) - Math.min(...frets)
        if (span <= maxSpan) {
          shapes.push({
            inversion,
            notes:      notes as [TriadNote, TriadNote, TriadNote],
            lowestFret: Math.min(...frets),
            span,
          })
        }
      }

      bassFret = fretFor(tuning, bassString, order[0].pc, bassFret + 1, fretCount)
    }
  }

  return shapes.sort((a, b) => a.lowestFret - b.lowestFret || a.inversion.localeCompare(b.inversion))
}
