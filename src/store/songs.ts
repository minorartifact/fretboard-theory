import { create } from 'zustand'
import type { PitchClass, ScaleDef } from '../theory/types'
import type { ProgressionStep } from '../theory/progression'
import { SCALES_BY_ID } from '../theory/scales'
import { serializeSteps, deserializeSteps, type StoredStep } from './progression'
import { useTheoryStore } from './theory'
import { useProgressionStore } from './progression'

const STORAGE_KEY = 'ftp.songs'

export interface SavedSong {
  id: string
  name: string
  root: PitchClass
  scaleId: string
  steps: ProgressionStep[]
  bpm: number
  loop: boolean
  savedAt: number
}

// ── Serialised shape ────────────────────────────────────────────────────────

interface StoredSong {
  id: string
  name: string
  root: number
  scaleId: string
  steps: StoredStep[]
  bpm: number
  loop: boolean
  savedAt: number
}

function loadSongs(): SavedSong[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: StoredSong[] = JSON.parse(raw)
    return parsed
      .filter(s => s && typeof s.id === 'string' && typeof s.name === 'string')
      .map(s => ({
        id:      s.id,
        name:    s.name,
        root:    (s.root ?? 0) as PitchClass,
        scaleId: s.scaleId ?? 'major',
        steps:   deserializeSteps(s.steps),
        bpm:     typeof s.bpm === 'number' ? s.bpm : 100,
        loop:    typeof s.loop === 'boolean' ? s.loop : true,
        savedAt: typeof s.savedAt === 'number' ? s.savedAt : 0,
      }))
  } catch { return [] }
}

function persistSongs(songs: SavedSong[]) {
  try {
    const stored: StoredSong[] = songs.map(s => ({
      id:      s.id,
      name:    s.name,
      root:    s.root,
      scaleId: s.scaleId,
      steps:   serializeSteps(s.steps),
      bpm:     s.bpm,
      loop:    s.loop,
      savedAt: s.savedAt,
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch { /* localStorage unavailable */ }
}

// ── Store ───────────────────────────────────────────────────────────────────

interface SongsState {
  songs: SavedSong[]
}

interface SongsActions {
  /** Save the current progression + theory state as a named song. */
  saveSong: (name: string) => void
  deleteSong: (id: string) => void
  /** Load a saved song into the theory + progression stores. */
  loadSong: (id: string) => void
}

export const useSongsStore = create<SongsState & SongsActions>((set, get) => ({
  songs: loadSongs(),

  saveSong: (name: string) => {
    const { root, scale } = useTheoryStore.getState()
    const { steps, bpm, loop } = useProgressionStore.getState()
    if (steps.length === 0) return

    const song: SavedSong = {
      id:      crypto.randomUUID(),
      name:    name.trim() || 'Untitled',
      root,
      scaleId: scale?.id ?? 'major',
      steps:   [...steps],
      bpm,
      loop,
      savedAt: Date.now(),
    }
    const songs = [song, ...get().songs]
    set({ songs })
    persistSongs(songs)
  },

  deleteSong: (id: string) => {
    const songs = get().songs.filter(s => s.id !== id)
    set({ songs })
    persistSongs(songs)
  },

  loadSong: (id: string) => {
    const song = get().songs.find(s => s.id === id)
    if (!song) return

    const scale: ScaleDef | null = SCALES_BY_ID[song.scaleId] ?? null

    useTheoryStore.getState().setRoot(song.root)
    if (scale) useTheoryStore.getState().setScale(scale)

    const prog = useProgressionStore.getState()
    prog.clear()
    // Load steps directly by setting state; reuse loadPreset-like pattern
    useProgressionStore.setState({
      steps:      song.steps,
      activeStep: song.steps.length > 0 ? 0 : null,
      bpm:        song.bpm,
      loop:       song.loop,
    })
  },
}))
