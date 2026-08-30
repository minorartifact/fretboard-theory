// All SVG coordinate constants for the fretboard canvas.
// Coordinate origin is top-left of the SVG element.
// High E (string 5) sits at the top; low E (string 0) at the bottom.

export const L = {
  paddingTop:    34,
  stringSpacing: 41,
  openColWidth:  58,
  nutWidth:       9,
  fretColWidth:  73,
  dotRadius:     15.5,
  inlayRadius:    5.5,

  // Padding from outermost string to neck edge (top and bottom)
  neckPad: 20,

  // String stroke widths, index 0 = low E, index 5 = high E
  stringWidths: [3.0, 2.4, 1.9, 1.5, 1.1, 0.8] as const,

  // String stroke colours (wound → plain, low to high)
  stringColors: ['#c89154','#ba864a','#ab7d40','#dad3c3','#d3cbba','#ccc4b3'] as const,
} as const

const NUM_STRINGS = 6

// Total SVG dimensions ---------------------------------------------------

export function svgWidth(fretCount: number): number {
  return L.openColWidth + L.nutWidth + fretCount * L.fretColWidth + 16
}

export function svgHeight(): number {
  return neckBottom() + 40
}

// Coordinate helpers -----------------------------------------------------

/** Y coordinate of string `stringIdx` (0=low E, 5=high E). High E is at top. */
export function stringY(stringIdx: number): number {
  const displayRow = (NUM_STRINGS - 1) - stringIdx
  return L.paddingTop + displayRow * L.stringSpacing
}

/** Top Y of the fretboard wood (above the highest string). */
export function neckTop(): number {
  return stringY(NUM_STRINGS - 1) - L.neckPad
}

/** Bottom Y of the fretboard wood (below the lowest string). */
export function neckBottom(): number {
  return stringY(0) + L.neckPad
}

/** Y centre of the neck (for on-neck inlay dots). */
export function neckMidY(): number {
  return (neckTop() + neckBottom()) / 2
}

/** Y coordinate of fret number labels (below the neck). */
export function fretNumY(): number {
  return neckBottom() + 24
}

/** X coordinate of the centre of the note dot at `fret`. */
export function cellX(fret: number): number {
  if (fret === 0) return L.openColWidth / 2
  const nutRight = L.openColWidth + L.nutWidth
  return nutRight + (fret - 0.5) * L.fretColWidth
}

/** X coordinate of the fret wire that appears AFTER fret `n`.
 *  n=0 gives the left edge of the nut (i.e. the open/fretted boundary). */
export function fretWireX(n: number): number {
  if (n === 0) return L.openColWidth
  const nutRight = L.openColWidth + L.nutWidth
  return nutRight + n * L.fretColWidth
}
