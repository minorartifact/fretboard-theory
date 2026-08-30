/**
 * Progression sequencer — store + transport.
 * Drop-in with the existing theory/ model. Owns an ordered step sequence
 * and a transport (play / tempo / loop) whose tick advances activeStep.
 * The active step is the single source of truth for what the fretboard
 * and circle highlight.
 *
 * Audio seam: the transport only moves a pointer. When you add audio,
 * subscribe to activeStep changes and trigger a synth — nothing else changes.
 */
import { create } from 'zustand'
import type { Chord, PitchClass } from '../theory/types'
import { CHORD_QUALITIES_BY_ID } from '../theory/chords'
import {
  resolveProgression,
  COMMON_PROGRESSIONS,
  type ProgressionStep,
} from '../theory/progression'
import { useTheoryStore } from './theory'

// One quarter-note tick at the given BPM
const quarterMs = (bpm: number) => Math.round(60_000 / bpm)

// ── Serialised shape for localStorage ──────────────────────────────────────

export type StoredStep = {
  degree: number
  qualityId?: string
  chordRoot?: number
  chordQualityId?: string
  secondaryDominantOf?: number
}

export function serializeSteps(steps: ProgressionStep[]): StoredStep[] {
  return steps.map(s => ({
    degree: s.degree,
    ...(s.qualityOverride ? { qualityId: s.qualityOverride.id } : {}),
    ...(s.chordOverride ? { chordRoot: s.chordOverride.root, chordQualityId: s.chordOverride.quality.id } : {}),
    ...(s.secondaryDominantOf != null ? { secondaryDominantOf: s.secondaryDominantOf } : {}),
  }))
}

export function deserializeSteps(raw: unknown): ProgressionStep[] {
  if (!Array.isArray(raw)) return []
  return (raw as StoredStep[])
    .filter(s => typeof s.degree === 'number' && s.degree >= 1)
    .map(s => {
      const step: ProgressionStep = { degree: s.degree }
      if (s.qualityId && CHORD_QUALITIES_BY_ID[s.qualityId])
        step.qualityOverride = CHORD_QUALITIES_BY_ID[s.qualityId]
      if (s.chordQualityId && CHORD_QUALITIES_BY_ID[s.chordQualityId] && typeof s.chordRoot === 'number')
        step.chordOverride = { root: s.chordRoot as PitchClass, quality: CHORD_QUALITIES_BY_ID[s.chordQualityId] }
      if (s.secondaryDominantOf != null)
        step.secondaryDominantOf = s.secondaryDominantOf
      return step
    })
}

const STORAGE_KEY = 'ftp.v1'

function load(): Partial<{ steps: ProgressionStep[]; activeStep: number | null; bpm: number; loop: boolean; metronome: boolean }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const d = JSON.parse(raw)
    return {
      steps:      deserializeSteps(d.steps),
      activeStep: typeof d.activeStep === 'number' ? d.activeStep : null,
      bpm:        typeof d.bpm  === 'number'  ? Math.max(40, Math.min(220, d.bpm)) : 100,
      loop:       typeof d.loop === 'boolean' ? d.loop : true,
      metronome:  typeof d.metronome === 'boolean' ? d.metronome : false,
    }
  } catch { return {} }
}

function save(s: { steps: ProgressionStep[]; activeStep: number | null; bpm: number; loop: boolean; metronome: boolean }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      steps:      serializeSteps(s.steps),
      activeStep: s.activeStep,
      bpm:        s.bpm,
      loop:       s.loop,
      metronome:  s.metronome,
    }))
  } catch { /* localStorage may be unavailable in private browsing */ }
}

// ── Store ───────────────────────────────────────────────────────────────────

interface ProgressionState {
  steps:       ProgressionStep[]
  activeStep:  number | null
  hoveredStep: number | null
  beatIndex:   number          // 0-3 quarter-note beat within the current chord
  playing:     boolean
  bpm:         number
  loop:        boolean
  metronome:   boolean
  /** Steps removed by the last `clear()`, so it can be undone. */
  lastCleared: ProgressionStep[] | null
}

interface ProgressionActions {
  append:      (degree: number, qualityId?: string) => void
  appendStep:  (step: ProgressionStep) => void
  replaceAt:   (index: number, degree: number, qualityId?: string) => void
  replaceAtStep: (index: number, step: ProgressionStep) => void
  removeAt:    (index: number)  => void
  focusStep: (index: number | null) => void
  hoverStep: (index: number | null) => void
  stepBy:    (dir: 1 | -1)   => void
  clear:     () => void
  undoClear: () => void
  loadPreset: (preset: typeof COMMON_PROGRESSIONS[number]) => void

  toggle:     () => void
  restart:    () => void
  setBpm:     (bpm: number) => void
  toggleLoop: () => void
  toggleMetronome: () => void

  /** Resolve steps against the current theory-store state. */
  resolved:    () => Chord[]
  /** Chord under the playhead, or null. */
  activeChord: () => Chord | null
}

let timer: ReturnType<typeof setInterval> | null = null

const persisted = load()

export const useProgressionStore = create<ProgressionState & ProgressionActions>(
  (set, get) => {
    const stopTimer = () => {
      if (timer) { clearInterval(timer); timer = null }
    }
    const startTimer = () => {
      stopTimer()
      timer = setInterval(() => {
        const { steps, activeStep, beatIndex, loop } = get()
        if (!steps.length) { stopTimer(); set({ playing: false }); return }

        const nextBeat = (beatIndex + 1) % 4
        // Advance chord every 4 beats (one bar of 4/4)
        if (nextBeat !== 0) {
          set({ beatIndex: nextBeat })
          return
        }

        const cur  = activeStep ?? 0
        const next = cur + 1
        if (next >= steps.length) {
          if (loop) set({ activeStep: 0, beatIndex: 0 })
          else { stopTimer(); set({ activeStep: steps.length - 1, beatIndex: 0, playing: false }) }
        } else {
          set({ activeStep: next, beatIndex: 0 })
        }
      }, quarterMs(get().bpm))
    }

    return {
      steps:       persisted.steps      ?? [],
      activeStep:  persisted.activeStep ?? null,
      hoveredStep: null,
      beatIndex:   0,
      playing:     false,
      bpm:         persisted.bpm        ?? 100,
      loop:        persisted.loop       ?? true,
      metronome:   persisted.metronome  ?? false,
      lastCleared: null,

      append: (degree, qualityId) =>
        set(s => {
          const step: ProgressionStep = qualityId && CHORD_QUALITIES_BY_ID[qualityId]
            ? { degree, qualityOverride: CHORD_QUALITIES_BY_ID[qualityId] }
            : { degree }
          return { steps: [...s.steps, step], lastCleared: null }
        }),

      appendStep: step =>
        set(s => ({ steps: [...s.steps, step], lastCleared: null })),

      replaceAt: (index, degree, qualityId) =>
        set(s => {
          if (index < 0 || index >= s.steps.length) return {}
          const step: ProgressionStep = qualityId && CHORD_QUALITIES_BY_ID[qualityId]
            ? { degree, qualityOverride: CHORD_QUALITIES_BY_ID[qualityId] }
            : { degree }
          const steps = [...s.steps]
          steps[index] = step
          return { steps }
        }),

      replaceAtStep: (index, step) =>
        set(s => {
          if (index < 0 || index >= s.steps.length) return {}
          const steps = [...s.steps]
          steps[index] = step
          return { steps }
        }),

      removeAt: index =>
        set(s => {
          const steps = s.steps.filter((_, i) => i !== index)
          let activeStep = s.activeStep
          let hoveredStep = s.hoveredStep
          if (steps.length === 0) activeStep = null
          else if (activeStep != null && activeStep >= steps.length) activeStep = steps.length - 1
          if (steps.length === 0) hoveredStep = null
          else if (hoveredStep === index) hoveredStep = null
          else if (hoveredStep != null && hoveredStep > index) hoveredStep -= 1
          return { steps, activeStep, hoveredStep }
        }),

      focusStep: index => set({ activeStep: index }),
      hoverStep: index => set({ hoveredStep: index }),

      stepBy: dir =>
        set(s => {
          if (!s.steps.length) return {}
          const n   = s.steps.length
          const cur = s.activeStep ?? (dir > 0 ? -1 : 0)
          return { activeStep: ((cur + dir) % n + n) % n }
        }),

      clear: () => set(s => {
        stopTimer()
        return {
          steps: [], activeStep: null, hoveredStep: null, beatIndex: 0, playing: false,
          lastCleared: s.steps.length ? s.steps : s.lastCleared,
        }
      }),

      undoClear: () => set(s => s.lastCleared
        ? { steps: s.lastCleared, activeStep: 0, hoveredStep: null, lastCleared: null }
        : {}),

      loadPreset: preset => {
        const { scale } = useTheoryStore.getState()
        const len   = scale?.pattern.length ?? 7
        const steps = preset.steps.filter(st => st.degree <= len)
        set({ steps, activeStep: steps.length ? 0 : null, hoveredStep: null, lastCleared: null })
      },

      toggle: () => {
        const s = get()
        if (!s.steps.length) return
        if (s.playing) {
          stopTimer(); set({ playing: false, beatIndex: 0 })
        } else {
          const atEnd = !s.loop && s.activeStep != null && s.activeStep >= s.steps.length - 1
          set({ playing: true, beatIndex: 0, activeStep: atEnd ? 0 : (s.activeStep ?? 0) })
          startTimer()
        }
      },

      restart: () => set(s => s.steps.length ? { activeStep: 0, beatIndex: 0 } : {}),

      setBpm: bpm => {
        const v = Math.max(40, Math.min(220, bpm))
        set({ bpm: v, beatIndex: 0 })
        if (get().playing) startTimer()
      },

      toggleLoop: () => set(s => ({ loop: !s.loop })),
      toggleMetronome: () => set(s => ({ metronome: !s.metronome })),

      resolved: () => {
        const { root, scale } = useTheoryStore.getState()
        if (!scale) return []
        try { return resolveProgression(root, scale, { steps: get().steps }) }
        catch { return [] }
      },

      activeChord: () => {
        const { activeStep } = get()
        if (activeStep == null) return null
        return get().resolved()[activeStep] ?? null
      },
    }
  }
)

// Auto-persist on every state change
useProgressionStore.subscribe(state => {
  save({
    steps: state.steps,
    activeStep: state.activeStep,
    bpm: state.bpm,
    loop: state.loop,
    metronome: state.metronome,
  })
})

export { COMMON_PROGRESSIONS }
