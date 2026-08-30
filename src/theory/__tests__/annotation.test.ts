import { describe, it, expect } from 'vitest'
import { annotateNote, annotateGrid } from '../annotation'
import { buildFretboardGrid, TUNINGS_BY_ID } from '../fretboard'
import { SCALES_BY_ID } from '../scales'
import { CHORD_QUALITIES_BY_ID } from '../chords'
import type { AnnotationContext } from '../types'

const std     = TUNINGS_BY_ID['standard']
const major   = SCALES_BY_ID['major']
const aeolian = SCALES_BY_ID['aeolian']
const min7    = CHORD_QUALITIES_BY_ID['min7']
const maj7    = CHORD_QUALITIES_BY_ID['maj7']

const baseCtx: AnnotationContext = {
  root:       0,
  scale:      major,
  chord:      null,
  labelMode:  'note',
  spelling:   'sharps',
  fretRange:  { startFret: 0, endFret: 14 },
}

describe('annotateNote — scale context', () => {
  const grid = buildFretboardGrid(std, 14)

  it('marks root note (C) as scale-degree with label "C"', () => {
    // D string fret 10 = midiNote 60 = C
    const note = grid[2][10]
    expect(note.pitchClass).toBe(0)
    const ann = annotateNote(note, baseCtx)
    expect(ann.role).toBe('scale-degree')
    expect(ann.highlighted).toBe(true)
    expect(ann.degreeLabel).toBe('1')
    expect(ann.label).toBe('C')
  })

  it('marks G (degree 5) as scale-degree', () => {
    const note = grid[3][0]  // G string open = G
    expect(note.pitchClass).toBe(7)
    const ann = annotateNote(note, baseCtx)
    expect(ann.role).toBe('scale-degree')
    expect(ann.highlighted).toBe(true)
    expect(ann.degreeLabel).toBe('5')
  })

  it('marks F# as chromatic (not in C major)', () => {
    // Low E string fret 2 = midiNote 42 = F# (pitch class 6)
    const note = grid[0][2]
    expect(note.pitchClass).toBe(6)
    const ann = annotateNote(note, baseCtx)
    expect(ann.role).toBe('chromatic')
    expect(ann.highlighted).toBe(false)
  })

  it('label mode "degree" returns degree string', () => {
    const note = grid[3][0]  // G = 5 in C major
    const ann  = annotateNote(note, { ...baseCtx, labelMode: 'degree' })
    expect(ann.label).toBe('5')
  })

  it('label mode "interval" returns interval quality string', () => {
    const note = grid[4][1]  // C = m3 above A
    const ann  = annotateNote(note, { ...baseCtx, root: 9, scale: aeolian, labelMode: 'interval' })
    expect(ann.label).toBe('m3')
    expect(ann.degreeLabel).toBe('b3')
  })

  it('auto note spelling follows the active scale degree', () => {
    const dAeolianCtx: AnnotationContext = {
      ...baseCtx,
      root: 2,
      scale: aeolian,
      spelling: 'auto',
    }
    const note = grid[3][3]  // G string fret 3 = Bb, b6 in D aeolian
    const ann = annotateNote(note, dAeolianCtx)
    expect(note.pitchClass).toBe(10)
    expect(ann.degreeLabel).toBe('b6')
    expect(ann.pitchName).toBe('Bb')
    expect(ann.label).toBe('Bb')
  })

  it('semitones field is correct distance from root', () => {
    const note = grid[3][0]  // G = 7 semitones above C
    const ann  = annotateNote(note, baseCtx)
    expect(ann.semitones).toBe(7)
  })
})

describe('annotateNote — chord context', () => {
  const grid = buildFretboardGrid(std, 14)
  const am7Chord = { root: 9 as const, quality: min7 }
  const amCtx: AnnotationContext = {
    ...baseCtx,
    root:  9,
    scale: aeolian,
    chord: am7Chord,
  }

  it('marks A (root of Am7) as role "root"', () => {
    // A string open = A (pitch class 9)
    const note = grid[1][0]
    expect(note.pitchClass).toBe(9)
    const ann = annotateNote(note, amCtx)
    expect(ann.role).toBe('root')
    expect(ann.highlighted).toBe(true)
  })

  it('marks C (b3 of Am7) as chord-third', () => {
    // B string fret 1 = midiNote 60 = C
    const note = grid[4][1]
    expect(note.pitchClass).toBe(0)
    const ann = annotateNote(note, amCtx)
    expect(ann.role).toBe('chord-third')
    expect(ann.degreeLabel).toBe('b3')
  })

  it('marks E (5th of Am7) as chord-fifth', () => {
    // Low E string open = E (pitch class 4)
    const note = grid[0][0]
    expect(note.pitchClass).toBe(4)
    const ann = annotateNote(note, amCtx)
    expect(ann.role).toBe('chord-fifth')
  })

  it('marks G (b7 of Am7) as chord-seventh', () => {
    // G string open = G (pitch class 7)
    const note = grid[3][0]
    expect(note.pitchClass).toBe(7)
    const ann = annotateNote(note, amCtx)
    expect(ann.role).toBe('chord-seventh')
  })

  it('marks B (scale degree 2 of A aeolian, not in Am7) as scale-degree', () => {
    // B string open = B (pitch class 11)
    const note = grid[4][0]
    expect(note.pitchClass).toBe(11)
    const ann = annotateNote(note, amCtx)
    expect(ann.role).toBe('scale-degree')
    expect(ann.highlighted).toBe(true)
  })

  it('spells chord tones from the chord root, not the global scale root', () => {
    const note = grid[4][4] // B string fret 4 = D#
    expect(note.pitchClass).toBe(3)

    const ann = annotateNote(note, {
      ...baseCtx,
      root: 0,
      scale: major,
      chord: { root: 11, quality: maj7 },
      spelling: 'auto',
    })

    expect(ann.role).toBe('chord-third')
    expect(ann.degreeLabel).toBe('3')
    expect(ann.pitchName).toBe('D#')
  })

  it('uses the chord root for chord-tone interval labels and semitones', () => {
    const note = grid[4][4] // B string fret 4 = D#
    const ann = annotateNote(note, {
      ...baseCtx,
      root: 0,
      scale: major,
      chord: { root: 11, quality: maj7 },
      labelMode: 'interval',
      spelling: 'auto',
    })

    expect(ann.role).toBe('chord-third')
    expect(ann.semitones).toBe(4)
    expect(ann.label).toBe('M3')
  })
})

describe('annotateNote — no scale or chord', () => {
  const grid   = buildFretboardGrid(std, 14)
  const noCtx: AnnotationContext = {
    ...baseCtx,
    scale: null,
    chord: null,
  }

  it('highlights every note when neither scale nor chord is active', () => {
    const anns = grid[0].slice(0, 12).map(n => annotateNote(n, noCtx))
    expect(anns.every(a => a.highlighted)).toBe(true)
  })
})

describe('annotateGrid', () => {
  const grid = buildFretboardGrid(std, 14)

  it('filters to the requested fret range', () => {
    const ctx = { ...baseCtx, fretRange: { startFret: 5, endFret: 9 } }
    const annotated = annotateGrid(grid, ctx)
    expect(annotated).toHaveLength(6)
    annotated.forEach(str => {
      expect(str).toHaveLength(5)
      expect(str[0].fretboardNote.fret).toBe(5)
      expect(str[4].fretboardNote.fret).toBe(9)
    })
  })

  it('full range produces 6×15 cells', () => {
    const annotated = annotateGrid(grid, baseCtx)
    expect(annotated.flat()).toHaveLength(90)
  })

  it('all highlighted cells in C major scale belong to C major pitch classes', () => {
    const annotated = annotateGrid(grid, baseCtx)
    const cMajorPCs = new Set([0,2,4,5,7,9,11])
    annotated.flat()
      .filter(a => a.highlighted)
      .forEach(a => expect(cMajorPCs.has(a.fretboardNote.pitchClass)).toBe(true))
  })

  it('no chromatic notes are highlighted in C major scale', () => {
    const annotated = annotateGrid(grid, baseCtx)
    annotated.flat()
      .filter(a => a.role === 'chromatic')
      .forEach(a => expect(a.highlighted).toBe(false))
  })
})
