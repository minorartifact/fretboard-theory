import type { ScaleDef, PitchClass } from './types'

export const SCALES: ScaleDef[] = [
  // ── Major modes ──────────────────────────────────────────────────────────
  { id: 'major',      name: 'Major (Ionian)',          category: 'Major Modes',
    pattern: [0,2,4,5,7,9,11], degrees: ['1','2','3','4','5','6','7'] },
  { id: 'dorian',     name: 'Dorian',                  category: 'Major Modes',
    pattern: [0,2,3,5,7,9,10], degrees: ['1','2','b3','4','5','6','b7'] },
  { id: 'phrygian',   name: 'Phrygian',                category: 'Major Modes',
    pattern: [0,1,3,5,7,8,10], degrees: ['1','b2','b3','4','5','b6','b7'] },
  { id: 'lydian',     name: 'Lydian',                  category: 'Major Modes',
    pattern: [0,2,4,6,7,9,11], degrees: ['1','2','3','#4','5','6','7'] },
  { id: 'mixolydian', name: 'Mixolydian',              category: 'Major Modes',
    pattern: [0,2,4,5,7,9,10], degrees: ['1','2','3','4','5','6','b7'] },
  { id: 'aeolian',    name: 'Natural Minor (Aeolian)', category: 'Major Modes',
    pattern: [0,2,3,5,7,8,10], degrees: ['1','2','b3','4','5','b6','b7'] },
  { id: 'locrian',    name: 'Locrian',                 category: 'Major Modes',
    pattern: [0,1,3,5,6,8,10], degrees: ['1','b2','b3','4','b5','b6','b7'] },

  // ── Melodic Minor modes ──────────────────────────────────────────────────
  { id: 'melodic-minor',   name: 'Melodic Minor',          category: 'Melodic Minor',
    pattern: [0,2,3,5,7,9,11], degrees: ['1','2','b3','4','5','6','7'] },
  { id: 'dorian-b2',       name: 'Dorian b2',              category: 'Melodic Minor',
    pattern: [0,1,3,5,7,9,10], degrees: ['1','b2','b3','4','5','6','b7'] },
  { id: 'lydian-aug',      name: 'Lydian Augmented',       category: 'Melodic Minor',
    pattern: [0,2,4,6,8,9,11], degrees: ['1','2','3','#4','#5','6','7'] },
  { id: 'lydian-dom',      name: 'Lydian Dominant',        category: 'Melodic Minor',
    pattern: [0,2,4,6,7,9,10], degrees: ['1','2','3','#4','5','6','b7'] },
  { id: 'mixolydian-b6',   name: 'Mixolydian b6',          category: 'Melodic Minor',
    pattern: [0,2,4,5,7,8,10], degrees: ['1','2','3','4','5','b6','b7'] },
  { id: 'locrian-sharp2',  name: 'Locrian #2',             category: 'Melodic Minor',
    pattern: [0,2,3,5,6,8,10], degrees: ['1','2','b3','4','b5','b6','b7'] },
  { id: 'altered',         name: 'Altered (Super Locrian)', category: 'Melodic Minor',
    pattern: [0,1,3,4,6,8,10], degrees: ['1','b2','#2','3','b5','#5','b7'] },

  // ── Harmonic Minor modes ─────────────────────────────────────────────────
  { id: 'harmonic-minor',  name: 'Harmonic Minor',         category: 'Harmonic Minor',
    pattern: [0,2,3,5,7,8,11], degrees: ['1','2','b3','4','5','b6','7'] },
  { id: 'locrian-sharp6',  name: 'Locrian #6',             category: 'Harmonic Minor',
    pattern: [0,1,3,5,6,9,10], degrees: ['1','b2','b3','4','b5','6','b7'] },
  { id: 'ionian-sharp5',   name: 'Ionian #5',              category: 'Harmonic Minor',
    pattern: [0,2,4,5,8,9,11], degrees: ['1','2','3','4','#5','6','7'] },
  { id: 'dorian-sharp4',   name: 'Dorian #4',              category: 'Harmonic Minor',
    pattern: [0,2,3,6,7,9,10], degrees: ['1','2','b3','#4','5','6','b7'] },
  { id: 'phrygian-dom',    name: 'Phrygian Dominant',      category: 'Harmonic Minor',
    pattern: [0,1,4,5,7,8,10], degrees: ['1','b2','3','4','5','b6','b7'] },
  { id: 'lydian-sharp2',   name: 'Lydian #2',              category: 'Harmonic Minor',
    pattern: [0,3,4,6,7,9,11], degrees: ['1','#2','3','#4','5','6','7'] },
  { id: 'ultralocrian',    name: 'Ultralocrian',           category: 'Harmonic Minor',
    pattern: [0,1,3,4,6,8,9], degrees: ['1','b2','b3','b4','b5','b6','bb7'] },

  // ── Pentatonic & Blues ───────────────────────────────────────────────────
  { id: 'major-pentatonic', name: 'Major Pentatonic', category: 'Pentatonic & Blues',
    pattern: [0,2,4,7,9],    degrees: ['1','2','3','5','6'] },
  { id: 'minor-pentatonic', name: 'Minor Pentatonic', category: 'Pentatonic & Blues',
    pattern: [0,3,5,7,10],   degrees: ['1','b3','4','5','b7'] },
  { id: 'blues',            name: 'Blues Scale',      category: 'Pentatonic & Blues',
    pattern: [0,3,5,6,7,10], degrees: ['1','b3','4','b5','5','b7'] },
  { id: 'major-blues',      name: 'Major Blues',      category: 'Pentatonic & Blues',
    pattern: [0,2,3,4,7,9],  degrees: ['1','2','b3','3','5','6'] },

  // ── Symmetric ────────────────────────────────────────────────────────────
  { id: 'whole-tone', name: 'Whole Tone',              category: 'Symmetric',
    pattern: [0,2,4,6,8,10],      degrees: ['1','2','3','#4','#5','b7'] },
  { id: 'dim-hw',     name: 'Diminished (Half-Whole)', category: 'Symmetric',
    pattern: [0,1,3,4,6,7,9,10],  degrees: ['1','b2','b3','3','b5','5','6','b7'] },
  { id: 'dim-wh',     name: 'Diminished (Whole-Half)', category: 'Symmetric',
    pattern: [0,2,3,5,6,8,9,11],  degrees: ['1','2','b3','4','b5','b6','6','7'] },
  { id: 'chromatic',  name: 'Chromatic',               category: 'Symmetric',
    pattern: [0,1,2,3,4,5,6,7,8,9,10,11],
    degrees: ['1','b2','2','b3','3','4','b5','5','b6','6','b7','7'] },
]

export const SCALES_BY_ID: Record<string, ScaleDef> =
  Object.fromEntries(SCALES.map(s => [s.id, s]))

export function getScaleNotes(root: PitchClass, scale: ScaleDef): PitchClass[] {
  return scale.pattern.map(offset => ((root + offset) % 12) as PitchClass)
}

export function isInScale(pc: PitchClass, root: PitchClass, scale: ScaleDef): boolean {
  const offset = (pc - root + 12) % 12
  return scale.pattern.includes(offset)
}

/** Returns the degree label (e.g. 'b3') if `pc` is in the scale, otherwise null. */
export function getScaleDegreeLabel(
  pc: PitchClass,
  root: PitchClass,
  scale: ScaleDef,
): string | null {
  const offset = (pc - root + 12) % 12
  const idx = scale.pattern.indexOf(offset)
  return idx !== -1 ? scale.degrees[idx] : null
}
