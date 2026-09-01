import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { PitchClass } from '../../theory/types'

/**
 * The persistence round trip, which had never been exercised: jsdom provides no
 * localStorage here, and both loaders wrap their storage access in try/catch, so
 * every one of these paths silently no-opped. See src/test/setup.ts.
 */

const KEY = 'ftp.songs'

/** Re-import so the module-level `loadSongs()` runs against fresh storage. */
const loadFromStorage = async () => {
  vi.resetModules()
  return (await import('../songs')).useSongsStore.getState().songs
}

const stored = (over: Record<string, unknown> = {}) => JSON.stringify([{
  id: 'a', name: 'Song', root: 0, scaleId: 'major',
  steps: [], bpm: 100, loop: true, savedAt: 1, ...over,
}])

describe('songs persistence', () => {
  beforeEach(() => localStorage.clear())

  it('reads back what it wrote', async () => {
    const { useSongsStore } = await import('../songs')
    useSongsStore.setState({ songs: [] })
    localStorage.setItem(KEY, stored({ name: 'Round trip', root: 7 }))
    const songs = await loadFromStorage()
    expect(songs).toHaveLength(1)
    expect(songs[0].name).toBe('Round trip')
    expect(songs[0].root).toBe(7 as PitchClass)
  })

  it('returns nothing for unparseable storage rather than throwing', async () => {
    localStorage.setItem(KEY, 'not json at all')
    expect(await loadFromStorage()).toEqual([])
  })

  it('returns nothing when the stored value is not an array', async () => {
    localStorage.setItem(KEY, '{"nope":true}')
    expect(await loadFromStorage()).toEqual([])
  })

  it('drops entries missing an id or a name', async () => {
    localStorage.setItem(KEY, JSON.stringify([{ name: 'no id' }, { id: 'x' }, null]))
    expect(await loadFromStorage()).toEqual([])
  })

  // Type checks alone let these through, and a root of 99 reaches every corner
  // of the app — spelling, the key strip, the circle.
  it('clamps a root outside 0–11', async () => {
    localStorage.setItem(KEY, stored({ root: 99 }))
    const [song] = await loadFromStorage()
    expect(song.root).toBeGreaterThanOrEqual(0)
    expect(song.root).toBeLessThanOrEqual(11)
  })

  it('clamps a tempo outside the transport range, as the progression loader does', async () => {
    localStorage.setItem(KEY, stored({ bpm: -40 }))
    expect((await loadFromStorage())[0].bpm).toBe(40)
    localStorage.setItem(KEY, stored({ bpm: 9000 }))
    expect((await loadFromStorage())[0].bpm).toBe(220)
  })

  it('falls back to a sane tempo when bpm is not a finite number', async () => {
    localStorage.setItem(KEY, stored({ bpm: 'fast' }))
    expect((await loadFromStorage())[0].bpm).toBe(100)
  })

  it('keeps a song whose scale no longer exists, rather than dropping it', async () => {
    localStorage.setItem(KEY, stored({ scaleId: 'no-such-scale' }))
    const [song] = await loadFromStorage()
    expect(song.scaleId).toBe('no-such-scale')
  })
})
