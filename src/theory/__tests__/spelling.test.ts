import { describe, it, expect } from 'vitest'
import { SCALES, SCALES_BY_ID, getScaleNotes } from '../scales'
import { CHORD_QUALITIES, getChordNotes, getDiatonicChords } from '../chords'
import { getPitchNameForDegree, spellRoot, spellInScale, spellChordTones, parsePitchName } from '../pitch'
import { getKeySignature } from '../keys'
import { annotateGrid } from '../annotation'
import { buildFretboardGrid, TUNINGS_BY_ID } from '../fretboard'
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

/**
 * The second half of the same bug: spelling against the degree is only right if
 * the *root* is spelled right first. `ROOT_PREFERS_SHARPS` answers for major
 * keys, and the app asked it about every mode — so aeolian on 3 was spelled
 * from Eb and printed `Eb F Gb Ab Bb B Db`, B and Bb with no C at all.
 */
describe('key naming', () => {
  const major   = SCALES_BY_ID['major']
  const aeolian = SCALES_BY_ID['aeolian']

  it('names the twelve major keys the way a musician writes them', () => {
    expect(ROOTS.map(r => spellRoot(r, major)))
      .toEqual(['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'])
  })

  it('names the twelve minor keys the way a musician writes them', () => {
    // C#, D# and G# minor, not Db, Eb-with-a-B and Ab: the flat spellings need
    // 8, 6-with-a-collision and 7 accidentals against 4, 6 and 5.
    expect(ROOTS.map(r => spellRoot(r, aeolian)))
      .toEqual(['C','C#','D','D#','E','F','F#','G','G#','A','Bb','B'])
  })

  it('spells D# minor as the key it is, with seven letters and no repeats', () => {
    expect(getScaleNotes(3, aeolian).map(pc => spellInScale(pc, 3, aeolian)))
      .toEqual(['D#','E#','F#','G#','A#','B','C#'])
  })

  it('never picks a root that forces a double accidental on a major mode', () => {
    const wrong: string[] = []
    for (const scale of SCALES.filter(s => s.category === 'Major Modes')) {
      for (const root of ROOTS) {
        const names = getScaleNotes(root, scale).map(pc => spellInScale(pc, root, scale))
        if (names.some(n => n.length > 2)) wrong.push(`${scale.id} on ${spellRoot(root, scale)}: ${names.join(' ')}`)
      }
    }
    expect(wrong).toEqual([])
  })

  /**
   * Doubles are not always avoidable and are sometimes correct: G# harmonic
   * minor really does raise its seventh to F##. What must never happen is a
   * double in a scale that had a clean spelling available — which is every
   * major mode, above, and every melodic-minor mode here.
   */
  it('only spells a double accidental where the scale genuinely requires one', () => {
    const unexpected: string[] = []
    for (const scale of SCALES) {
      const mayNeedDoubles =
        scale.category === 'Harmonic Minor' ||
        !isDiatonicallyLabelled(scale.degrees)
      if (mayNeedDoubles) continue
      for (const root of ROOTS) {
        const names = getScaleNotes(root, scale).map(pc => spellInScale(pc, root, scale))
        if (names.some(n => n.length > 2)) unexpected.push(`${scale.id} on ${spellRoot(root, scale)}: ${names.join(' ')}`)
      }
    }
    expect(unexpected).toEqual([])
  })

  it('spells every note of every scale as the pitch it actually is', () => {
    const wrong: string[] = []
    for (const scale of SCALES) {
      for (const root of ROOTS) {
        for (const pc of getScaleNotes(root, scale)) {
          const name = spellInScale(pc, root, scale)
          if (parsePitchName(name) !== pc) wrong.push(`${scale.id}/${root}: ${name} is not pitch class ${pc}`)
        }
      }
    }
    expect(wrong).toEqual([])
  })

  it('agrees with the key signature on how many accidentals a major key has', () => {
    for (const root of ROOTS) {
      const accidentals = getScaleNotes(root, major)
        .map(pc => spellInScale(pc, root, major))
        .join('')
        .replace(/[A-G]/g, '')
      const { accidental, notes } = getKeySignature(root)
      expect(accidentals).toBe((accidental ?? '').repeat(notes.length))
    }
  })
})

/** The ii° of D# minor is built on E#; rooting it on F prints a triad with no third. */
describe('chords spelled in key', () => {
  const aeolian = SCALES_BY_ID['aeolian']

  it('names the diatonic chords of D# minor', () => {
    const names = getDiatonicChords(3, aeolian)
      .map(c => spellInScale(c.root, 3, aeolian) + c.quality.symbol)
    expect(names).toEqual(['D#m7','E#ø7','F#maj7','G#m7','A#m7','Bmaj7','C#7'])
  })

  it('spells the tones of the ii° of D# minor', () => {
    const dim = CHORD_QUALITIES.find(q => q.id === 'dim')!
    const tones = spellChordTones(getChordNotes({ root: 5, quality: dim }), dim.degreeLabels, 5, 3, aeolian)
    expect(tones).toEqual(['E#','G#','B'])
  })
})

/** As reported: two renderings of one scale that disagreed about a note's name. */
describe('the chips and the neck agree', () => {
  it('gives a note the same name in the spotlight row and on the fretboard', () => {
    const scale = SCALES_BY_ID['aeolian']
    const root  = 3 as PitchClass
    const grid  = buildFretboardGrid(TUNINGS_BY_ID['standard'], 15)
    const rows  = annotateGrid(grid, {
      root, scale, chord: null, labelMode: 'note', spelling: 'auto',
      fretRange: { startFret: 0, endFret: 15 },
    })

    const chip = new Map(getScaleNotes(root, scale).map(pc => [pc, spellInScale(pc, root, scale)]))
    const wrong: string[] = []
    for (const row of rows) {
      for (const ann of row) {
        const expected = chip.get(ann.fretboardNote.pitchClass)
        if (expected && ann.pitchName !== expected) {
          wrong.push(`neck says ${ann.pitchName}, chips say ${expected}`)
        }
      }
    }
    expect([...new Set(wrong)]).toEqual([])
  })
})
