import { useMemo, useEffect, useState } from 'react'
import { useTheoryStore } from '../store/theory'
import { useFretboardStore } from '../store/fretboard'
import { useViewStore } from '../store/view'
import { useProgressionStore, useDisplayedStep } from '../store/progression'
import { useInteractiveStore } from '../store/interactive'
import { buildFretboardGrid } from '../theory/fretboard'
import { annotateGrid } from '../theory/annotation'
import { CHORD_QUALITIES_BY_ID } from '../theory/chords'
import { resolveProgression } from '../theory/progression'
import { getChordVoicings, loadChordDb, isChordDbLoaded } from '../theory/chordVoicings'
import type { Chord } from '../theory/types'
import type { ChordVoicing } from '../theory/chordVoicings'

export function useFretboardAnnotations(): {
  annotations:  ReturnType<typeof annotateGrid>
  voicings:     ChordVoicing[]
} {
  const root           = useTheoryStore(s => s.root)
  const scale          = useTheoryStore(s => s.scale)
  const chordQualityId = useTheoryStore(s => s.chordQualityId)
  const progSteps      = useProgressionStore(s => s.steps)
  const step           = useDisplayedStep()
  const tuning         = useFretboardStore(s => s.tuning)
  const fretCount      = useFretboardStore(s => s.fretCount)
  const startFret      = useFretboardStore(s => s.startFret)
  const labelMode      = useViewStore(s => s.labelMode)
  const voicingMode    = useInteractiveStore(s => s.mode === 'chords')

  // The chord database is fetched the first time Chords mode is entered; this
  // flag re-runs the memo once it lands.
  const [dbReady, setDbReady] = useState(isChordDbLoaded)
  useEffect(() => {
    if (!voicingMode || dbReady) return
    let cancelled = false
    loadChordDb().then(() => { if (!cancelled) setDbReady(isChordDbLoaded()) })
    return () => { cancelled = true }
  }, [voicingMode, dbReady])

  return useMemo(() => {
    let chord: Chord | null = null
    if (step != null && progSteps.length > 0 && scale) {
      try {
        const resolved = resolveProgression(root, scale, { steps: progSteps })
        chord = resolved[step] ?? null
      } catch { chord = null }
    }
    if (!chord && chordQualityId) {
      const quality = CHORD_QUALITIES_BY_ID[chordQualityId]
      if (quality) chord = { root, quality }
    }

    // In voicing mode, default to major triad so roles (root/third/fifth) are
    // always set — enabling proper dimming even with no explicit chord active.
    const voicingChord: Chord = chord ?? { root, quality: CHORD_QUALITIES_BY_ID['maj'] }
    const annotationChord     = voicingMode ? voicingChord : chord

    const grid = buildFretboardGrid(tuning, fretCount)
    const annotations = annotateGrid(grid, {
      root,
      scale,
      chord: annotationChord,
      labelMode,
      spelling: 'auto',
      fretRange: { startFret, endFret: startFret + fretCount },
    })

    const voicings: ChordVoicing[] = voicingMode && dbReady
      ? getChordVoicings(voicingChord, tuning)
      : []

    return { annotations, voicings }
  }, [root, scale, chordQualityId, progSteps, step, tuning, fretCount, startFret, labelMode, voicingMode, dbReady])
}
