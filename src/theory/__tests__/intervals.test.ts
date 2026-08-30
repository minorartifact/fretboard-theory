import { describe, it, expect } from 'vitest'
import { ALL_INTERVALS, intervalPitchClasses, intervalLabelFrom } from '../intervals'
import { SEMITONE_TO_INTERVAL } from '../constants'
import type { PitchClass } from '../types'

const ALL_PCS = Array.from({ length: 12 }, (_, i) => i as PitchClass)

describe('ALL_INTERVALS', () => {
  it('lists the 12 chromatic offsets in ascending order', () => {
    expect(ALL_INTERVALS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  })

  it('has a short label for every offset', () => {
    for (const semi of ALL_INTERVALS) {
      expect(SEMITONE_TO_INTERVAL[semi]).toBeTruthy()
    }
  })
})

describe('intervalPitchClasses', () => {
  it('returns an empty set when nothing is selected', () => {
    expect(intervalPitchClasses(9, []).size).toBe(0)
  })

  it('P1 resolves to the anchor itself', () => {
    expect([...intervalPitchClasses(9, [0])]).toEqual([9])
  })

  it('A + P5 lands on E', () => {
    // A = 9, E = 4
    expect([...intervalPitchClasses(9, [7])]).toEqual([4])
  })

  it('wraps past the octave', () => {
    // G# = 8, +M7 (11) = G (7)
    expect([...intervalPitchClasses(8, [11])]).toEqual([7])
  })

  it('unions a multi-selection', () => {
    // C + m3 + P5 = C minor triad tones {C, Eb, G}
    expect([...intervalPitchClasses(0, [0, 3, 7])].sort((a, b) => a - b)).toEqual([0, 3, 7])
  })

  it('collapses offsets that land on the same pitch class', () => {
    // 2 and 14 are the same pitch class
    expect(intervalPitchClasses(5, [2, 14]).size).toBe(1)
  })

  it('never yields a value outside 0–11, for any anchor', () => {
    for (const anchor of ALL_PCS) {
      for (const pc of intervalPitchClasses(anchor, ALL_INTERVALS)) {
        expect(pc).toBeGreaterThanOrEqual(0)
        expect(pc).toBeLessThanOrEqual(11)
      }
    }
  })

  it('selecting all 12 intervals lights every pitch class', () => {
    for (const anchor of ALL_PCS) {
      expect(intervalPitchClasses(anchor, ALL_INTERVALS).size).toBe(12)
    }
  })
})

describe('intervalLabelFrom', () => {
  it('labels the anchor itself P1', () => {
    expect(intervalLabelFrom(9, 9)).toBe('P1')
  })

  it('labels A → E as P5', () => {
    expect(intervalLabelFrom(9, 4)).toBe('P5')
  })

  it('labels C → Eb as m3', () => {
    expect(intervalLabelFrom(0, 3)).toBe('m3')
  })

  it('measures upward, wrapping the octave', () => {
    // E (4) up to A (9) is a P4, not a P5 down
    expect(intervalLabelFrom(4, 9)).toBe('P4')
  })

  it('round-trips against intervalPitchClasses for every anchor and interval', () => {
    for (const anchor of ALL_PCS) {
      for (const semi of ALL_INTERVALS) {
        const [pc] = [...intervalPitchClasses(anchor, [semi])]
        expect(intervalLabelFrom(anchor, pc)).toBe(SEMITONE_TO_INTERVAL[semi])
      }
    }
  })
})
