import type { PitchClass, Chord, ChordQuality } from './types'
import type { ScaleDef } from './types'
import { CHORD_QUALITIES_BY_ID, getDiatonicChords } from './chords'

export interface ProgressionStep {
  degree: number           // 1-based scale degree
  chordOverride?: Chord    // optional: overrides the diatonic chord
  qualityOverride?: ChordQuality
  /** When set, this step is a secondary dominant (V7) of the named target degree (1-based). */
  secondaryDominantOf?: number
}

export interface Progression {
  steps: ProgressionStep[]
}

function steps(degrees: number[]): ProgressionStep[] {
  return degrees.map(degree => ({ degree }))
}

function dominantSteps(degrees: number[]): ProgressionStep[] {
  const dom7 = CHORD_QUALITIES_BY_ID['dom7']
  return degrees.map(degree => ({ degree, qualityOverride: dom7 }))
}

export const COMMON_PROGRESSIONS: Array<{ name: string; steps: ProgressionStep[] }> = [
  { name: 'I–IV–V–I',    steps: steps([1,4,5,1]) },
  { name: 'I–V–vi–IV',   steps: steps([1,5,6,4]) },
  { name: 'ii–V–I',      steps: steps([2,5,1]) },
  { name: 'I–vi–IV–V',   steps: steps([1,6,4,5]) },
  { name: 'vi–IV–I–V',   steps: steps([6,4,1,5]) },
  { name: 'I–IV–I–V',    steps: steps([1,4,1,5]) },
  { name: '12-Bar Blues', steps: dominantSteps([1,1,1,1,4,4,1,1,5,4,1,5]) },
]

/** Resolve a progression to concrete Chord objects given a root and scale. */
export function resolveProgression(
  root: PitchClass,
  scale: ScaleDef,
  progression: Progression,
): Chord[] {
  const diatonic = getDiatonicChords(root, scale)
  if (diatonic.length === 0) {
    throw new RangeError(`Cannot resolve diatonic progression for ${scale.name}`)
  }

  return progression.steps.map(step => {
    if (step.chordOverride) return step.chordOverride
    const idx = step.degree - 1
    const chord = diatonic[idx]
    if (!chord) throw new RangeError(`Progression degree ${step.degree} is outside ${scale.name}`)
    if (step.qualityOverride) return { root: chord.root, quality: step.qualityOverride }
    return chord
  })
}
