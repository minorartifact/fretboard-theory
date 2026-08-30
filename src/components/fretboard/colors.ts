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
