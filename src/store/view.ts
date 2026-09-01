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

/**
 * Opening any one overlay closes the others. Each owns the keyboard while it is
 * up, so two at once means two things reading the same keystrokes — and the
 * exclusion had drifted: the shortcut list stood down for nothing, so `?` then
 * `t` stacked the quick-pick on top of it. Spreading one constant is what stops
 * a new overlay from having to remember every existing one.
 */
const ONLY = { tourOpen: false, palette: null, keysOpen: false, shortcutsOpen: false } as const

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
  toggleShortcuts:   () => set(s => s.shortcutsOpen ? { shortcutsOpen: false } : { ...ONLY, shortcutsOpen: true }),
  closeShortcuts:    () => set({ shortcutsOpen: false }),
  // The tour walks the real chrome, so it cannot run while fullscreen has
  // hidden most of what it points at.
  openTour:          () => set({ ...ONLY, tourOpen: true, fullscreen: false }),
  closeTour:         () => set({ tourOpen: false }),
  // The quick-pick, the tour and the keys wheel each own the keyboard while
  // open, so no two of them may overlap.
  openPalette:       kind => set({ ...ONLY, palette: kind }),
  closePalette:      () => set({ palette: null }),
  // Unlike the tour, this one is worth having in fullscreen — that is the
  // layout with no sidebar circle to reach for — so it leaves `fullscreen` be.
  openKeys:          () => set({ ...ONLY, keysOpen: true }),
  closeKeys:         () => set({ keysOpen: false }),
  toggleKeys:        () => set(s => s.keysOpen ? { keysOpen: false } : { ...ONLY, keysOpen: true }),
}))
