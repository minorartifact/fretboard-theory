import { create } from 'zustand'
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

export const useTheoryStore = create<TheoryState & TheoryActions>(set => ({
  root:           0,
  scale:          SCALES_BY_ID['major'],
  chordQualityId: null,
  setRoot:           root           => set({ root }),
  setScale:          scale          => set({ scale }),
  setChordQualityId: chordQualityId => set({ chordQualityId }),
}))
