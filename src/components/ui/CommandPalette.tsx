import { useCallback, useEffect, useMemo, useState } from 'react'
import { useViewStore, type PaletteKind } from '../../store/view'
import { useTheoryStore } from '../../store/theory'
import { chooseChordQuality } from '../../store/selection'
import { SCALES } from '../../theory/scales'
import { CHORD_QUALITIES, getChordNotes } from '../../theory/chords'
import { spellRoot, spellChordTones } from '../../theory/pitch'
import type { PitchClass } from '../../theory/types'

/**
 * Quick-pick overlay: press `t`, `s` or `q` to change key, scale or chord
 * quality without reaching for the sidebar. Same visual language as the guided
 * tour — one dim layer, one card.
 */

interface Item {
  id:       string
  label:    string
  meta?:    string
  /** Concrete notes, so you can read what you would actually play. */
  notes?:   string
  hint?:    string
  current:  boolean
  choose:   () => void
}

const KINDS: { kind: PaletteKind; label: string; key: string; placeholder: string }[] = [
  { kind: 'tonic',   label: 'Key',           key: 'T', placeholder: 'Change key…' },
  { kind: 'scale',   label: 'Scale',         key: 'S', placeholder: 'Find a scale or mode…' },
  { kind: 'quality', label: 'Chord quality', key: 'Q', placeholder: 'Pick a chord quality…' },
]

export function CommandPalette() {
  const kind         = useViewStore(s => s.palette)
  const openPalette  = useViewStore(s => s.openPalette)
  const closePalette = useViewStore(s => s.closePalette)

  const root           = useTheoryStore(s => s.root)
  const scale          = useTheoryStore(s => s.scale)
  const chordQualityId = useTheoryStore(s => s.chordQualityId)
  const setRoot        = useTheoryStore(s => s.setRoot)
  const setScale       = useTheoryStore(s => s.setScale)
  const setQuality     = chooseChordQuality

  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState(0)

  const close = useCallback(() => { setQuery(''); setSelected(0); closePalette() }, [closePalette])

  const items: Item[] = useMemo(() => {
    if (kind === 'tonic') {
      return Array.from({ length: 12 }, (_, pc) => {
        const name = spellRoot(pc as PitchClass, scale)
        return {
          id: `pc-${pc}`,
          label: name.replace('#', '♯').replace('b', '♭'),
          meta: `Key of ${name}`,
          current: pc === root,
          choose: () => setRoot(pc as PitchClass),
        }
      })
    }
    if (kind === 'scale') {
      return SCALES.map(s => ({
        id: s.id,
        label: s.name,
        meta: `${s.category} · ${s.pattern.length} notes`,
        // Same column as a chord's degrees: what the thing is built from.
        hint: s.degrees.join(' '),
        current: scale?.id === s.id,
        choose: () => setScale(s),
      }))
    }
    const rootName = spellRoot(root, scale)
    return [
      {
        id: '__none', label: 'No chord quality', meta: 'Show the scale on its own',
        current: chordQualityId === null, choose: () => setQuality(null),
      },
      ...CHORD_QUALITIES.map(q => ({
        id: q.id,
        label: q.name,
        meta: `${rootName}${q.symbol}`,
        // Spell each note against the degree it plays, or a diminished fifth
        // comes out as D# rather than Eb — wrong in a theory app.
        notes: spellChordTones(getChordNotes({ root, quality: q }), q.degreeLabels, root, root, scale).join(' '),
        hint: q.degreeLabels.join(' '),
        current: chordQualityId === q.id,
        choose: () => setQuality(q.id),
      })),
    ]
  }, [kind, root, scale, chordQualityId, setRoot, setScale, setQuality])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(i =>
      i.label.toLowerCase().includes(q) || (i.meta?.toLowerCase().includes(q) ?? false))
  }, [items, query])

  // Clamp rather than resetting from an effect: the list shrinks as you type.
  const index = matches.length === 0 ? 0 : Math.min(selected, matches.length - 1)

  const commit = useCallback((item: Item | undefined) => {
    if (!item) return
    item.choose()
    close()
  }, [close])

  // On the window, not the card: clicking the card's own chrome blurs the input,
  // and a handler bound to the card would then never see the key at all — Esc
  // stopped closing the overlay. The global shortcuts stand down while it is open.
  useEffect(() => {
    if (!kind) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')         { e.preventDefault(); close() }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(Math.min(index + 1, matches.length - 1)) }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(Math.max(index - 1, 0)) }
      else if (e.key === 'Enter')     { e.preventDefault(); commit(matches[index]) }
      else if (e.key === 'Tab') {
        // Cycle categories without leaving the overlay.
        e.preventDefault()
        const at = KINDS.findIndex(k => k.kind === kind)
        const next = KINDS[(at + (e.shiftKey ? KINDS.length - 1 : 1)) % KINDS.length]
        setQuery(''); setSelected(0); openPalette(next.kind)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [kind, index, matches, close, commit, openPalette])

  /** Focus on mount without an effect. */
  const inputRef = useCallback((el: HTMLInputElement | null) => { el?.focus() }, [])

  if (!kind) return null
  const active = KINDS.find(k => k.kind === kind)!

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={active.placeholder}
      onMouseDown={e => { if (e.target === e.currentTarget) close() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 75,
        background: 'rgba(6,5,4,.82)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 'min(18vh, 160px)',
      }}
    >
      <div
        style={{
          width: 'min(560px, calc(100vw - 32px))', boxSizing: 'border-box',
          background: '#1c1610', border: '1px solid #3d3125', borderRadius: '16px',
          boxShadow: '0 26px 64px rgba(0,0,0,.62)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', maxHeight: 'min(62vh, 520px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px 12px', borderBottom: '1px solid #2c241c' }}>
          <span style={{
            flexShrink: 0, padding: '4px 9px', borderRadius: '7px',
            background: 'rgba(224,168,90,.14)', border: '1px solid rgba(224,168,90,.3)',
            color: '#e0a85a', fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
          }}>
            {active.label}
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            placeholder={active.placeholder}
            aria-label={active.placeholder}
            style={{
              flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
              color: '#f5efe5', fontFamily: 'inherit', fontSize: '17px', fontWeight: 500,
            }}
          />
          <span style={{ flexShrink: 0, fontSize: '11px', color: '#6b6258', fontFamily: "'JetBrains Mono', monospace" }}>
            Tab
          </span>
        </div>

        <div style={{ overflowY: 'auto', padding: '6px' }}>
          {matches.length === 0 && (
            <div style={{ padding: '18px 14px', fontSize: '13px', color: '#8a7f72' }}>
              Nothing matches “{query.trim()}”.
            </div>
          )}
          {matches.map((item, i) => (
            <button
              key={item.id}
              onMouseEnter={() => setSelected(i)}
              onClick={() => commit(item)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                padding: '9px 12px', borderRadius: '9px', border: 'none', textAlign: 'left',
                background: i === index ? '#2c241c' : 'transparent',
                color: i === index ? '#f5efe5' : '#c7bcae',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 600, flexShrink: 0 }}>{item.label}</span>
              {item.meta && (
                <span style={{ fontSize: '12px', color: '#8a7f72', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.meta}
                </span>
              )}
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                {item.notes && (
                  <span style={{ fontSize: '12px', color: '#c7bcae', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '.04em' }}>
                    {item.notes}
                  </span>
                )}
                {item.hint && (
                  <span style={{ fontSize: '11px', color: '#6b6258', fontFamily: "'JetBrains Mono', monospace" }}>{item.hint}</span>
                )}
                {item.current && (
                  <span style={{ fontSize: '11px', color: '#e0a85a', fontWeight: 700 }}>current</span>
                )}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '9px 16px', borderTop: '1px solid #2c241c', fontSize: '11px', color: '#6b6258' }}>
          <span>↑↓ move</span>
          <span>↵ select</span>
          <span>Tab switch</span>
          <span style={{ marginLeft: 'auto' }}>Esc close</span>
        </div>
      </div>
    </div>
  )
}
