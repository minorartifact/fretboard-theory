import { useEffect } from 'react'
import { useProgressionStore } from '../store/progression'
import { useViewStore } from '../store/view'
import { useInteractiveStore } from '../store/interactive'
import { useTheoryStore } from '../store/theory'

/** Global keyboard shortcuts for the app. */
export function useKeyboardShortcuts() {
  const toggle           = useProgressionStore(s => s.toggle)
  const toggleFullscreen = useViewStore(s => s.toggleFullscreen)
  const toggleShortcuts  = useViewStore(s => s.toggleShortcuts)
  const toggleInterval   = useInteractiveStore(s => s.toggleInterval)
  const clearIntervals   = useInteractiveStore(s => s.clearIntervals)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in an input/textarea/contenteditable
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      // A focused fret owns its own arrow/Enter/Space handling.
      const onFretboard = (e.target as Element | null)?.closest?.('[data-fretcell]') != null
      if (onFretboard && (e.code === 'Space' || e.key.startsWith('Arrow') || e.key === 'Enter')) return

      // The tour owns the keyboard while it runs — it has its own Esc, arrows
      // and Enter, and Space toggling playback underneath it would be a
      // surprise.
      if (useViewStore.getState().tourOpen) return

      // Esc unwinds one layer at a time, innermost first.
      if (e.code === 'Escape') {
        const v = useViewStore.getState()
        if (v.shortcutsOpen)   { v.closeShortcuts(); return }
        if (v.sidebarOpen)     { v.closeSidebar();   return }
        if (v.fullscreen)      { v.setFullscreen(false) }
        return
      }

      if (e.key === '?') {
        e.preventDefault()
        toggleShortcuts()
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        toggle()
        return
      }

      if (e.code === 'KeyF') {
        e.preventDefault()
        toggleFullscreen()
        return
      }

      // 2-9 toggle the highlight for the nth note of the current scale,
      // matching the chips above the neck. 0 clears the selection.
      if (e.code === 'Digit0') {
        e.preventDefault()
        clearIntervals()
        return
      }

      const digit = /^Digit([1-9])$/.exec(e.code)
      if (digit) {
        const scale = useTheoryStore.getState().scale
        if (!scale) return
        const semitones = scale.pattern[Number(digit[1]) - 1]
        if (semitones === undefined) return
        // The tonic is always shown on the neck, so `1` is not a toggle.
        if (semitones === 0) return
        e.preventDefault()
        toggleInterval(semitones)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggle, toggleFullscreen, toggleShortcuts, toggleInterval, clearIntervals])
}
