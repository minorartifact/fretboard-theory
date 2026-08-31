import { describe, it, expect } from 'vitest'
import { supportsVoicings, getChordVoicings, isChordDbLoaded } from '../chordVoicings'
import { TUNINGS, TUNINGS_BY_ID } from '../fretboard'
import { CHORD_QUALITIES_BY_ID } from '../chords'

describe('supportsVoicings', () => {
  it('accepts standard tuning', () => {
    expect(supportsVoicings(TUNINGS_BY_ID['standard'])).toBe(true)
  })

  it('rejects every other tuning, because the database stores fingerings', () => {
    for (const t of TUNINGS.filter(t => t.id !== 'standard')) {
      expect(supportsVoicings(t)).toBe(false)
    }
  })

  it('is the rule getChordVoicings actually applies', () => {
    // Guards the duplication that let the toolbar promise voicings the database
    // could never supply. With the DB unloaded both must agree on "nothing".
    const chord = { root: 0 as const, quality: CHORD_QUALITIES_BY_ID['maj'] }
    for (const t of TUNINGS) {
      if (supportsVoicings(t)) continue
      expect(getChordVoicings(chord, t)).toEqual([])
    }
    expect(isChordDbLoaded()).toBe(false)
  })
})
