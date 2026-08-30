import { describe, it, expect } from 'vitest'
import {
  transpose,
  intervalBetween,
  getPitchName,
  getPitchNameForDegree,
  parsePitchName,
} from '../pitch'

describe('transpose', () => {
  it('raises by semitones within octave', () => {
    expect(transpose(0, 7)).toBe(7)   // C + P5 = G
    expect(transpose(9, 3)).toBe(0)   // A + m3 = C
  })

  it('wraps past B', () => {
    expect(transpose(11, 1)).toBe(0)  // B + m2 = C
    expect(transpose(10, 4)).toBe(2)  // Bb + M3 = D
  })

  it('handles zero semitones', () => {
    expect(transpose(5, 0)).toBe(5)
  })
})

describe('intervalBetween', () => {
  it('measures ascending semitone distance', () => {
    expect(intervalBetween(0, 7)).toBe(7)   // C→G = P5
    expect(intervalBetween(0, 4)).toBe(4)   // C→E = M3
    expect(intervalBetween(7, 0)).toBe(5)   // G→C = P4
    expect(intervalBetween(9, 0)).toBe(3)   // A→C = m3
  })

  it('returns 0 for same pitch class', () => {
    expect(intervalBetween(5, 5)).toBe(0)
    expect(intervalBetween(11, 11)).toBe(0)
  })
})

describe('getPitchName', () => {
  it('returns natural note names regardless of spelling', () => {
    expect(getPitchName(0, 'sharps')).toBe('C')
    expect(getPitchName(0, 'flats')).toBe('C')
    expect(getPitchName(2, 'sharps')).toBe('D')
    expect(getPitchName(7, 'flats')).toBe('G')
  })

  it('returns sharp names with sharps spelling', () => {
    expect(getPitchName(1, 'sharps')).toBe('C#')
    expect(getPitchName(6, 'sharps')).toBe('F#')
    expect(getPitchName(10, 'sharps')).toBe('A#')
  })

  it('returns flat names with flats spelling', () => {
    expect(getPitchName(1, 'flats')).toBe('Db')
    expect(getPitchName(6, 'flats')).toBe('Gb')
    expect(getPitchName(10, 'flats')).toBe('Bb')
  })

  it('auto spelling follows root key preference', () => {
    expect(getPitchName(1, 'auto', 7)).toBe('C#')   // root G → sharp key
    expect(getPitchName(1, 'auto', 10)).toBe('Db')  // root Bb → flat key
    expect(getPitchName(6, 'auto', 9)).toBe('F#')   // root A → sharp key
    expect(getPitchName(6, 'auto', 3)).toBe('Gb')   // root Eb → flat key
  })
})

describe('parsePitchName', () => {
  it('parses sharp note names', () => {
    expect(parsePitchName('C')).toBe(0)
    expect(parsePitchName('C#')).toBe(1)
    expect(parsePitchName('F#')).toBe(6)
  })

  it('parses flat note names', () => {
    expect(parsePitchName('Db')).toBe(1)
    expect(parsePitchName('Gb')).toBe(6)
    expect(parsePitchName('Bb')).toBe(10)
  })

  it('parses generated enharmonic spellings', () => {
    expect(parsePitchName('E#')).toBe(5)
    expect(parsePitchName('B#')).toBe(0)
    expect(parsePitchName('Cb')).toBe(11)
    expect(parsePitchName('Fb')).toBe(4)
    expect(parsePitchName('Bbb')).toBe(9)
    expect(parsePitchName('F##')).toBe(7)
  })

  it('returns null for unrecognised names', () => {
    expect(parsePitchName('X')).toBeNull()
    expect(parsePitchName('c')).toBeNull()
  })
})

describe('getPitchNameForDegree', () => {
  it('uses scale-degree letters for flat-key spellings in sharp-preferred roots', () => {
    expect(getPitchNameForDegree(10, 2, 'b6')).toBe('Bb') // D minor b6
    expect(getPitchNameForDegree(3, 0, 'b3')).toBe('Eb')  // C minor b3
  })

  it('supports altered degrees beyond single flats and sharps', () => {
    expect(getPitchNameForDegree(9, 0, 'bb7')).toBe('Bbb')
    expect(getPitchNameForDegree(6, 0, '#4')).toBe('F#')
  })
})
