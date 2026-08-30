import { create } from 'zustand'
import type { PitchClass } from '../theory/types'

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

interface InteractiveState {
  hoverPc:           PitchClass | null
  posIdx:            number | null
  mode:              FretboardMode
  pinned:            PinnedNote[]
  selectedIntervals: number[]          // semitone offsets 0–11
  anchor:            PinnedNote | null // null ⇒ follow the current root
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
}

export const useInteractiveStore = create<InteractiveState & InteractiveActions>(set => ({
  hoverPc:           null,
  posIdx:            null,
  mode:              'explore',
  pinned:            [],
  selectedIntervals: [],
  anchor:            null,

  setHoverPc: pc   => set({ hoverPc: pc }),
  setPosIdx:  idx  => set({ posIdx: idx }),
  clearPins:  ()   => set({ pinned: [] }),
  setAnchor:  note => set({ anchor: note }),

  // Pins only mean something inside identify mode.
  setMode: mode => set({ mode, pinned: [] }),

  clearIntervals: () => set({ selectedIntervals: [], anchor: null }),

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
