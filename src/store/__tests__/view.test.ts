import { describe, it, expect, beforeEach } from 'vitest'
import { useViewStore } from '../view'

const reset = () => useViewStore.setState({
  labelMode: 'note', fullscreen: false, showProgression: true,
})

describe('view store', () => {
  beforeEach(reset)

  it('defaults to the normal layout with the progression visible', () => {
    const s = useViewStore.getState()
    expect(s.fullscreen).toBe(false)
    expect(s.showProgression).toBe(true)
  })

  it('toggleFullscreen flips both ways', () => {
    useViewStore.getState().toggleFullscreen()
    expect(useViewStore.getState().fullscreen).toBe(true)
    useViewStore.getState().toggleFullscreen()
    expect(useViewStore.getState().fullscreen).toBe(false)
  })

  it('progression visibility is independent of fullscreen', () => {
    const s = () => useViewStore.getState()
    s().setFullscreen(true)
    s().toggleProgression()
    expect(s().fullscreen).toBe(true)
    expect(s().showProgression).toBe(false)
  })

  it('setLabelMode round-trips', () => {
    useViewStore.getState().setLabelMode('interval')
    expect(useViewStore.getState().labelMode).toBe('interval')
  })
})
