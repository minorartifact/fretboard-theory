import { create } from 'zustand'
import type { LabelMode } from '../theory/types'

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
}

export const useViewStore = create<ViewState & ViewActions>(set => ({
  labelMode:       'note',
  fullscreen:      false,
  showProgression: true,
  sidebarOpen:     false,
  shortcutsOpen:   false,

  setLabelMode:      labelMode => set({ labelMode }),
  setFullscreen:     fullscreen => set({ fullscreen }),
  toggleFullscreen:  () => set(s => ({ fullscreen: !s.fullscreen })),
  toggleProgression: () => set(s => ({ showProgression: !s.showProgression })),
  openSidebar:       () => set({ sidebarOpen: true }),
  closeSidebar:      () => set({ sidebarOpen: false }),
  toggleShortcuts:   () => set(s => ({ shortcutsOpen: !s.shortcutsOpen })),
  closeShortcuts:    () => set({ shortcutsOpen: false }),
}))
