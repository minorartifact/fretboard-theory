import { describe, it, expect } from 'vitest'
import { stepAudioKey } from '../useProgressionAudio'
import { CHORD_QUALITIES_BY_ID } from '../../theory/chords'
import { getSecondaryDominant } from '../../theory/chords'
import type { ProgressionStep } from '../../theory/progression'

describe('stepAudioKey', () => {
  it('separates a diatonic step from the secondary dominant of the same degree', () => {
    // In C major both of these sit at degree 5 with no qualityOverride, so a key
    // built from degree + quality alone collides and the replacement is silent.
    const diatonic: ProgressionStep = { degree: 5 }
    const secDom: ProgressionStep = {
      degree: 5,
      chordOverride: getSecondaryDominant(7),
      secondaryDominantOf: 5,
    }
    expect(stepAudioKey(0, diatonic)).not.toBe(stepAudioKey(0, secDom))
  })

  it('separates two different chord overrides at the same degree', () => {
    const a: ProgressionStep = { degree: 1, chordOverride: getSecondaryDominant(0) }
    const b: ProgressionStep = { degree: 1, chordOverride: getSecondaryDominant(5) }
    expect(stepAudioKey(0, a)).not.toBe(stepAudioKey(0, b))
  })

  it('still separates quality overrides and step positions', () => {
    const plain: ProgressionStep = { degree: 2 }
    const min7: ProgressionStep = { degree: 2, qualityOverride: CHORD_QUALITIES_BY_ID['min7'] }
    expect(stepAudioKey(0, plain)).not.toBe(stepAudioKey(0, min7))
    expect(stepAudioKey(0, plain)).not.toBe(stepAudioKey(1, plain))
  })

  it('is stable for an unchanged step', () => {
    const step: ProgressionStep = { degree: 4 }
    expect(stepAudioKey(2, step)).toBe(stepAudioKey(2, { degree: 4 }))
  })
})
