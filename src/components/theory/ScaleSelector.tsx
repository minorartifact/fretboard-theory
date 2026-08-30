import { useMemo } from 'react'
import { useTheoryStore } from '../../store/theory'
import { SCALES } from '../../theory/scales'
import type { ScaleDef } from '../../theory/types'

const CATEGORY_ORDER = ['Major Modes','Melodic Minor','Harmonic Minor','Pentatonic & Blues','Symmetric']

export function ScaleSelector() {
  const scale    = useTheoryStore(s => s.scale)
  const setScale = useTheoryStore(s => s.setScale)

  const categories = useMemo(() => {
    const map = new Map<string, ScaleDef[]>()
    CATEGORY_ORDER.forEach(cat => map.set(cat, []))
    SCALES.forEach(s => {
      if (map.has(s.category)) map.get(s.category)!.push(s)
    })
    return Array.from(map.entries()).filter(([, scales]) => scales.length > 0)
  }, [])

  return (
    <section style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', position: 'sticky', top: 0, background: 'var(--bg-panel)', paddingBottom: '4px', marginBottom: '6px', minHeight: '14px' }}>
        {scale && (
          <button
            onClick={() => setScale(null)}
            title="Clear scale"
            style={{ fontSize: '10px', color: '#574d42', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color .12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#b3a89a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#574d42' }}
          >
            clear
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {categories.map(([cat, scales]) => (
          <div key={cat}>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '.13em', textTransform: 'uppercase', color: '#574d42', marginBottom: '8px', paddingLeft: '11px' }}>
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
                    <span style={{ fontSize: '10.5px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: active ? '#7fb4e8' : '#574d42', flexShrink: 0, marginLeft: '8px' }}>
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
