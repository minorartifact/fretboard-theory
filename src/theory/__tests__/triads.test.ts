import { describe, it, expect } from 'vitest'
import { INVERSIONS, stringSets, triadFor, triadQualityFor, triadShapes } from '../triads'
import { CHORD_QUALITIES_BY_ID } from '../chords'
import { TUNINGS_BY_ID } from '../fretboard'
import type { Chord, PitchClass } from '../types'

const standard = TUNINGS_BY_ID['standard']
const dadgad   = TUNINGS_BY_ID['dadgad']

const chord = (root: PitchClass, id: string): Chord => ({ root, quality: CHORD_QUALITIES_BY_ID[id] })

describe('stringSets', () => {
  it('gives the four adjacent triples of a six-string neck', () => {
    expect(stringSets(standard).map(s => s.strings)).toEqual([
      [0, 1, 2], [1, 2, 3], [2, 3, 4], [3, 4, 5],
    ])
  })
})

describe('triadQualityFor', () => {
  it('leaves the six triads alone', () => {
    for (const id of ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4']) {
      expect(triadQualityFor(id)).toBe(id)
    }
  })

  // Without this the 7th chords the progression builder produces by default
  // would have no shapes at all.
  it('reduces seventh chords to the triad underneath', () => {
    expect(triadQualityFor('maj7')).toBe('maj')
    expect(triadQualityFor('dom7')).toBe('maj')
    expect(triadQualityFor('min7')).toBe('min')
    expect(triadQualityFor('min-maj7')).toBe('min')
    expect(triadQualityFor('m7b5')).toBe('dim')
    expect(triadQualityFor('dim7')).toBe('dim')
    expect(triadQualityFor('aug7')).toBe('aug')
  })

  it('reduces ninth chords too', () => {
    expect(triadQualityFor('dom9')).toBe('maj')
    expect(triadQualityFor('min9')).toBe('min')
  })

  it('keeps the root when reducing', () => {
    expect(triadFor(chord(2, 'min7'))).toEqual(chord(2, 'min'))
  })
})

describe('triadShapes', () => {
  const set = stringSets(standard)[3]   // strings 3,4,5 = D G B e -> G B e top three

  it('finds shapes for a C major triad on the top three strings', () => {
    const shapes = triadShapes(chord(0, 'maj'), standard, stringSets(standard)[3])
    expect(shapes.length).toBeGreaterThan(0)
  })

  it('sounds exactly the chord tones, never anything else', () => {
    for (const s of stringSets(standard)) {
      for (const id of ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4']) {
        for (let root = 0; root < 12; root++) {
          const c   = chord(root as PitchClass, id)
          const pcs = new Set(c.quality.pattern.map(p => (root + p) % 12))
          for (const shape of triadShapes(c, standard, s)) {
            for (const n of shape.notes) expect(pcs.has(n.pitchClass)).toBe(true)
          }
        }
      }
    }
  })

  it('covers all three tones in every shape — no doubles, no gaps', () => {
    for (const s of stringSets(standard)) {
      for (const shape of triadShapes(chord(0, 'maj'), standard, s)) {
        expect(new Set(shape.notes.map(n => n.pitchClass)).size).toBe(3)
      }
    }
  })

  it('stacks strictly upward, so the bass really is the bass', () => {
    for (const s of stringSets(standard)) {
      for (const shape of triadShapes(chord(7, 'min'), standard, s)) {
        const [a, b, c] = shape.notes
        expect(a.midiNote).toBeLessThan(b.midiNote)
        expect(b.midiNote).toBeLessThan(c.midiNote)
      }
    }
  })

  it('names the inversion after the tone in the bass', () => {
    for (const shape of triadShapes(chord(0, 'maj'), standard, set)) {
      const bass = shape.notes[0].degreeLabel
      if (shape.inversion === 'root')   expect(bass).toBe('1')
      if (shape.inversion === 'first')  expect(bass).toBe('3')
      if (shape.inversion === 'second') expect(bass).toBe('5')
    }
  })

  it('stays inside the fret window and the reach limit', () => {
    for (const s of stringSets(standard)) {
      for (const shape of triadShapes(chord(3, 'maj'), standard, s, { fretCount: 12, maxSpan: 4 })) {
        expect(shape.span).toBeLessThanOrEqual(4)
        for (const n of shape.notes) {
          expect(n.fret).toBeGreaterThanOrEqual(0)
          expect(n.fret).toBeLessThanOrEqual(12)
        }
      }
    }
  })

  it('offers all three inversions on every string set', () => {
    for (const s of stringSets(standard)) {
      const found = new Set(triadShapes(chord(0, 'maj'), standard, s).map(x => x.inversion))
      expect([...found].sort()).toEqual([...INVERSIONS].sort())
    }
  })

  // The reason this exists rather than reusing chordVoicings: that reads a
  // database of standard-tuning fingerings and has nothing for other tunings.
  it('works in a tuning the voicing database cannot serve', () => {
    const shapes = triadShapes(chord(2, 'maj'), dadgad, stringSets(dadgad)[3])
    expect(shapes.length).toBeGreaterThan(0)
    const pcs = new Set([2, 6, 9])
    for (const shape of shapes) {
      for (const n of shape.notes) expect(pcs.has(n.pitchClass)).toBe(true)
    }
  })

  it('has no shapes for a quality with no third or fifth to reduce', () => {
    expect(triadQualityFor('unknown')).toBeNull()
  })

  // Both of these were real bugs: the bass was re-searched from fret 0 on every
  // octave, so each shape came out twice; and the span ignored open strings, so
  // an open bass could pair with notes ten frets up and report a reach of zero.
  it('never returns the same shape twice', () => {
    for (const s of stringSets(standard)) {
      for (const id of ['maj', 'min', 'dim']) {
        const shapes = triadShapes(chord(0, id), standard, s)
        const keys   = shapes.map(sh => sh.notes.map(n => `${n.string}:${n.fret}`).join('|'))
        expect(new Set(keys).size).toBe(keys.length)
      }
    }
  })

  it('counts open strings towards the reach', () => {
    for (const s of stringSets(standard)) {
      for (let root = 0; root < 12; root++) {
        for (const sh of triadShapes(chord(root as PitchClass, 'maj'), standard, s, { maxSpan: 4 })) {
          const frets = sh.notes.map(n => n.fret)
          expect(Math.max(...frets) - Math.min(...frets)).toBeLessThanOrEqual(4)
          expect(sh.span).toBe(Math.max(...frets) - Math.min(...frets))
        }
      }
    }
  })

  it('is ordered up the neck', () => {
    const shapes = triadShapes(chord(0, 'maj'), standard, set)
    const frets  = shapes.map(s => s.lowestFret)
    expect([...frets].sort((a, b) => a - b)).toEqual(frets)
  })
})
