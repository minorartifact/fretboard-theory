import { useTheoryStore } from '../../store/theory'
import { SHARP_NAMES } from '../../theory/constants'
import { spellRoot } from '../../theory/pitch'
import type { PitchClass } from '../../theory/types'

/**
 * F1: the root is the biggest thing on screen but was read-only — the only way
 * to change key was clicking a node in the sidebar's circle, an affordance
 * whose only label was a hover tooltip. The circle still sets the root; this
 * puts a way in where the key is actually shown.
 */
export function KeyStrip() {
  const root    = useTheoryStore(s => s.root)
  const scale   = useTheoryStore(s => s.scale)
  const setRoot = useTheoryStore(s => s.setRoot)

  return (
    <div
      role="group"
      aria-label="Key"
      style={{ display: 'flex', gap: '3px', marginTop: '12px', flexWrap: 'wrap' }}
    >
      {SHARP_NAMES.map((sharpName, pc) => {
        const active   = pc === root
        // Labelled from the table, the button offered a D♯ that every other
        // surface then called E♭ — one key under two names, one of them
        // unclickable. It has to say what the key will be called.
        const name     = spellRoot(pc as PitchClass, scale)
        const isSharp  = sharpName.includes('#')
        const label    = name.replace('#', '♯').replace('b', '♭')
        return (
          <button
            key={pc}
            onClick={() => setRoot(pc as PitchClass)}
            aria-pressed={active}
            title={`Key of ${label}`}
            className={active ? '' : 'h-chip'}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '32px', height: '30px', padding: '0 8px',
              borderRadius: '8px',
              border: `1px solid ${active ? '#e0564f' : '#2a221b'}`,
              background: active ? '#e0564f' : 'transparent',
              color: active ? '#fff' : (isSharp ? '#8a7f72' : '#c7bcae'),
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12.5px', fontWeight: 700,
              cursor: 'pointer',
              transition: 'background .12s, border-color .12s, color .12s',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
