import { useEffect, useRef } from 'react'
import { useProgressionStore } from '../store/progression'
import { playChord } from '../audio/chordSynth'

/**
 * Plays a chord via Web Audio whenever the progression's active chord changes —
 * covers both: (a) the playhead moving to a different step, and (b) the chord
 * at the current step being replaced via the edit cursor.
 */
export function useProgressionAudio() {
  const activeStep = useProgressionStore(s => s.activeStep)
  const steps      = useProgressionStore(s => s.steps)

  const lastKeyRef    = useRef<string>('')
  const prevLenRef    = useRef(steps.length)

  useEffect(() => {
    const wasDeleted = steps.length < prevLenRef.current
    prevLenRef.current = steps.length

    if (wasDeleted) return  // never play on deletion

    if (activeStep === null) return
    const step = steps[activeStep]
    if (!step) return

    const key = `${activeStep}:${step.degree}:${step.qualityOverride?.id ?? ''}`
    if (key === lastKeyRef.current) return
    lastKeyRef.current = key

    const chord = useProgressionStore.getState().activeChord()
    if (chord) playChord(chord.root, chord.quality.pattern)
  }, [activeStep, steps])
}
