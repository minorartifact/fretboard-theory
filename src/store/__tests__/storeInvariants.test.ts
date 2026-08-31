import { describe, it, expect, beforeEach } from 'vitest'
import { useTheoryStore } from '../theory'
import { useFretboardStore } from '../fretboard'
import { useInteractiveStore, POSITIONS } from '../interactive'
import { useProgressionStore } from '../progression'
import { useSongsStore, type SavedSong } from '../songs'
import { chooseChordQuality } from '../selection'
import { SCALES_BY_ID } from '../../theory/scales'
import { TUNINGS_BY_ID } from '../../theory/fretboard'

/**
 * State in one store is often only meaningful against state another store owns.
 * Each test below drives a rule through the *public* setters, so a setter that
 * stops calling its invalidation fails here rather than in the browser.
 */

const resetAll = () => {
  useTheoryStore.setState({ root: 0, scale: SCALES_BY_ID['major'], chordQualityId: null })
  useFretboardStore.setState({ tuning: TUNINGS_BY_ID['standard'], fretCount: 15, startFret: 0 })
  useInteractiveStore.setState({
    hoverPc: null, posIdx: null, mode: 'explore',
    pinned: [], selectedIntervals: [], anchor: null,
  })
  useProgressionStore.setState({
    steps: [], activeStep: null, hoveredStep: null, beatIndex: 0,
    playing: false, bpm: 100, loop: true, metronome: false, lastCleared: null,
  })
}

describe('store invariants', () => {
  beforeEach(resetAll)

  it('a degree selection does not survive a scale change', () => {
    useInteractiveStore.getState().toggleInterval(3)
    useTheoryStore.getState().setScale(SCALES_BY_ID['minor-pentatonic'])
    expect(useInteractiveStore.getState().selectedIntervals).toEqual([])
  })

  it('a degree selection survives a root change, which keeps its meaning', () => {
    useInteractiveStore.getState().toggleInterval(3)
    useTheoryStore.getState().setRoot(7)
    expect(useInteractiveStore.getState().selectedIntervals).toEqual([3])
  })

  it('a position window does not survive a neck too short to reach it', () => {
    const highest = POSITIONS.length - 1
    useInteractiveStore.getState().setPosIdx(highest)
    useFretboardStore.getState().setFretCount(12)
    expect(useInteractiveStore.getState().posIdx).toBeNull()
  })

  it('a position window the neck can still reach is left alone', () => {
    useInteractiveStore.getState().setPosIdx(0)          // 0-4
    useFretboardStore.getState().setFretCount(12)
    expect(useInteractiveStore.getState().posIdx).toBe(0)
  })

  it('pins and interval selections do not survive a mode change', () => {
    const s = useInteractiveStore.getState()
    s.setMode('identify')
    s.togglePin({ string: 0, fret: 3, pc: 3, midi: 43 })
    s.toggleInterval(5)
    s.setAnchor({ string: 1, fret: 2, pc: 7, midi: 47 })

    useInteractiveStore.getState().setMode('explore')
    const after = useInteractiveStore.getState()
    expect(after.pinned).toEqual([])
    expect(after.selectedIntervals).toEqual([])
    expect(after.anchor).toBeNull()
  })

  it('focusing a step drops a chord quality it would silently override', () => {
    useProgressionStore.setState({ steps: [{ degree: 1 }, { degree: 4 }] })
    useTheoryStore.getState().setChordQualityId('maj')

    useProgressionStore.getState().focusStep(0)
    expect(useTheoryStore.getState().chordQualityId).toBeNull()
  })

  it('choosing a chord quality releases the playhead so the choice is visible', () => {
    useProgressionStore.setState({ steps: [{ degree: 1 }, { degree: 4 }], activeStep: 1 })

    chooseChordQuality('dim')
    expect(useProgressionStore.getState().activeStep).toBeNull()
    expect(useTheoryStore.getState().chordQualityId).toBe('dim')
  })

  it('clearing the quality leaves the playhead alone — that is not taking over', () => {
    useProgressionStore.setState({ steps: [{ degree: 1 }], activeStep: 0 })

    chooseChordQuality(null)
    expect(useProgressionStore.getState().activeStep).toBe(0)
  })

  it('releasing the playhead does not clear the quality that released it', () => {
    chooseChordQuality('min')
    expect(useTheoryStore.getState().chordQualityId).toBe('min')
  })

  it('loading a song does not leave an undo pointing at the replaced progression', () => {
    const song: SavedSong = {
      id: 'x', name: 'x', root: 0, scaleId: 'major',
      steps: [{ degree: 1 }], bpm: 100, loop: true, savedAt: 0,
    }
    useSongsStore.setState({ songs: [song] })
    useProgressionStore.setState({ steps: [{ degree: 5 }] })

    useSongsStore.getState().loadSong('x')
    expect(useProgressionStore.getState().lastCleared).toBeNull()
  })
})
