import { describe, it, expect, beforeEach } from 'vitest'
import { useSongsStore, type SavedSong } from '../songs'
import { useProgressionStore } from '../progression'

const song: SavedSong = {
  id: 'song-1', name: 'Test', root: 0, scaleId: 'major',
  steps: [{ degree: 1 }, { degree: 4 }], bpm: 120, loop: false, savedAt: 0,
}

describe('songs store — loading', () => {
  beforeEach(() => {
    useSongsStore.setState({ songs: [song] })
    useProgressionStore.setState({
      steps: [{ degree: 5 }], activeStep: 0, hoveredStep: null,
      beatIndex: 0, playing: false, bpm: 100, loop: true,
      metronome: false, lastCleared: null,
    })
  })

  it('replaces the progression with the saved one', () => {
    useSongsStore.getState().loadSong('song-1')
    const s = useProgressionStore.getState()
    expect(s.steps).toEqual([{ degree: 1 }, { degree: 4 }])
    expect(s.bpm).toBe(120)
    expect(s.loop).toBe(false)
  })

  it('does not leave an undo offering the progression it replaced', () => {
    // loadSong calls clear() first, which stashes the outgoing steps for undo.
    // Left set, the transport would offer to restore them over the loaded song.
    useSongsStore.getState().loadSong('song-1')
    expect(useProgressionStore.getState().lastCleared).toBeNull()
  })

  it('ignores an unknown id', () => {
    useSongsStore.getState().loadSong('nope')
    expect(useProgressionStore.getState().steps).toEqual([{ degree: 5 }])
  })
})
