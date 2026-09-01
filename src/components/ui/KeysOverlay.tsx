import { useCallback, useEffect, useMemo, useState } from 'react'
import { useViewStore } from '../../store/view'
import { useTheoryStore } from '../../store/theory'
import { SCALES_BY_ID, getScaleNotes } from '../../theory/scales'
import {
  cursorForKey, getKeyWedges, ringLabel, ringRoot, spellInKey,
  RINGS, RING_SCALE_ID, type Cursor, type Ring,
} from '../../theory/keys'
import { KeysWheel } from '../circle/KeysWheel'

/**
 * Keys overlay: press `K` for the whole circle of fifths, and take a tonic
 * *and* a scale from it in one click. Arrow keys move, Enter commits.
 *
 * `T` stays what it was. It changes the tonic and leaves your scale alone, so
 * it still works from Lydian or a pentatonic; this wheel only knows the three
 * modes a key signature describes, and would silently flatten anything else.
 */

/** Which degree of the parent major each ring's root is. */
const RING_DEGREE_LABEL: Record<Ring, string> = { major: '1', minor: '6', dim: '7' }

const RING_WORD: Record<Ring, string> = {
  major: 'major',
  minor: 'natural minor',
  dim:   'diminished',
}

export function KeysOverlay() {
  const closeKeys = useViewStore(s => s.closeKeys)

  const root     = useTheoryStore(s => s.root)
  const scale    = useTheoryStore(s => s.scale)
  const setRoot  = useTheoryStore(s => s.setRoot)
  const setScale = useTheoryStore(s => s.setScale)

  const wedges = useMemo(() => getKeyWedges(), [])

  // Where the app actually is, when the wheel can name it.
  const current = useMemo(() => cursorForKey(root, scale?.id), [root, scale])

  // App mounts this only while `keysOpen`, so the cursor starts fresh on the
  // current key every time and needs no reset effect — the same reason the
  // guided tour is mounted conditionally.
  const [cursor, setCursor] = useState<Cursor>(() => current ?? { index: 0, ring: 'major' })

  // Focus on mount without an effect, as the quick-pick does with its input.
  // A modal that focuses nothing leaves the keyboard in the page behind it.
  const cardRef = useCallback((el: HTMLDivElement | null) => { el?.focus() }, [])

  const commit = useCallback((c: Cursor) => {
    const w = wedges[c.index]
    setRoot(ringRoot(w, c.ring))
    setScale(SCALES_BY_ID[RING_SCALE_ID[c.ring]])
    closeKeys()
  }, [wedges, setRoot, setScale, closeKeys])

  // On the window, for the same reason the quick-pick moved there: a click on
  // the card's own chrome blurs it and a bound handler stops seeing keys. The
  // global shortcuts stand down while this is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      const ringAt = RINGS.indexOf(cursor.ring)
      if (e.key === 'Escape' || e.code === 'KeyK') { e.preventDefault(); closeKeys() }
      // Nothing inside is tabbable, so Tab would walk into the page behind the
      // modal — including the sidebar's scale filter, where typing is invisible.
      else if (e.key === 'Tab')        { e.preventDefault() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); setCursor(c => ({ ...c, index: (c.index + 1) % 12 })) }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); setCursor(c => ({ ...c, index: (c.index + 11) % 12 })) }
      else if (e.key === 'ArrowDown')  { e.preventDefault(); setCursor(c => ({ ...c, ring: RINGS[Math.min(ringAt + 1, RINGS.length - 1)] })) }
      else if (e.key === 'ArrowUp')    { e.preventDefault(); setCursor(c => ({ ...c, ring: RINGS[Math.max(ringAt - 1, 0)] })) }
      else if (e.key === 'Enter')      { e.preventDefault(); commit(cursor) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cursor, commit, closeKeys])

  const w         = wedges[cursor.index]
  const pointed   = ringRoot(w, cursor.ring)
  const isCurrent = current?.index === cursor.index && current.ring === cursor.ring

  const sig       = w.signature
  const ringScale = SCALES_BY_ID[RING_SCALE_ID[cursor.ring]]
  // Against the degree, not the pitch class: F# major's seventh is E#, and a
  // bare lookup renders it F — an F twice in a key with seven letters.
  const notes     = getScaleNotes(pointed, ringScale)
    .map((pc, i) => spellInKey(pc, pointed, ringScale.degrees[i]))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keys"
      onMouseDown={e => { if (e.target === e.currentTarget) closeKeys() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 78,
        background: 'rgba(6,5,4,.86)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        ref={cardRef}
        tabIndex={-1}
        style={{
        outline: 'none',
        width: 'min(680px, calc(100vw - 32px))', maxHeight: 'calc(100vh - 48px)',
        boxSizing: 'border-box',
        background: '#1c1610', border: '1px solid #3d3125', borderRadius: '18px',
        boxShadow: '0 26px 64px rgba(0,0,0,.62)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px 12px', borderBottom: '1px solid #2c241c' }}>
          <span style={{
            flexShrink: 0, padding: '4px 9px', borderRadius: '7px',
            background: 'rgba(224,168,90,.14)', border: '1px solid rgba(224,168,90,.3)',
            color: '#e0a85a', fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
          }}>
            Keys
          </span>
          <span style={{ fontSize: '13px', color: '#8a7f72' }}>
            Every key, its relative minor and its diminished — one click sets both tonic and scale.
          </span>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', padding: '14px 20px 4px' }}>
          <KeysWheel
            wedges={wedges}
            current={current}
            cursor={cursor}
            onCursor={setCursor}
            onPick={commit}
          />
        </div>

        {/* The reference layer: what the wedge under the cursor actually is. */}
        <div style={{ padding: '10px 20px 12px', borderTop: '1px solid #2c241c' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '19px', fontWeight: 800, color: '#f1ebe2' }}>
              {ringLabel(w, cursor.ring)}
            </span>
            <span style={{ fontSize: '12.5px', color: '#8a7f72' }}>
              {spellInKey(pointed, w.major, RING_DEGREE_LABEL[cursor.ring])} {RING_WORD[cursor.ring]}
            </span>
            <span style={{ fontSize: '12.5px', color: '#8a7f72', fontFamily: "'JetBrains Mono', monospace" }}>
              {sig.accidental === null
                ? 'no sharps or flats'
                : `${sig.notes.length} ${sig.accidental === '#' ? 'sharp' : 'flat'}${sig.notes.length > 1 ? 's' : ''} · ${sig.notes.join(' ')}${sig.accidental === '#' ? '♯' : '♭'}`}
            </span>
            {isCurrent && (
              <span style={{ fontSize: '11px', color: '#e0a85a', fontWeight: 700 }}>current</span>
            )}
          </div>
          <div style={{ marginTop: '7px', fontSize: '13px', color: '#c7bcae', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '.06em' }}>
            {notes.join('  ')}
          </div>
          {current === null && scale && (
            <div style={{ marginTop: '7px', fontSize: '12px', color: '#8a7f72' }}>
              You are in {scale.name}, which no key signature describes — nothing on the wheel is lit.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '9px 20px', borderTop: '1px solid #2c241c', fontSize: '11px', color: '#6b6258' }}>
          <span>←→ key</span>
          <span>↑↓ ring</span>
          <span>↵ select</span>
          <span style={{ marginLeft: 'auto' }}>Esc close</span>
        </div>
      </div>
    </div>
  )
}
