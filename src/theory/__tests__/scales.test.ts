import { describe, it, expect } from 'vitest'
import { getScaleNotes, isInScale, getScaleDegreeLabel, SCALES_BY_ID } from '../scales'
import type { PitchClass } from '../types'

const major   = SCALES_BY_ID['major']
const dorian  = SCALES_BY_ID['dorian']
const aeolian = SCALES_BY_ID['aeolian']
const minPent = SCALES_BY_ID['minor-pentatonic']
const blues   = SCALES_BY_ID['blues']

describe('getScaleNotes', () => {
  it('C major: C D E F G A B', () => {
    expect(getScaleNotes(0, major)).toEqual([0,2,4,5,7,9,11])
  })

  it('G major: G A B C D E F#', () => {
    expect(getScaleNotes(7, major)).toEqual([7,9,11,0,2,4,6])
  })

  it('A natural minor: A B C D E F G', () => {
    expect(getScaleNotes(9, aeolian)).toEqual([9,11,0,2,4,5,7])
  })

  it('A minor pentatonic: A C D E G', () => {
    expect(getScaleNotes(9, minPent)).toEqual([9,0,2,4,7])
  })

  it('B Dorian: B C# D E F# G# A', () => {
    // B Dorian b7 = A (pc 9), not Bb (pc 10)
    expect(getScaleNotes(11, dorian)).toEqual([11,1,2,4,6,8,9])
  })

  it('A blues scale: A C D Eb E G', () => {
    expect(getScaleNotes(9, blues)).toEqual([9,0,2,3,4,7])
  })

  it('includes all seven harmonic minor modes', () => {
    const harmonicMinorModes = Object.values(SCALES_BY_ID)
      .filter(scale => scale.category === 'Harmonic Minor')

    expect(harmonicMinorModes).toHaveLength(7)
    expect(SCALES_BY_ID['ultralocrian'].pattern).toEqual([0,1,3,4,6,8,9])
    expect(SCALES_BY_ID['ultralocrian'].degrees).toEqual(['1','b2','b3','b4','b5','b6','bb7'])
  })

  it('groups pentatonic and blues scales under the selector category', () => {
    expect(SCALES_BY_ID['minor-pentatonic'].category).toBe('Pentatonic & Blues')
    expect(SCALES_BY_ID['blues'].category).toBe('Pentatonic & Blues')
  })

  it('spells the altered scale with conventional altered dominant degrees', () => {
    expect(SCALES_BY_ID['altered'].pattern).toEqual([0,1,3,4,6,8,10])
    expect(SCALES_BY_ID['altered'].degrees).toEqual(['1','b2','#2','3','b5','#5','b7'])
  })
})

describe('isInScale', () => {
  it('returns true for all notes in C major', () => {
    ;([0,2,4,5,7,9,11] as PitchClass[]).forEach(pc =>
      expect(isInScale(pc, 0, major)).toBe(true),
    )
  })

  it('returns false for chromatic notes outside C major', () => {
    ;([1,3,6,8,10] as PitchClass[]).forEach(pc =>
      expect(isInScale(pc, 0, major)).toBe(false),
    )
  })

  it('A Dorian includes F# but not F', () => {
    expect(isInScale(6, 9, dorian)).toBe(true)   // F#
    expect(isInScale(5, 9, dorian)).toBe(false)  // F
  })
})

describe('getScaleDegreeLabel', () => {
  it('C major degree labels', () => {
    expect(getScaleDegreeLabel(0,  0, major)).toBe('1')  // C
    expect(getScaleDegreeLabel(2,  0, major)).toBe('2')  // D
    expect(getScaleDegreeLabel(4,  0, major)).toBe('3')  // E
    expect(getScaleDegreeLabel(5,  0, major)).toBe('4')  // F
    expect(getScaleDegreeLabel(7,  0, major)).toBe('5')  // G
    expect(getScaleDegreeLabel(9,  0, major)).toBe('6')  // A
    expect(getScaleDegreeLabel(11, 0, major)).toBe('7')  // B
  })

  it('A Dorian degree labels', () => {
    expect(getScaleDegreeLabel(9,  9, dorian)).toBe('1')   // A  = 1
    expect(getScaleDegreeLabel(11, 9, dorian)).toBe('2')   // B  = 2
    expect(getScaleDegreeLabel(0,  9, dorian)).toBe('b3')  // C  = b3
    expect(getScaleDegreeLabel(2,  9, dorian)).toBe('4')   // D  = 4
    expect(getScaleDegreeLabel(4,  9, dorian)).toBe('5')   // E  = 5
    expect(getScaleDegreeLabel(6,  9, dorian)).toBe('6')   // F# = 6
    expect(getScaleDegreeLabel(7,  9, dorian)).toBe('b7')  // G  = b7
  })

  it('returns null for notes not in scale', () => {
    expect(getScaleDegreeLabel(1,  0, major)).toBeNull()  // C# not in C major
    expect(getScaleDegreeLabel(6,  0, major)).toBeNull()  // F# not in C major
  })
})
