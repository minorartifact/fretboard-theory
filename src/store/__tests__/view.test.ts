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

/**
 * The four overlays each own the keyboard while open, and AGENTS.md states that
 * no two of them may overlap. Nothing in zustand enforces that, so it is pinned
 * here: every opener, from every starting state, must leave exactly one open.
 */
describe('overlays are mutually exclusive', () => {
  const OPENERS = {
    tour:      () => useViewStore.getState().openTour(),
    palette:   () => useViewStore.getState().openPalette('scale'),
    keys:      () => useViewStore.getState().openKeys(),
    shortcuts: () => useViewStore.getState().toggleShortcuts(),
  } as const

  const openCount = () => {
    const v = useViewStore.getState()
    return [v.tourOpen, v.palette !== null, v.keysOpen, v.shortcutsOpen].filter(Boolean).length
  }

  const reset = () => useViewStore.setState({
    tourOpen: false, palette: null, keysOpen: false, shortcutsOpen: false,
  })

  it.each(Object.keys(OPENERS) as (keyof typeof OPENERS)[])(
    'opening %s from a clean state leaves exactly one overlay open',
    which => {
      reset()
      OPENERS[which]()
      expect(openCount()).toBe(1)
    },
  )

  // The pairwise case is the one that actually bites: `?` then `t` really does
  // stack the quick-pick on top of the shortcut list, because the global
  // shortcut handler only stands down for the tour, the palette and the keys.
  it.each(
    (Object.keys(OPENERS) as (keyof typeof OPENERS)[]).flatMap(
      a => (Object.keys(OPENERS) as (keyof typeof OPENERS)[])
        .filter(b => b !== a)
        .map(b => [a, b] as const),
    ),
  )('opening %s then %s never leaves two open', (first, second) => {
    reset()
    OPENERS[first]()
    OPENERS[second]()
    expect(openCount()).toBe(1)
  })
})
