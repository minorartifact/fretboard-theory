import { create } from 'zustand'
import { TUNINGS_BY_ID } from '../theory/fretboard'
import { useInteractiveStore, POSITIONS } from './interactive'
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
  // A position window that runs past the end of the neck leaves nearly every
  // dot out-of-window, and out-of-window dots are not pointer targets — so a
  // shorter neck could render the fretboard inert. Drop the window instead.
  setFretCount: fretCount => {
    const { posIdx, setPosIdx } = useInteractiveStore.getState()
    if (posIdx !== null && (POSITIONS[posIdx]?.hi ?? 0) > fretCount) setPosIdx(null)
    set({ fretCount })
  },
  setStartFret: startFret => set({ startFret }),
}))
