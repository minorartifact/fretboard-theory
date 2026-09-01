import { create } from 'zustand'
import type { PitchClass } from '../theory/types'
import type { Inversion } from '../theory/triads'

export interface PinnedNote {
  string: number
  fret:   number
  pc:     PitchClass
  midi:   number
}

export const POSITIONS = [
  { lo: 0,  hi: 4,  label: '0–4'   },
  { lo: 2,  hi: 6,  label: '2–6'   },
  { lo: 4,  hi: 8,  label: '4–8'   },
  { lo: 7,  hi: 11, label: '7–11'  },
  { lo: 9,  hi: 13, label: '9–13'  },
  { lo: 12, hi: 15, label: '12–15' },
] as const

/**
 * The fretboard's view modes are mutually exclusive — each one owns the fret
 * click and the dot treatment, so only one can be active. 'explore' is the
 * default, no-mode state.
 */
export type FretboardMode = 'explore' | 'identify' | 'chords' | 'intervals'

/**
 * How Chords mode draws the chord. Voicings are database fingerings and exist
 * only in standard tuning; triads are computed, so they work everywhere.
 */
export type ChordShape = 'voicings' | 'triads'

/** `null` shows all three inversions at once, as the printed card does. */
export type TriadFilter = Inversion | null

interface InteractiveState {
  hoverPc:           PitchClass | null
  posIdx:            number | null
  mode:              FretboardMode
  pinned:            PinnedNote[]
  selectedIntervals: number[]          // semitone offsets 0–11
  anchor:            PinnedNote | null // null ⇒ follow the current root
  chordShape:        ChordShape
  /** Index into `stringSets(tuning)`. Clamped on read, never on write. */
  triadSet:          number
  triadInversion:    TriadFilter
}

interface InteractiveActions {
  setHoverPc:     (pc: PitchClass | null)   => void
  setPosIdx:      (idx: number | null)      => void
  setMode:        (mode: FretboardMode)     => void
  togglePin:      (note: PinnedNote)        => void
  clearPins:      ()                        => void
  toggleInterval: (semi: number)            => void
  clearIntervals: ()                        => void
  setAnchor:      (note: PinnedNote | null) => void
  clearSelection: ()                        => void
  setChordShape:     (shape: ChordShape)    => void
  setTriadSet:       (idx: number)          => void
  setTriadInversion: (inv: TriadFilter)     => void
}

export const useInteractiveStore = create<InteractiveState & InteractiveActions>(set => ({
  hoverPc:           null,
  posIdx:            null,
  mode:              'explore',
  pinned:            [],
  selectedIntervals: [],
  anchor:            null,
  chordShape:        'voicings',
  triadSet:          3,          // the top three strings, where the card starts
  triadInversion:    null,

  setChordShape:     chordShape => set({ chordShape }),
  setTriadSet:       triadSet   => set({ triadSet }),
  setTriadInversion: inv        => set({ triadInversion: inv }),

  setHoverPc: pc   => set({ hoverPc: pc }),
  setPosIdx:  idx  => set({ posIdx: idx }),
  clearPins:  ()   => set({ pinned: [] }),
  setAnchor:  note => set({ anchor: note }),

  // Modes are exclusive, so none of them should inherit the last one's marks.
  // Pins only mean something inside identify mode, and an interval selection
  // only means something against its anchor — carried into explore, where the
  // anchor is forced back to the root, the same selection lights different
  // notes without anything saying so. Re-selecting the current mode is a no-op
  // rather than a reset.
  setMode: mode => set(s => s.mode === mode
    ? {}
    : { mode, pinned: [], selectedIntervals: [], anchor: null }),

  clearIntervals: () => set({ selectedIntervals: [], anchor: null }),
  clearSelection: () => set({
    hoverPc: null,
    pinned: [],
    selectedIntervals: [],
    anchor: null,
  }),

  toggleInterval: semi => set(s => ({
    selectedIntervals: s.selectedIntervals.includes(semi)
      ? s.selectedIntervals.filter(v => v !== semi)
      : [...s.selectedIntervals, semi].sort((a, b) => a - b),
  })),

  togglePin: note => set(s => {
    const exists = s.pinned.some(p => p.string === note.string && p.fret === note.fret)
    return {
      pinned: exists
        ? s.pinned.filter(p => !(p.string === note.string && p.fret === note.fret))
        : [...s.pinned, note],
    }
  }),
}))
