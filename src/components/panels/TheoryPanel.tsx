import { useState } from 'react'
import { CircleOfFifths } from '../circle/CircleOfFifths'
import { ScaleSelector } from '../theory/ScaleSelector'
import { ChordQualitySelector } from '../theory/ChordQualitySelector'
import { SavedSongsPanel } from '../theory/SavedSongsPanel'

interface SectionProps {
  label:       string
  defaultOpen?: boolean
  flex?:       boolean
  children:    React.ReactNode
}

function CollapsibleSection({ label, defaultOpen = true, flex = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{
      borderBottom: '1px solid var(--border-subtle)',
      flexShrink: flex && open ? undefined : 0,
      ...(flex && open ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : {}),
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 22px', background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#6b6258' }}>
          {label}
        </span>
        <span style={{
          fontSize: '12px', color: '#4a4540', lineHeight: 1,
          display: 'inline-block',
          transition: 'transform .15s',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
        }}>
          ▾
        </span>
      </button>

      {open && (
        <div style={{
          padding: '2px 22px 18px',
          ...(flex ? { flex: 1, minHeight: 0, overflowY: 'auto' } : {}),
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

export function TheoryPanel() {
  return (
    <aside style={{
      width: '308px', minWidth: '308px',
      display: 'flex', flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border-subtle)',
    }}>
      {/* Brand header — not collapsible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 22px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px',
          background: 'linear-gradient(150deg,#e05555,#c038b8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '16px', color: '#fff',
          boxShadow: '0 2px 8px rgba(224,85,85,.25)', flexShrink: 0,
        }}>
          N
        </div>
        <div>
          <div style={{ fontSize: '14.5px', fontWeight: 700, letterSpacing: '-.01em', lineHeight: 1.1 }}>Neckwise</div>
          <div style={{ fontSize: '11.5px', color: '#8a7f72', marginTop: '2px' }}>Explore harmony across the fretboard.</div>
        </div>
      </div>

      <CollapsibleSection label="Circle of fifths">
        <CircleOfFifths />
      </CollapsibleSection>

      <CollapsibleSection label="Chord quality" defaultOpen={false}>
        <ChordQualitySelector />
      </CollapsibleSection>

      <CollapsibleSection label="Scale" flex>
        <ScaleSelector />
      </CollapsibleSection>

      <CollapsibleSection label="Progressions" defaultOpen={false}>
        <SavedSongsPanel />
      </CollapsibleSection>
    </aside>
  )
}
