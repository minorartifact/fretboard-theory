import { describe, it, expect } from 'vitest'
import {
  CIRCLE_OF_FIFTHS, cursorForKey, getKeySignature, getKeyWedges, ringLabel, ringRoot, spellInKey,
} from '../keys'
import { SCALES_BY_ID, getScaleNotes } from '../scales'
import { getPitchNameForDegree } from '../pitch'
import type { PitchClass } from '../types'

describe('CIRCLE_OF_FIFTHS', () => {
  it('holds all twelve pitch classes once', () => {
    expect([...CIRCLE_OF_FIFTHS].sort((a, b) => a - b)).toEqual([0,1,2,3,4,5,6,7,8,9,10,11])
  })

  it('steps a perfect fifth at a time, all the way round', () => {
    CIRCLE_OF_FIFTHS.forEach((pc, i) => {
      const next = CIRCLE_OF_FIFTHS[(i + 1) % 12]
      expect((next - pc + 12) % 12).toBe(7)
    })
  })
})

describe('getKeySignature', () => {
  it('gives C major no accidentals', () => {
    expect(getKeySignature(0)).toEqual({ accidental: null, notes: [] })
  })

  it('counts sharps up the fifths side', () => {
    expect(getKeySignature(7)).toEqual({ accidental: '#', notes: ['F'] })                 // G
    expect(getKeySignature(2)).toEqual({ accidental: '#', notes: ['F', 'C'] })            // D
    expect(getKeySignature(4).notes).toEqual(['F', 'C', 'G', 'D'])                        // E
    expect(getKeySignature(11).notes).toEqual(['F', 'C', 'G', 'D', 'A'])                  // B
  })

  it('counts flats down the fourths side', () => {
    expect(getKeySignature(5)).toEqual({ accidental: 'b', notes: ['B'] })                 // F
    expect(getKeySignature(10)).toEqual({ accidental: 'b', notes: ['B', 'E'] })           // Bb
    expect(getKeySignature(3).notes).toEqual(['B', 'E', 'A'])                             // Eb
    expect(getKeySignature(1).notes).toEqual(['B', 'E', 'A', 'D', 'G'])                   // Db
  })

  it('settles F# as six sharps rather than six flats', () => {
    expect(getKeySignature(6)).toEqual({ accidental: '#', notes: ['F','C','G','D','A','E'] })
  })

  it('never writes more than seven accidentals', () => {
    for (let pc = 0; pc < 12; pc++) {
      expect(getKeySignature(pc as PitchClass).notes.length).toBeLessThanOrEqual(7)
    }
  })
})

describe('getKeyWedges', () => {
  const wedges = getKeyWedges()

  it('offers twelve wedges', () => {
    expect(wedges).toHaveLength(12)
  })

  it('pairs each major with its relative minor a minor third below', () => {
    const c = wedges[0]
    expect(c.major).toBe(0)
    expect(c.minor).toBe(9)   // Am
    expect(c.dim).toBe(11)    // B dim
  })

  // The three rings are only honest if they really are one key: the notes of
  // the relative minor and the leading-tone diminished mode must be the notes
  // of the parent major, or the wheel would relabel the neck when you switch ring.
  it('keeps all three rings inside the same seven notes', () => {
    const set = (pcs: PitchClass[]) => [...pcs].sort((a, b) => a - b).join(',')
    for (const w of wedges) {
      const major = set(getScaleNotes(w.major, SCALES_BY_ID['major']))
      expect(set(getScaleNotes(w.minor, SCALES_BY_ID['aeolian']))).toBe(major)
      expect(set(getScaleNotes(w.dim, SCALES_BY_ID['locrian']))).toBe(major)
    }
  })
})

describe('spellInKey', () => {
  it('spells the relative minor against its parent, not its own preference', () => {
    // E major has four sharps, so its relative minor is C# minor — never Db minor.
    expect(spellInKey(1, 4)).toBe('C♯')
    // Db major has five flats, so its relative minor is Bb minor.
    expect(spellInKey(10, 1)).toBe('B♭')
  })

  it('renders accidentals as real glyphs', () => {
    expect(spellInKey(6, 6)).toBe('F♯')
    expect(spellInKey(3, 3)).toBe('E♭')
  })

  it('spells by degree where a key needs an enharmonic the tables lack', () => {
    // F# major's seventh is E#. Read as a bare pitch class it comes out F,
    // which puts an F twice in a key that must have seven distinct letters.
    expect(spellInKey(5, 6)).toBe('F')          // no degree: the old, wrong answer
    expect(spellInKey(5, 6, '7')).toBe('E♯')    // as the seventh: right
  })
})

describe('key spelling matches the fretboard', () => {
  // The neck spells every note against the degree it plays (annotation.ts).
  // The wheel must agree, or the overlay and the board name the same note
  // differently — which is exactly what happened in F# major.
  it('agrees with getPitchNameForDegree for every major key', () => {
    const scale = SCALES_BY_ID['major']
    for (let root = 0 as PitchClass; root < 12; root++) {
      const pcs   = getScaleNotes(root, scale)
      const wheel = pcs.map((pc, i) => spellInKey(pc, root, scale.degrees[i]))
      const neck  = pcs.map((pc, i) => getPitchNameForDegree(pc, root, scale.degrees[i]))
      expect(wheel.map(n => n.replace('♯', '#').replace('♭', 'b'))).toEqual(neck)
    }
  })

  it('gives every major key seven distinct letters', () => {
    const scale = SCALES_BY_ID['major']
    for (let root = 0 as PitchClass; root < 12; root++) {
      const letters = getScaleNotes(root, scale)
        .map((pc, i) => spellInKey(pc, root, scale.degrees[i])[0])
      expect(new Set(letters).size).toBe(7)
    }
  })
})

describe('ringLabel', () => {
  const wedges = getKeyWedges()
  const at = (pc: PitchClass) => wedges[CIRCLE_OF_FIFTHS.indexOf(pc)]

  it('reads the way the printed card does', () => {
    expect(ringLabel(at(0), 'major')).toBe('C')
    expect(ringLabel(at(0), 'minor')).toBe('Am')
    expect(ringLabel(at(0), 'dim')).toBe('B°')
  })

  it('labels the diminished of F# as E#°, not F°', () => {
    expect(ringLabel(at(6), 'dim')).toBe('E♯°')
    expect(ringLabel(at(6), 'minor')).toBe('D♯m')
  })

  it('spells sharp keys against the parent signature', () => {
    expect(ringLabel(at(4), 'minor')).toBe('C♯m')   // E major → C#m, not Dbm
    expect(ringLabel(at(4), 'dim')).toBe('D♯°')
  })
})

describe('cursorForKey', () => {
  it('finds the wedge for each ring', () => {
    expect(cursorForKey(0, 'major')).toEqual({ index: 0, ring: 'major' })
    expect(cursorForKey(9, 'aeolian')).toEqual({ index: 0, ring: 'minor' })  // Am sits in C
    expect(cursorForKey(11, 'locrian')).toEqual({ index: 0, ring: 'dim' })   // B° sits in C
  })

  it('has no wedge for a scale no key signature describes', () => {
    expect(cursorForKey(0, 'lydian')).toBeNull()
    expect(cursorForKey(0, 'minor-pentatonic')).toBeNull()
    expect(cursorForKey(0, undefined)).toBeNull()
  })

  // Round trip: whatever the wheel commits must be what it then lights up.
  it('round-trips every wedge it can produce', () => {
    for (const w of getKeyWedges()) {
      for (const ring of ['major', 'minor', 'dim'] as const) {
        const scaleId = { major: 'major', minor: 'aeolian', dim: 'locrian' }[ring]
        expect(cursorForKey(ringRoot(w, ring), scaleId)).toEqual({ index: w.index, ring })
      }
    }
  })
})
