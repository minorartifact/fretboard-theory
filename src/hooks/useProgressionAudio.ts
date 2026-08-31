import { useEffect, useRef } from 'react'
import { useProgressionStore } from '../store/progression'
import { playChord } from '../audio/chordSynth'
import type { ProgressionStep } from '../theory/progression'

/** Identity of the chord a step will sound, for change detection. */
export function stepAudioKey(index: number, step: ProgressionStep): string {
  const quality  = step.qualityOverride?.id ?? ''
  const override = step.chordOverride
    ? `${step.chordOverride.root}.${step.chordOverride.quality.id}`
    : ''
  const secDom   = step.secondaryDominantOf ?? ''
  return `${index}:${step.degree}:${quality}:${override}:${secDom}`
}

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

    // The key must name every part of a step that changes which chord sounds.
    // Omitting chordOverride made replacing a diatonic chord with the secondary
    // dominant of the same degree silent — same degree, no qualityOverride on
    // either, so the key never changed.
    const key = stepAudioKey(activeStep, step)
    if (key === lastKeyRef.current) return
    lastKeyRef.current = key

    const chord = useProgressionStore.getState().activeChord()
    if (chord) playChord(chord.root, chord.quality.pattern)
  }, [activeStep, steps])
}
