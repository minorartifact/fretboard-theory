import { useViewStore } from '../../store/view'
import type { LabelMode } from '../../theory/types'

const MODES: { value: LabelMode; label: string }[] = [
  { value: 'note',     label: 'Note' },
  { value: 'degree',   label: 'Degree' },
  { value: 'interval', label: 'Interval' },
]

export function LabelModeToggle() {
  const labelMode    = useViewStore(s => s.labelMode)
  const setLabelMode = useViewStore(s => s.setLabelMode)

  return (
    <div style={{ display: 'flex', gap: '4px', background: '#16120e', border: '1px solid #2a221b', borderRadius: '11px', padding: '4px' }}>
      {MODES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setLabelMode(value)}
          style={{
            padding: '7px 18px',
            borderRadius: '8px',
            border: 'none',
            background: labelMode === value ? '#2c241c' : 'transparent',
            color: labelMode === value ? '#f1ebe2' : '#6b6258',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background .12s, color .12s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { if (labelMode !== value) (e.currentTarget as HTMLButtonElement).style.color = '#b3a89a' }}
          onMouseLeave={e => { if (labelMode !== value) (e.currentTarget as HTMLButtonElement).style.color = '#6b6258' }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
