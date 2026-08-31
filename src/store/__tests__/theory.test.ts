import { describe, it, expect, beforeEach } from 'vitest'
import { useTheoryStore } from '../theory'
import { useInteractiveStore } from '../interactive'
import { SCALES_BY_ID } from '../../theory/scales'

const minorPent = SCALES_BY_ID['minor-pentatonic']
const majorPent = SCALES_BY_ID['major-pentatonic']

const reset = () => {
  useTheoryStore.setState({ root: 0, scale: SCALES_BY_ID['major'], chordQualityId: null })
  useInteractiveStore.setState({
    hoverPc: null, posIdx: null, mode: 'explore',
    pinned: [], selectedIntervals: [], anchor: null,
  })
}

describe('theory store — scale changes and the degree selection', () => {
  beforeEach(reset)

  it('drops a degree selection made against the previous scale', () => {
    useTheoryStore.getState().setScale(minorPent)
    // b3 and b7 — offsets that do not exist in the major pentatonic.
    useInteractiveStore.getState().toggleInterval(3)
    useInteractiveStore.getState().toggleInterval(10)
    expect(useInteractiveStore.getState().selectedIntervals).toEqual([3, 10])

    useTheoryStore.getState().setScale(majorPent)
    expect(useInteractiveStore.getState().selectedIntervals).toEqual([])
  })

  it('releases the anchor along with the selection', () => {
    useTheoryStore.getState().setScale(minorPent)
    useInteractiveStore.getState().setAnchor({ string: 2, fret: 5, pc: 5, midi: 55 })

    useTheoryStore.getState().setScale(majorPent)
    expect(useInteractiveStore.getState().anchor).toBeNull()
  })

  it('clears the selection when the scale is deselected entirely', () => {
    useTheoryStore.getState().setScale(minorPent)
    useInteractiveStore.getState().toggleInterval(7)

    useTheoryStore.getState().setScale(null)
    expect(useInteractiveStore.getState().selectedIntervals).toEqual([])
  })

  it('keeps the selection when the same scale is set again', () => {
    useTheoryStore.getState().setScale(minorPent)
    useInteractiveStore.getState().toggleInterval(7)

    useTheoryStore.getState().setScale(minorPent)
    expect(useInteractiveStore.getState().selectedIntervals).toEqual([7])
  })

  it('keeps the selection when only the root changes — the degrees still apply', () => {
    useTheoryStore.getState().setScale(minorPent)
    useInteractiveStore.getState().toggleInterval(3)

    useTheoryStore.getState().setRoot(7)
    expect(useInteractiveStore.getState().selectedIntervals).toEqual([3])
  })
})
