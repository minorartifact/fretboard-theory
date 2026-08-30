import { useSyncExternalStore } from 'react'

/**
 * Subscribe to a CSS media query. The app styles inline rather than in a
 * stylesheet, so breakpoints have to be readable from JS.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    listener => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', listener)
      return () => mql.removeEventListener('change', listener)
    },
    () => window.matchMedia(query).matches,
    () => false,   // server / no-DOM fallback: assume the wide layout
  )
}

/** Below this the sidebar is a drawer rather than a permanent column. */
export const NARROW = '(max-width: 900px)'
