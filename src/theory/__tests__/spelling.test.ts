import { describe, it, expect } from 'vitest'
import { SCALES, getScaleNotes } from '../scales'
import { CHORD_QUALITIES, getChordNotes } from '../chords'
import { getPitchNameForDegree } from '../pitch'
import type { PitchClass } from '../types'

/**
 * Spelling is the thing this app gets judged on, and it has already been wrong
 * once: the keys wheel rendered F# major as `F# G# A# B C# D# F`, an F twice and
 * no E, because it read a pitch class out of a table instead of spelling against
 * the degree. These pin the property that catches that whole class.
 */

const ROOTS = Array.from({ length: 12 }, (_, i) => i as PitchClass)

/** A scale is diatonically labelled when its degrees use 1–7 once each. */
const isDiatonicallyLabelled = (degrees: string[]) =>
  degrees.length === 7 && new Set(degrees.map(d => d.replace(/\D/g, ''))).size === 7

describe('scale spelling', () => {
  it('gives every diatonically-labelled scale seven distinct letters, in every key', () => {
    const wrong: string[] = []
    for (const scale of SCALES.filter(s => isDiatonicallyLabelled(s.degrees))) {
      for (const root of ROOTS) {
        const names = getScaleNotes(root, scale)
          .map((pc, i) => getPitchNameForDegree(pc, root, scale.degrees[i]))
        if (new Set(names.map(n => n[0])).size !== 7) {
          wrong.push(`${scale.id} on root ${root}: ${names.join(' ')}`)
        }
      }
    }
    expect(wrong).toEqual([])
  })

  it('never spells two notes of a scale with the same name', () => {
    const wrong: string[] = []
    for (const scale of SCALES.filter(s => isDiatonicallyLabelled(s.degrees))) {
      for (const root of ROOTS) {
        const names = getScaleNotes(root, scale)
          .map((pc, i) => getPitchNameForDegree(pc, root, scale.degrees[i]))
        if (new Set(names).size !== names.length) wrong.push(`${scale.id} on root ${root}: ${names.join(' ')}`)
      }
    }
    expect(wrong).toEqual([])
  })

  // `altered` is the one 7-note scale labelled by chord function rather than by
  // degree — 1 b2 #2 3 b5 #5 b7, the alterations of a dominant. It repeats
  // letters on purpose, so it is excluded above rather than silently passing.
  it('has exactly one scale that is not diatonically labelled, and it is the altered scale', () => {
    const odd = SCALES.filter(s => s.pattern.length === 7 && !isDiatonicallyLabelled(s.degrees))
    expect(odd.map(s => s.id)).toEqual(['altered'])
  })
})

describe('chord spelling', () => {
  it('never spells two tones of a chord with the same name, in any key', () => {
    const wrong: string[] = []
    for (const quality of CHORD_QUALITIES) {
      for (const root of ROOTS) {
        const names = getChordNotes({ root, quality })
          .map((pc, i) => getPitchNameForDegree(pc, root, quality.degreeLabels[i]))
        if (new Set(names).size !== names.length) {
          wrong.push(`${quality.id} on root ${root}: ${names.join(' ')}`)
        }
      }
    }
    expect(wrong).toEqual([])
  })

  it('spells a diminished fifth as a flattened fifth, never a sharpened fourth', () => {
    // The trap AGENTS.md names: Cdim is C Eb Gb, and Gb read as a bare pitch
    // class comes out F#.
    const dim = CHORD_QUALITIES.find(q => q.id === 'dim')!
    const names = getChordNotes({ root: 0, quality: dim })
      .map((pc, i) => getPitchNameForDegree(pc, 0, dim.degreeLabels[i]))
    expect(names).toEqual(['C', 'Eb', 'Gb'])
  })
})
