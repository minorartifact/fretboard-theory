import { describe, it, expect } from 'vitest'
import {
  getChordNotes, isInChord, getChordToneLabel, getChordToneRole,
  getDiatonicChords, CHORD_QUALITIES_BY_ID,
} from '../chords'
import { SCALES_BY_ID } from '../scales'
import type { Chord, PitchClass } from '../types'

const maj7  = CHORD_QUALITIES_BY_ID['maj7']
const min7  = CHORD_QUALITIES_BY_ID['min7']
const dom7  = CHORD_QUALITIES_BY_ID['dom7']
const m7b5  = CHORD_QUALITIES_BY_ID['m7b5']

describe('getChordNotes', () => {
  it('Cmaj7: C E G B', () => {
    expect(getChordNotes({ root: 0, quality: maj7 })).toEqual([0,4,7,11])
  })

  it('Am7: A C E G', () => {
    expect(getChordNotes({ root: 9, quality: min7 })).toEqual([9,0,4,7])
  })

  it('G7: G B D F', () => {
    expect(getChordNotes({ root: 7, quality: dom7 })).toEqual([7,11,2,5])
  })

  it('Bø7: B D F A', () => {
    expect(getChordNotes({ root: 11, quality: m7b5 })).toEqual([11,2,5,9])
  })
})

describe('isInChord', () => {
  const cMaj7: Chord = { root: 0, quality: maj7 }

  it('returns true for all Cmaj7 tones', () => {
    ;([0,4,7,11] as PitchClass[]).forEach(pc => expect(isInChord(pc, cMaj7)).toBe(true))
  })

  it('returns false for non-chord tones', () => {
    ;([2,5,9,1,3,6,8,10] as PitchClass[]).forEach(pc => expect(isInChord(pc, cMaj7)).toBe(false))
  })
})

describe('getChordToneRole', () => {
  const cMaj7: Chord = { root: 0, quality: maj7 }

  it('assigns correct roles to each chord tone', () => {
    expect(getChordToneRole(0,  cMaj7)).toBe('root')
    expect(getChordToneRole(4,  cMaj7)).toBe('chord-third')
    expect(getChordToneRole(7,  cMaj7)).toBe('chord-fifth')
    expect(getChordToneRole(11, cMaj7)).toBe('chord-seventh')
  })

  it('returns null for non-chord tones', () => {
    expect(getChordToneRole(2, cMaj7)).toBeNull()
    expect(getChordToneRole(9, cMaj7)).toBeNull()
  })

  it('derives roles from degree labels rather than pattern index', () => {
    const add9: Chord = {
      root: 0,
      quality: {
        id: 'add9',
        name: 'Add 9',
        symbol: 'add9',
        pattern: [0,2,4,7],
        degreeLabels: ['1','9','3','5'],
      },
    }

    expect(getChordToneRole(2, add9)).toBe('chord-tone')
    expect(getChordToneRole(4, add9)).toBe('chord-third')
    expect(getChordToneRole(7, add9)).toBe('chord-fifth')
  })

  it('does not classify extension numbers as basic chord functions', () => {
    const c13: Chord = {
      root: 0,
      quality: {
        id: '13',
        name: 'Thirteenth',
        symbol: '13',
        pattern: [0,4,7,10,2,9],
        degreeLabels: ['1','3','5','b7','9','13'],
      },
    }

    expect(getChordToneRole(9, c13)).toBe('chord-tone')
  })
})

describe('getChordToneLabel', () => {
  const am7: Chord = { root: 9, quality: min7 }

  it('labels Am7 chord tones correctly', () => {
    expect(getChordToneLabel(9, am7)).toBe('1')    // A  = root
    expect(getChordToneLabel(0, am7)).toBe('b3')   // C  = b3
    expect(getChordToneLabel(4, am7)).toBe('5')    // E  = 5
    expect(getChordToneLabel(7, am7)).toBe('b7')   // G  = b7
  })

  it('returns null for non-chord tones', () => {
    expect(getChordToneLabel(2, am7)).toBeNull()
  })
})

describe('getDiatonicChords', () => {
  const major = SCALES_BY_ID['major']

  it('generates 7 chords for a 7-tone scale', () => {
    expect(getDiatonicChords(0, major)).toHaveLength(7)
  })

  it('C major diatonic 7th chords', () => {
    const chords = getDiatonicChords(0, major)
    // I   = Cmaj7
    expect(chords[0].root).toBe(0);  expect(chords[0].quality.id).toBe('maj7')
    // ii  = Dm7
    expect(chords[1].root).toBe(2);  expect(chords[1].quality.id).toBe('min7')
    // iii = Em7
    expect(chords[2].root).toBe(4);  expect(chords[2].quality.id).toBe('min7')
    // IV  = Fmaj7
    expect(chords[3].root).toBe(5);  expect(chords[3].quality.id).toBe('maj7')
    // V   = G7
    expect(chords[4].root).toBe(7);  expect(chords[4].quality.id).toBe('dom7')
    // vi  = Am7
    expect(chords[5].root).toBe(9);  expect(chords[5].quality.id).toBe('min7')
    // vii = Bø7
    expect(chords[6].root).toBe(11); expect(chords[6].quality.id).toBe('m7b5')
  })

  it('G major diatonic chords have correct roots', () => {
    const chords = getDiatonicChords(7, major)
    expect(chords.map(c => c.root)).toEqual([7,9,11,0,2,4,6])
  })

  it('returns empty array for pentatonic scale', () => {
    expect(getDiatonicChords(0, SCALES_BY_ID['minor-pentatonic'])).toEqual([])
  })

  it('returns empty array for non-7-tone scales', () => {
    expect(getDiatonicChords(0, SCALES_BY_ID['dim-hw'])).toEqual([])
    expect(getDiatonicChords(0, SCALES_BY_ID['chromatic'])).toEqual([])
  })

  it('uses explicit unknown quality when no chord quality matches', () => {
    const syntheticScale = {
      id: 'cluster',
      name: 'Cluster',
      category: 'Synthetic',
      pattern: [0,1,2,3,4,5,6],
      degrees: ['1','b2','2','b3','3','4','b5'],
    }

    const chords = getDiatonicChords(0, syntheticScale)
    expect(chords[0].quality.id).toBe('unknown')
    expect(chords[0].quality.pattern).toEqual([0,2,4,6])
    expect(chords[0].quality.symbol).toBe('?')
  })

  it('does not degrade unmatched seventh stacks to triads', () => {
    const syntheticScale = {
      id: 'major-sixth-stack',
      name: 'Major Sixth Stack',
      category: 'Synthetic',
      pattern: [0,1,4,5,7,8,9],
      degrees: ['1','b2','3','4','5','b6','6'],
    }

    const chords = getDiatonicChords(0, syntheticScale)
    expect(chords[0].quality.id).toBe('unknown')
    expect(chords[0].quality.pattern).toEqual([0,4,7,9])
  })
})
