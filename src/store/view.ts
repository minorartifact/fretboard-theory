import { create } from 'zustand'
import type { LabelMode } from '../theory/types'

/** What a quick-pick is choosing. Each has its own shortcut key. */
export type PaletteKind = 'tonic' | 'scale' | 'quality'

/**
 * `fullscreen` strips the app chrome down to the fretboard and the progression
 * cards — the play-along view. `showProgression` hides the progression panel in
 * either layout, so fullscreen with it off is the bare neck.
 */
interface ViewState {
  labelMode:       LabelMode
  fullscreen:      boolean
  showProgression: boolean
  /** Only consulted on narrow screens, where the sidebar is a drawer. */
  sidebarOpen:     boolean
  shortcutsOpen:   boolean
  /** Guided tour overlay. Transient: not persisted, not in the share URL. */
  tourOpen:        boolean
  /** Quick-pick overlay, or null when closed. Also transient. */
  palette:         PaletteKind | null
  /** Keys wheel overlay. Transient, and works in fullscreen. */
  keysOpen:        boolean
}

interface ViewActions {
  setLabelMode:      (mode: LabelMode) => void
  setFullscreen:     (v: boolean)      => void
  toggleFullscreen:  ()                => void
  toggleProgression: ()               => void
  openSidebar:       ()               => void
  closeSidebar:      ()               => void
  toggleShortcuts:   ()               => void
  closeShortcuts:    ()               => void
  openTour:          ()               => void
  closeTour:         ()               => void
  openPalette:       (kind: PaletteKind) => void
  closePalette:      ()               => void
  openKeys:          ()               => void
  closeKeys:         ()               => void
  toggleKeys:        ()               => void
}

export const useViewStore = create<ViewState & ViewActions>(set => ({
  labelMode:       'note',
  fullscreen:      false,
  showProgression: true,
  sidebarOpen:     false,
  shortcutsOpen:   false,
  tourOpen:        false,
  palette:         null,
  keysOpen:        false,

  setLabelMode:      labelMode => set({ labelMode }),
  setFullscreen:     fullscreen => set({ fullscreen }),
  toggleFullscreen:  () => set(s => ({ fullscreen: !s.fullscreen })),
  toggleProgression: () => set(s => ({ showProgression: !s.showProgression })),
  openSidebar:       () => set({ sidebarOpen: true }),
  closeSidebar:      () => set({ sidebarOpen: false }),
  toggleShortcuts:   () => set(s => ({ shortcutsOpen: !s.shortcutsOpen })),
  closeShortcuts:    () => set({ shortcutsOpen: false }),
  // The tour walks the real chrome, so it cannot run while fullscreen has
  // hidden most of what it points at.
  openTour:          () => set({ tourOpen: true, shortcutsOpen: false, fullscreen: false, keysOpen: false }),
  closeTour:         () => set({ tourOpen: false }),
  // The quick-pick, the tour and the keys wheel each own the keyboard while
  // open, so no two of them may overlap.
  openPalette:       kind => set({ palette: kind, tourOpen: false, keysOpen: false }),
  closePalette:      () => set({ palette: null }),
  // Unlike the tour, this one is worth having in fullscreen — that is the
  // layout with no sidebar circle to reach for — so it leaves `fullscreen` be.
  openKeys:          () => set({ keysOpen: true, tourOpen: false, palette: null, shortcutsOpen: false }),
  closeKeys:         () => set({ keysOpen: false }),
  toggleKeys:        () => set(s => s.keysOpen
    ? { keysOpen: false }
    : { keysOpen: true, tourOpen: false, palette: null, shortcutsOpen: false }),
}))
