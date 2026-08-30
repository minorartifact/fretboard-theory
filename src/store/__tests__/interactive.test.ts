import { describe, it, expect, beforeEach } from 'vitest'
import { useInteractiveStore, type PinnedNote } from '../interactive'

const note = (string: number, fret: number): PinnedNote =>
  ({ string, fret, pc: ((fret + string) % 12) as PinnedNote['pc'], midi: 40 + string * 5 + fret })

const reset = () => useInteractiveStore.setState({
  hoverPc: null, posIdx: null, mode: 'explore',
  pinned: [], selectedIntervals: [], anchor: null,
})

describe('interactive store — modes', () => {
  beforeEach(reset)

  it('starts in explore mode', () => {
    expect(useInteractiveStore.getState().mode).toBe('explore')
  })

  it('switching mode drops pinned notes', () => {
    const s = useInteractiveStore.getState()
    s.setMode('identify')
    s.togglePin(note(0, 3))
    expect(useInteractiveStore.getState().pinned).toHaveLength(1)

    useInteractiveStore.getState().setMode('chords')
    expect(useInteractiveStore.getState().pinned).toHaveLength(0)
  })

  it('modes are exclusive — setting one replaces the other', () => {
    useInteractiveStore.getState().setMode('identify')
    useInteractiveStore.getState().setMode('intervals')
    expect(useInteractiveStore.getState().mode).toBe('intervals')
  })
})

describe('interactive store — pins', () => {
  beforeEach(reset)

  it('toggling the same fret twice removes it', () => {
    const { togglePin } = useInteractiveStore.getState()
    togglePin(note(2, 5))
    expect(useInteractiveStore.getState().pinned).toHaveLength(1)
    useInteractiveStore.getState().togglePin(note(2, 5))
    expect(useInteractiveStore.getState().pinned).toHaveLength(0)
  })

  it('identifies pins by string AND fret, not pitch', () => {
    const { togglePin } = useInteractiveStore.getState()
    togglePin(note(2, 5))
    useInteractiveStore.getState().togglePin(note(3, 0))
    expect(useInteractiveStore.getState().pinned).toHaveLength(2)
  })

  it('clearPins empties the list', () => {
    useInteractiveStore.getState().togglePin(note(1, 1))
    useInteractiveStore.getState().clearPins()
    expect(useInteractiveStore.getState().pinned).toEqual([])
  })
})

describe('interactive store — interval selection', () => {
  beforeEach(reset)

  it('toggles an interval on and back off', () => {
    const { toggleInterval } = useInteractiveStore.getState()
    toggleInterval(7)
    expect(useInteractiveStore.getState().selectedIntervals).toEqual([7])
    useInteractiveStore.getState().toggleInterval(7)
    expect(useInteractiveStore.getState().selectedIntervals).toEqual([])
  })

  it('keeps the selection sorted regardless of click order', () => {
    const s = () => useInteractiveStore.getState()
    s().toggleInterval(7)
    s().toggleInterval(3)
    s().toggleInterval(11)
    expect(s().selectedIntervals).toEqual([3, 7, 11])
  })

  it('clearIntervals also releases the anchor back to the root', () => {
    const s = () => useInteractiveStore.getState()
    s().toggleInterval(4)
    s().setAnchor(note(4, 2))
    expect(s().anchor).not.toBeNull()

    s().clearIntervals()
    expect(s().selectedIntervals).toEqual([])
    expect(s().anchor).toBeNull()
  })
})
