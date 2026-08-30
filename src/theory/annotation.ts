import type { FretboardNote, NoteAnnotation, NoteRole, AnnotationContext } from './types'
import { getPitchName, getPitchNameForDegree, intervalBetween } from './pitch'
import { isInScale, getScaleDegreeLabel } from './scales'
import { isInChord, getChordToneRole, getChordToneLabel } from './chords'
import { SEMITONE_TO_DEGREE, SEMITONE_TO_INTERVAL } from './constants'

export function annotateNote(note: FretboardNote, ctx: AnnotationContext): NoteAnnotation {
  const { root, scale, chord, labelMode, spelling } = ctx
  let semitones    = intervalBetween(root, note.pitchClass)
  let pitchName    = getPitchName(note.pitchClass, spelling, root)
  let role: NoteRole
  let degreeLabel    = SEMITONE_TO_DEGREE[semitones]
  let highlighted: boolean

  if (chord && isInChord(note.pitchClass, chord)) {
    semitones   = intervalBetween(chord.root, note.pitchClass)
    role        = getChordToneRole(note.pitchClass, chord) ?? 'chord-tone'
    degreeLabel = getChordToneLabel(note.pitchClass, chord) ?? degreeLabel
    if (spelling === 'auto') pitchName = getPitchNameForDegree(note.pitchClass, chord.root, degreeLabel)
    highlighted = true
  } else if (scale && isInScale(note.pitchClass, root, scale)) {
    role        = 'scale-degree'
    degreeLabel = getScaleDegreeLabel(note.pitchClass, root, scale) ?? degreeLabel
    if (spelling === 'auto') pitchName = getPitchNameForDegree(note.pitchClass, root, degreeLabel)
    highlighted = true
  } else if (scale) {
    role        = 'chromatic'
    highlighted = false
  } else {
    // No scale or chord active: highlight every note
    role        = 'scale-degree'
    highlighted = true
  }

  const label =
    labelMode === 'note'     ? pitchName :
    labelMode === 'degree'   ? degreeLabel :
    /* interval */             SEMITONE_TO_INTERVAL[semitones]

  return { fretboardNote: note, role, label, highlighted, pitchName, degreeLabel, semitones }
}

/**
 * Annotate every cell in `grid` that falls within `ctx.fretRange`.
 * Returns a 2-D array with the same string ordering as the input grid.
 */
export function annotateGrid(
  grid: FretboardNote[][],
  ctx: AnnotationContext,
): NoteAnnotation[][] {
  const { startFret, endFret } = ctx.fretRange
  return grid.map(string =>
    string
      .filter(note => note.fret >= startFret && note.fret <= endFret)
      .map(note => annotateNote(note, ctx)),
  )
}
