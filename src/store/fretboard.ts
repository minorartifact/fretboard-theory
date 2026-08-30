import { create } from 'zustand'
import { TUNINGS_BY_ID } from '../theory/fretboard'
import type { Tuning } from '../theory/types'

interface FretboardState {
  tuning:    Tuning
  fretCount: number
  startFret: number
}

interface FretboardActions {
  setTuning:    (tuning: Tuning) => void
  setFretCount: (count: number) => void
  setStartFret: (fret: number)  => void
}

export const useFretboardStore = create<FretboardState & FretboardActions>(set => ({
  tuning:    TUNINGS_BY_ID['standard'],
  fretCount: 15,
  startFret: 0,
  setTuning:    tuning    => set({ tuning }),
  setFretCount: fretCount => set({ fretCount }),
  setStartFret: startFret => set({ startFret }),
}))
