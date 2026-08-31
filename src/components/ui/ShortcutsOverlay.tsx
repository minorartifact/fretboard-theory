import { useViewStore } from '../../store/view'

const GROUPS: { title: string; rows: [string, string][] }[] = [
  {
    title: 'Transport',
    rows: [['Space', 'Play / pause the progression']],
  },
  {
    title: 'Fretboard',
    rows: [
      ['2 – 9', 'Spotlight the nth note of the scale'],
      ['0',     'Clear the spotlight'],
    ],
  },
  {
    title: 'Layout',
    rows: [
      ['F',   'Fullscreen — neck and progression only'],
      ['Esc', 'Close this, or leave fullscreen'],
      ['?',   'Show this list'],
    ],
  },
]

const KEY: React.CSSProperties = {
  display: 'inline-block', minWidth: '2.1rem', textAlign: 'center',
  padding: '3px 8px', borderRadius: '7px',
  border: '1px solid #3a2e22', background: '#221b14',
  color: '#ede6dd', fontFamily: "'JetBrains Mono', monospace",
  fontSize: '12px', fontWeight: 700, flexShrink: 0,
}

export function ShortcutsOverlay() {
  const open  = useViewStore(s => s.shortcutsOpen)
  const close = useViewStore(s => s.closeShortcuts)
  if (!open) return null

  return (
    <div
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(8,6,5,.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(430px, 100%)',
          background: 'var(--bg-panel)',
          border: '1px solid #2a221b', borderRadius: '14px',
          padding: '22px 24px 24px',
          display: 'flex', flexDirection: 'column', gap: '18px',
          boxShadow: '0 18px 50px rgba(0,0,0,.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#6b6258' }}>
            Keyboard shortcuts
          </span>
          <button
            onClick={close}
            title="Close"
            className="h-ghost"
            style={{ background: 'none', border: 'none', color: '#6b6258', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {GROUPS.map(group => (
          <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#534a40' }}>
              {group.title}
            </span>
            {group.rows.map(([key, what]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={KEY}>{key}</span>
                <span style={{ fontSize: '13.5px', color: '#b3a89a' }}>{what}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
