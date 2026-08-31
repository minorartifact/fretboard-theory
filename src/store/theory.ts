import { create } from 'zustand'
import { invalidateForScaleChange } from './invalidation'
import type { PitchClass } from '../theory/types'
import type { ScaleDef } from '../theory/types'
import { SCALES_BY_ID } from '../theory/scales'

interface TheoryState {
  root:           PitchClass
  scale:          ScaleDef | null
  /** Quality-selector chord: root always follows the main root. */
  chordQualityId: string | null
}

interface TheoryActions {
  setRoot:           (root: PitchClass)       => void
  setScale:          (scale: ScaleDef | null) => void
  setChordQualityId: (id: string | null)      => void
}

export const useTheoryStore = create<TheoryState & TheoryActions>((set, get) => ({
  root:           0,
  scale:          SCALES_BY_ID['major'],
  chordQualityId: null,
  setRoot:           root           => set({ root }),
  setChordQualityId: chordQualityId => set({ chordQualityId }),

  setScale: scale => {
    if (get().scale?.id !== scale?.id) invalidateForScaleChange()
    set({ scale })
  },
}))
