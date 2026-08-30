import { describe, it, expect } from 'vitest'
import { encodeUrlState, decodeUrlState, encodeSteps, decodeSteps } from '../url'
import { CHORD_QUALITIES_BY_ID } from '../../theory/chords'
import type { ProgressionStep } from '../../theory/progression'

const base = { root: 0 as const, scaleId: 'major', chordQualityId: null, labelMode: 'note' as const }

describe('progression steps in the URL', () => {
  it('round-trips a plain sequence', () => {
    const steps: ProgressionStep[] = [{ degree: 1 }, { degree: 4 }, { degree: 5 }, { degree: 1 }]
    expect(encodeSteps(steps)).toBe('1,4,5,1')
    expect(decodeSteps('1,4,5,1')).toEqual(steps)
  })

  it('round-trips a quality override', () => {
    const steps: ProgressionStep[] = [{ degree: 2, qualityOverride: CHORD_QUALITIES_BY_ID['min7'] }]
    expect(decodeSteps(encodeSteps(steps))).toEqual(steps)
  })

  it('round-trips a secondary dominant with its chord override', () => {
    const steps: ProgressionStep[] = [{
      degree: 2,
      chordOverride: { root: 9, quality: CHORD_QUALITIES_BY_ID['dom7'] },
      secondaryDominantOf: 2,
    }]
    expect(decodeSteps(encodeSteps(steps))).toEqual(steps)
  })

  it('drops unparseable tokens but keeps the rest of the link working', () => {
    expect(decodeSteps('1,garbage,,5')).toEqual([{ degree: 1 }, { degree: 5 }])
  })

  it('rejects a step naming a quality this build does not have', () => {
    expect(decodeSteps('2:no-such-quality')).toEqual([])
  })

  it('rejects an out-of-range chord root', () => {
    expect(decodeSteps('1@99.dom7')).toEqual([])
  })

  it('treats degree 0 as invalid', () => {
    expect(decodeSteps('0,3')).toEqual([{ degree: 3 }])
  })
})

describe('full URL state', () => {
  it('omits prog when the progression is empty', () => {
    expect(encodeUrlState({ ...base, steps: [] })).not.toContain('prog=')
  })

  it('includes prog when there are steps', () => {
    const qs = encodeUrlState({ ...base, steps: [{ degree: 1 }, { degree: 5 }] })
    expect(qs).toContain('prog=1%2C5')
  })

  it('decodes a full link back into state', () => {
    const qs = encodeUrlState({
      root: 7, scaleId: 'dorian', chordQualityId: 'min7', labelMode: 'degree',
      steps: [{ degree: 1 }, { degree: 4 }],
    })
    const back = decodeUrlState(qs)
    expect(back.root).toBe(7)
    expect(back.scaleId).toBe('dorian')
    expect(back.chordQualityId).toBe('min7')
    expect(back.labelMode).toBe('degree')
    expect(back.steps).toEqual([{ degree: 1 }, { degree: 4 }])
  })

  it('leaves steps undefined when the link has no prog param', () => {
    expect(decodeUrlState('?root=C').steps).toBeUndefined()
  })
})
