import { describe, it, expect } from 'vitest'
import { buildFretboardGrid, getNoteAtPosition, TUNINGS_BY_ID } from '../fretboard'

const std = TUNINGS_BY_ID['standard']

describe('buildFretboardGrid', () => {
  it('has 6 strings and fretCount+1 positions per string', () => {
    const grid = buildFretboardGrid(std, 14)
    expect(grid).toHaveLength(6)
    grid.forEach(str => expect(str).toHaveLength(15))
  })

  it('open string MIDI notes match standard tuning', () => {
    const grid = buildFretboardGrid(std, 14)
    expect(grid[0][0].midiNote).toBe(40)  // E2
    expect(grid[1][0].midiNote).toBe(45)  // A2
    expect(grid[2][0].midiNote).toBe(50)  // D3
    expect(grid[3][0].midiNote).toBe(55)  // G3
    expect(grid[4][0].midiNote).toBe(59)  // B3
    expect(grid[5][0].midiNote).toBe(64)  // E4
  })

  it('open string pitch classes are correct', () => {
    const grid = buildFretboardGrid(std, 14)
    expect(grid[0][0].pitchClass).toBe(4)   // E
    expect(grid[1][0].pitchClass).toBe(9)   // A
    expect(grid[2][0].pitchClass).toBe(2)   // D
    expect(grid[3][0].pitchClass).toBe(7)   // G
    expect(grid[4][0].pitchClass).toBe(11)  // B
    expect(grid[5][0].pitchClass).toBe(4)   // E
  })

  it('increments pitch class by 1 per fret, wrapping at 12', () => {
    const grid = buildFretboardGrid(std, 14)
    // Low E string: E(4) F(5) F#(6) G(7) G#(8) A(9) ...
    expect(grid[0][1].pitchClass).toBe(5)   // F
    expect(grid[0][2].pitchClass).toBe(6)   // F#
    expect(grid[0][5].pitchClass).toBe(9)   // A
    expect(grid[0][12].pitchClass).toBe(4)  // E (octave above open)
  })

  it('cell indices match string and fret', () => {
    const grid = buildFretboardGrid(std, 14)
    expect(grid[2][7].string).toBe(2)
    expect(grid[2][7].fret).toBe(7)
  })

  it('D string fret 10 = C (midiNote 60)', () => {
    const grid = buildFretboardGrid(std, 14)
    expect(grid[2][10].midiNote).toBe(60)
    expect(grid[2][10].pitchClass).toBe(0)
  })

  it('rejects invalid fret counts', () => {
    expect(() => buildFretboardGrid(std, -1)).toThrow(RangeError)
    expect(() => buildFretboardGrid(std, 12.5)).toThrow(RangeError)
  })
})

describe('getNoteAtPosition', () => {
  it('returns the same values as the grid', () => {
    const grid = buildFretboardGrid(std, 14)
    const note = getNoteAtPosition(std, 3, 5)
    expect(note.midiNote).toBe(grid[3][5].midiNote)
    expect(note.pitchClass).toBe(grid[3][5].pitchClass)
  })

  it('rejects invalid string and fret positions', () => {
    expect(() => getNoteAtPosition(std, -1, 0)).toThrow(RangeError)
    expect(() => getNoteAtPosition(std, 6, 0)).toThrow(RangeError)
    expect(() => getNoteAtPosition(std, 0, -1)).toThrow(RangeError)
    expect(() => getNoteAtPosition(std, 0, 1.5)).toThrow(RangeError)
  })
})
