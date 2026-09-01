import type { NoteRole } from '../../theory/types'

// Degree fill colours (index = degree number 1–7).
export const DEGREE_FILLS = [
  '',          // 0 unused
  '#e0564f',   // 1  root
  '#e07c30',   // 2
  '#cbb02e',   // 3
  '#54a64f',   // 4
  '#3897d6',   // 5
  '#7a57d6',   // 6
  '#c23bb6',   // 7
]

// Degrees whose fill is light enough to need dark label text.
const DARK_TEXT_DEGREES = new Set([3, 4])

const DARK_TEXT  = '#241a12'
const LIGHT_TEXT = '#fff'

const CHORD_TONE_ROLES: ReadonlySet<NoteRole> = new Set([
  'root', 'chord-third', 'chord-fifth', 'chord-seventh', 'chord-tone',
])

export function isChordTone(role: NoteRole): boolean {
  return CHORD_TONE_ROLES.has(role)
}

/** Degree number 1–7 parsed out of a degree label such as '1', 'b3' or '#4'. */
export function degreeNumber(label: string): number {
  const m = label.match(/\d+/)
  return m ? Math.min(7, parseInt(m[0])) : 1
}

/** Dot/chip fill for a degree label. */
export function degreeFill(label: string): string {
  return DEGREE_FILLS[degreeNumber(label)] ?? DEGREE_FILLS[1]
}

/** Dot/chip fill for a degree already known as a number 1–7. */
export function degreeFillFor(degree: number): string {
  return DEGREE_FILLS[Math.max(1, Math.min(7, degree))] ?? DEGREE_FILLS[1]
}

/** Label colour that stays legible on top of `degreeFill(label)`. */
export function degreeTextColor(label: string): string {
  return DARK_TEXT_DEGREES.has(degreeNumber(label)) ? DARK_TEXT : LIGHT_TEXT
}

/**
 * Position markers — frets 3, 5, 7, 9, 12, 15.
 *
 * These have to compete with the out-of-scale dots, which are drawn at every
 * unused position on every string. An inlay used to be *smaller* than one of
 * those (r 5.5 against r 6) and barely warmer, so the landmark was the least
 * visible thing in a field of near-identical specks and the only way to know
 * where you were was to read the numbers under the neck.
 *
 * So the wash down the fret carries it instead: it lives behind everything, so
 * it cannot be crowded out however dense the dots get, and it is readable in
 * peripheral vision — which is the point, since the complaint was having to
 * look down at the numbers. The dot stays as texture at its original radius:
 * mid-neck is only ~20px from the two centre strings and a note dot is r15.5,
 * so anything larger grows a visible bump on the note above it. It keeps the
 * warmer pearl colour so it still outranks a grey chromatic speck.
 *
 * Colour separates the two jobs, and that separation is the point. Gold
 * (`#e0a85a`) means *state* everywhere in this app — the position window, the
 * current key on the wheel, a keycap. Pearl means *landmark*: the inlay dot and
 * this band, permanent features of the neck that are never "on". Painting the
 * markers gold cost the position window its crispness, because the accent that
 * used to mark it was suddenly spread across six frets of every neck.
 */
export const INLAY = {
  fill:    '#d9c49a',
  opacity: 0.62,
  /** Fret-wide wash behind the strings. */
  band:        'rgba(217,196,154,.075)',
  /** The octave earns a little more, the way a real neck gives 12 two dots. */
  bandOctave:  'rgba(217,196,154,.12)',
} as const

/**
 * The position window — the frets currently in play.
 *
 * This one is state, so it owns the gold accent (see `INLAY`: pearl is for
 * landmarks). The outline does the recognising, not the fill: a wash this faint
 * cannot mark a boundary on its own, and raising it instead would dim the notes
 * inside the very window meant to draw attention to them.
 */
export const POSITION_WINDOW = {
  fill:        'rgba(224,168,90,.07)',
  stroke:      'rgba(224,168,90,.5)',
  strokeWidth: 2,
} as const
