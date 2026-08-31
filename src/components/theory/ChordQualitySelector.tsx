import { useTheoryStore } from '../../store/theory'
import { CHORD_QUALITIES_BY_ID } from '../../theory/chords'
import type { ChordQuality } from '../../theory/types'

const GROUPS: Array<{ label: string; ids: string[] }> = [
  { label: 'Triads',   ids: ['maj','min','dim','aug','sus2','sus4'] },
  { label: 'Seventh',  ids: ['maj7','dom7','min7','min-maj7','m7b5','dim7'] },
  { label: 'Extended', ids: ['dom9','maj9','min9'] },
]

function buttonLabel(q: ChordQuality): string {
  if (q.id === 'maj')      return 'M'
  if (q.id === 'min-maj7') return 'mM7'
  return q.symbol || q.id
}

export function ChordQualitySelector() {
  const chordQualityId    = useTheoryStore(s => s.chordQualityId)
  const setChordQualityId = useTheoryStore(s => s.setChordQualityId)

  function toggle(id: string) {
    setChordQualityId(chordQualityId === id ? null : id)
  }

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '6px', minHeight: '14px' }}>
        {chordQualityId && (
          <button
            onClick={() => setChordQualityId(null)}
            style={{ fontSize: '11px', color: '#8a7f72', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color .12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#b3a89a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8a7f72' }}
          >
            clear
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {GROUPS.map(({ label, ids }) => {
          const qualities = ids.map(id => CHORD_QUALITIES_BY_ID[id]).filter(Boolean)
          return (
            <div key={label}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.13em', textTransform: 'uppercase', color: '#8a7f72', marginBottom: '6px', paddingLeft: '2px' }}>
                {label}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
                {qualities.map(q => {
                  const active = chordQualityId === q.id
                  return (
                    <button
                      key={q.id}
                      onClick={() => toggle(q.id)}
                      title={q.name}
                      style={{
                        padding: '7px 4px',
                        borderRadius: '7px',
                        border: active ? '1px solid #c23bb6' : '1px solid #2a221b',
                        background: active ? 'rgba(194,59,182,.18)' : '#201a14',
                        color: active ? '#e888e0' : '#b3a89a',
                        fontSize: '11px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background .12s, color .12s',
                      }}
                      onMouseEnter={e => { if (!active) { const b = e.currentTarget; b.style.background = '#2c241c'; b.style.color = '#ede6dd' } }}
                      onMouseLeave={e => { if (!active) { const b = e.currentTarget; b.style.background = '#201a14'; b.style.color = '#b3a89a' } }}
                    >
                      {buttonLabel(q)}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
