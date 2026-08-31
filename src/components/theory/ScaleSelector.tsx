import { useMemo, useState } from 'react'
import { useTheoryStore } from '../../store/theory'
import { SCALES } from '../../theory/scales'
import type { ScaleDef } from '../../theory/types'

const CATEGORY_ORDER = ['Major Modes','Melodic Minor','Harmonic Minor','Pentatonic & Blues','Symmetric']

export function ScaleSelector() {
  const scale    = useTheoryStore(s => s.scale)
  const setScale = useTheoryStore(s => s.setScale)

  // F10: a flat list this long, five category headings deep, meant scrolling
  // past 18 modes to reach anything in the lower categories.
  const [query, setQuery] = useState('')

  const categories = useMemo(() => {
    const q = query.trim().toLowerCase()
    const map = new Map<string, ScaleDef[]>()
    CATEGORY_ORDER.forEach(cat => map.set(cat, []))
    SCALES.forEach(s => {
      if (q && !s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) return
      if (map.has(s.category)) map.get(s.category)!.push(s)
    })
    return Array.from(map.entries()).filter(([, scales]) => scales.length > 0)
  }, [query])

  return (
    <section data-tour="scales" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'sticky', top: 0, background: 'var(--bg-panel)', paddingBottom: '6px', marginBottom: '6px', zIndex: 1 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#6b6258', pointerEvents: 'none' }}>
            &#x2315;
          </span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Filter ${SCALES.length} scales`}
            aria-label="Filter scales"
            onKeyDown={e => {
              // useKeyboardShortcuts ignores every key while a text field has
              // focus, so before this field existed the shortcuts always worked.
              // Without a way out, clicking here silently kills Space, F and 2-9
              // and types them into the box instead.
              if (e.key === 'Escape') { setQuery(''); e.currentTarget.blur() }
              if (e.key === 'Enter')  e.currentTarget.blur()
            }}
            style={{
              width: '100%', boxSizing: 'border-box',
              height: '30px', padding: '0 9px 0 24px',
              background: '#100c09', border: '1px solid #2a221b', borderRadius: '8px',
              color: '#ede6dd', fontSize: '12px', fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>
        {scale && (
          <button
            onClick={() => setScale(null)}
            title="Clear scale"
            style={{ fontSize: '11px', color: '#8a7f72', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color .12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#b3a89a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8a7f72' }}
          >
            clear
          </button>
        )}
      </div>
      {categories.length === 0 && (
        <p style={{ fontSize: '12px', color: '#8a7f72', paddingLeft: '11px', margin: 0 }}>
          No scale matches “{query.trim()}”.
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {categories.map(([cat, scales]) => (
          <div key={cat}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.13em', textTransform: 'uppercase', color: '#8a7f72', marginBottom: '8px', paddingLeft: '11px' }}>
              {cat}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {scales.map(s => {
                const active = scale?.id === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setScale(scale?.id === s.id ? null : s)}
                    title={`${s.name} · ${s.degrees.join('  ')}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      fontSize: '13.5px',
                      fontWeight: active ? 600 : 500,
                      padding: '7px 10px 7px 11px',
                      borderRadius: '7px',
                      border: 'none',
                      borderLeft: active ? '3px solid #3d7fd6' : '3px solid transparent',
                      background: active ? 'rgba(61,127,214,.13)' : 'transparent',
                      color: active ? '#d4e8ff' : '#b3a89a',
                      cursor: 'pointer',
                      width: '100%',
                      fontFamily: 'inherit',
                      transition: 'background .12s, color .12s',
                    }}
                    onMouseEnter={e => { if (!active) { const b = e.currentTarget; b.style.background = '#221b14'; b.style.color = '#e8ddcf' } }}
                    onMouseLeave={e => { if (!active) { const b = e.currentTarget; b.style.background = 'transparent'; b.style.color = '#b3a89a' } }}
                  >
                    <span>{s.name}</span>
                    <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: active ? '#7fb4e8' : '#8a7f72', flexShrink: 0, marginLeft: '8px' }}>
                      {s.pattern.length} notes
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
