import type { Ring } from '../../theory/keys'

/**
 * Where every part of the key wheel sits. Kept out of the component so the file
 * exporting them is not also a component — fast refresh only works when a
 * module exports components alone.
 */

export const SIZE = 520
export const CX   = SIZE / 2
export const CY   = SIZE / 2

export const R_TAB   = 252
const R_OUTER = 214
const R_MID   = 166
const R_INNER = 118
export const R_HOLE = 70

export const BAND: Record<Ring, { outer: number; inner: number; font: number }> = {
  major: { outer: R_OUTER, inner: R_MID,   font: 25 },
  minor: { outer: R_MID,   inner: R_INNER, font: 17 },
  dim:   { outer: R_INNER, inner: R_HOLE,  font: 13 },
}

const WEDGE = (Math.PI * 2) / 12

/** Wedge i spans a twelfth of the circle, centred on 12 o'clock for i = 0. */
export function wedgeAngles(i: number) {
  const centre = i * WEDGE - Math.PI / 2
  return { from: centre - WEDGE / 2, to: centre + WEDGE / 2, centre }
}

export function polar(r: number, a: number) {
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }
}

/** An annular sector — the wedge shape each ring segment is drawn as. */
export function segmentPath(i: number, outer: number, inner: number, gap = 0.008): string {
  const { from, to } = wedgeAngles(i)
  const a0 = from + gap
  const a1 = to - gap
  const o0 = polar(outer, a0)
  const o1 = polar(outer, a1)
  const i1 = polar(inner, a1)
  const i0 = polar(inner, a0)
  return [
    `M ${o0.x} ${o0.y}`,
    `A ${outer} ${outer} 0 0 1 ${o1.x} ${o1.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${inner} ${inner} 0 0 0 ${i0.x} ${i0.y}`,
    'Z',
  ].join(' ')
}

/**
 * Ring labels run *along* the ring, like the printed card: upright at twelve
 * o'clock, turning with the circle, and flipped through the bottom half so no
 * key is ever upside down. (Radial instead of tangential lays C on its side at
 * the top, which is the first thing that looks wrong.)
 */
export function labelAngle(centre: number): number {
  const deg  = (centre * 180) / Math.PI + 90
  const norm = ((deg % 360) + 360) % 360
  return norm > 90 && norm < 270 ? deg + 180 : deg
}

/** Radial text, for the signature tabs outside the rim. */
export function tabAngle(centre: number): number {
  const deg = (centre * 180) / Math.PI
  return Math.cos(centre) < 0 ? deg + 180 : deg
}
