import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useProgressionStore, serializeSteps, deserializeSteps, selectDisplayedStep } from '../progression'
import { useTheoryStore } from '../theory'
import { SCALES_BY_ID } from '../../theory/scales'
import { CHORD_QUALITIES_BY_ID } from '../../theory/chords'
import type { ProgressionStep } from '../../theory/progression'

const s = () => useProgressionStore.getState()

const reset = (steps: ProgressionStep[] = []) => {
  useProgressionStore.setState({
    steps, activeStep: steps.length ? 0 : null, hoveredStep: null,
    beatIndex: 0, playing: false, bpm: 100, loop: true, metronome: false,
  })
}

const degrees = (n: number): ProgressionStep[] =>
  Array.from({ length: n }, (_, i) => ({ degree: i + 1 }))

describe('progression store — editing', () => {
  beforeEach(() => reset())

  it('append adds a plain step', () => {
    s().append(4)
    expect(s().steps).toEqual([{ degree: 4 }])
  })

  it('append attaches a quality override when the id is known', () => {
    s().append(2, 'min7')
    expect(s().steps[0].qualityOverride).toBe(CHORD_QUALITIES_BY_ID['min7'])
  })

  it('append ignores an unknown quality id rather than throwing', () => {
    s().append(2, 'not-a-quality')
    expect(s().steps).toEqual([{ degree: 2 }])
  })

  it('replaceAt out of range is a no-op', () => {
    reset(degrees(2))
    s().replaceAt(9, 5)
    expect(s().steps).toEqual(degrees(2))
  })
})

describe('progression store — removeAt keeps the playhead valid', () => {
  it('clears activeStep when the last step goes', () => {
    reset(degrees(1))
    s().removeAt(0)
    expect(s().steps).toHaveLength(0)
    expect(s().activeStep).toBeNull()
  })

  it('clamps activeStep that would fall off the end', () => {
    reset(degrees(3))
    useProgressionStore.setState({ activeStep: 2 })
    s().removeAt(2)
    expect(s().activeStep).toBe(1)
  })

  it('drops hoveredStep when the hovered step itself is removed', () => {
    reset(degrees(3))
    useProgressionStore.setState({ hoveredStep: 1 })
    s().removeAt(1)
    expect(s().hoveredStep).toBeNull()
  })

  it('shifts hoveredStep down when an earlier step is removed', () => {
    reset(degrees(3))
    useProgressionStore.setState({ hoveredStep: 2 })
    s().removeAt(0)
    expect(s().hoveredStep).toBe(1)
  })
})

describe('progression store — stepBy wraps in both directions', () => {
  beforeEach(() => reset(degrees(4)))

  it('wraps forward past the end', () => {
    useProgressionStore.setState({ activeStep: 3 })
    s().stepBy(1)
    expect(s().activeStep).toBe(0)
  })

  it('wraps backward past the start', () => {
    useProgressionStore.setState({ activeStep: 0 })
    s().stepBy(-1)
    expect(s().activeStep).toBe(3)
  })

  it('is a no-op with no steps', () => {
    reset()
    s().stepBy(1)
    expect(s().activeStep).toBeNull()
  })
})

describe('progression store — transport', () => {
  beforeEach(() => { vi.useFakeTimers(); reset(degrees(2)) })
  afterEach(() => { s().clear(); vi.useRealTimers() })

  it('clamps bpm to the 40-220 range', () => {
    s().setBpm(500)
    expect(s().bpm).toBe(220)
    s().setBpm(1)
    expect(s().bpm).toBe(40)
  })

  it('toggles the metronome independently of playback', () => {
    s().toggleMetronome()
    expect(s().metronome).toBe(true)
    expect(s().playing).toBe(false)
    s().toggleMetronome()
    expect(s().metronome).toBe(false)
  })

  it('refuses to play an empty progression', () => {
    reset()
    s().toggle()
    expect(s().playing).toBe(false)
  })

  it('advances one chord per four beats', () => {
    s().toggle()
    expect(s().playing).toBe(true)
    expect(s().activeStep).toBe(0)

    const tick = Math.round(60_000 / s().bpm)
    vi.advanceTimersByTime(tick * 4)
    expect(s().activeStep).toBe(1)
  })

  it('loops back to the start when loop is on', () => {
    useProgressionStore.setState({ loop: true })
    s().toggle()
    const tick = Math.round(60_000 / s().bpm)
    vi.advanceTimersByTime(tick * 8)
    expect(s().activeStep).toBe(0)
    expect(s().playing).toBe(true)
  })

  it('stops at the last chord when loop is off', () => {
    useProgressionStore.setState({ loop: false })
    s().toggle()
    const tick = Math.round(60_000 / s().bpm)
    vi.advanceTimersByTime(tick * 8)
    expect(s().playing).toBe(false)
    expect(s().activeStep).toBe(1)
  })
})

describe('progression store — presets respect the scale length', () => {
  it('drops steps whose degree exceeds a pentatonic scale', () => {
    useTheoryStore.setState({ scale: SCALES_BY_ID['major-pentatonic'] })
    const len = SCALES_BY_ID['major-pentatonic'].pattern.length
    s().loadPreset({ name: 'test', steps: [{ degree: 1 }, { degree: 7 }, { degree: 2 }] })
    expect(s().steps.every(st => st.degree <= len)).toBe(true)
    useTheoryStore.setState({ scale: SCALES_BY_ID['major'] })
  })
})

describe('progression persistence round-trips', () => {
  it('preserves degree, quality override and secondary-dominant marker', () => {
    const steps: ProgressionStep[] = [
      { degree: 1 },
      { degree: 2, qualityOverride: CHORD_QUALITIES_BY_ID['min7'] },
      { degree: 5, secondaryDominantOf: 2 },
    ]
    const back = deserializeSteps(serializeSteps(steps))
    expect(back).toEqual(steps)
  })

  it('discards malformed entries instead of throwing', () => {
    expect(deserializeSteps('nonsense')).toEqual([])
    expect(deserializeSteps([{ degree: 0 }, { degree: 3 }])).toEqual([{ degree: 3 }])
  })
})

describe('progression store — persistence', () => {
  // jsdom here has no localStorage, and the store swallows the failure by
  // design, so stub a real one or these assertions test nothing.
  let mem: Record<string, string>

  beforeEach(() => {
    mem = {}
    vi.stubGlobal('localStorage', {
      getItem:    (k: string) => (k in mem ? mem[k] : null),
      setItem:    (k: string, v: string) => { mem[k] = String(v) },
      removeItem: (k: string) => { delete mem[k] },
    })
    reset()
  })

  afterEach(() => vi.unstubAllGlobals())

  const stored = () => JSON.parse(mem['ftp.v1'] ?? '{}')

  it('persists the steps so a progression survives a reload', () => {
    s().append(4)
    expect(stored().steps).toEqual([{ degree: 4 }])
  })

  it('never writes activeStep — a restored playhead would dim the neck on load', () => {
    s().append(4)
    s().append(5)
    s().focusStep(1)
    expect(s().activeStep).toBe(1)
    expect(stored()).not.toHaveProperty('activeStep')
  })

  it('still persists transport settings', () => {
    s().setBpm(140)
    s().toggleMetronome()
    expect(stored().bpm).toBe(140)
    expect(stored().metronome).toBe(true)
  })
})

describe('selectDisplayedStep', () => {
  beforeEach(() => reset(degrees(3)))

  const displayed = () => selectDisplayedStep(useProgressionStore.getState())

  it('prefers a hovered step over the playhead', () => {
    s().focusStep(0)
    s().hoverStep(2)
    expect(displayed()).toBe(2)
  })

  it('falls back to the playhead when nothing is hovered', () => {
    s().focusStep(1)
    s().hoverStep(null)
    expect(displayed()).toBe(1)
  })

  it('is null when neither is set', () => {
    s().focusStep(null)
    s().hoverStep(null)
    expect(displayed()).toBeNull()
  })

  it('honours a hovered step 0 rather than treating it as absent', () => {
    s().focusStep(2)
    s().hoverStep(0)
    expect(displayed()).toBe(0)
  })
})
