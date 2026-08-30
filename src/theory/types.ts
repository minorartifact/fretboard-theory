export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

export type SpellingPreference = 'auto' | 'sharps' | 'flats'

export interface ScaleDef {
  id: string
  name: string
  category: string
  pattern: number[]    // sorted semitone offsets from root, always starts with 0
  degrees: string[]    // degree labels, parallel to pattern (e.g. 'b3', '#4')
}

export interface ChordQuality {
  id: string
  name: string
  symbol: string       // display symbol: 'maj7', 'm7', '°', etc.
  pattern: number[]    // semitone offsets from root; chord-tone order, not always ascending
  degreeLabels: string[]
}

export interface Chord {
  root: PitchClass
  quality: ChordQuality
}

export interface Tuning {
  id: string
  name: string
  openNotes: number[]  // MIDI note numbers, low string first
}

export interface FretboardNote {
  string: number       // 0 = lowest string
  fret: number         // 0 = open string
  midiNote: number
  pitchClass: PitchClass
}

export type NoteRole =
  | 'root'
  | 'chord-third'
  | 'chord-fifth'
  | 'chord-seventh'
  | 'chord-tone'       // other chord tones (extensions)
  | 'scale-degree'     // in scale but not active chord
  | 'chromatic'        // not in active scale
  | 'inactive'

export type LabelMode = 'note' | 'interval' | 'degree'

export type HighlightMode = 'scale' | 'chord' | 'all' | 'custom'

export interface FretRange {
  startFret: number
  endFret: number
}

export interface AnnotationContext {
  root: PitchClass
  scale: ScaleDef | null
  chord: Chord | null
  labelMode: LabelMode
  spelling: SpellingPreference
  fretRange: FretRange
}

export interface NoteAnnotation {
  fretboardNote: FretboardNote
  role: NoteRole
  label: string
  highlighted: boolean
  pitchName: string
  degreeLabel: string
  semitones: number    // interval from the active annotation root, 0-11
}
