import { useEffect, useRef, useState } from 'react'
import { useFretboardStore } from '../../store/fretboard'
import { TUNINGS } from '../../theory/fretboard'

const FRET_COUNTS = [12, 15, 18, 21, 24]

const TRIGGER: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  height: '28px', padding: '0 9px', borderRadius: '8px',
  border: '1px solid #2a221b', background: '#1b150f',
  color: '#b3a89a', fontFamily: "'JetBrains Mono', monospace",
  fontSize: '11.5px', fontWeight: 600, cursor: 'pointer',
  transition: 'background .12s, border-color .12s, color .12s',
  whiteSpace: 'nowrap',
}

interface MenuProps<T> {
  label:    string
  value:    T
  options:  { value: T; label: string }[]
  onSelect: (value: T) => void
}

function Menu<T extends string | number>({ label, value, options, onSelect }: MenuProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = options.find(o => o.value === value)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="h-chip"
        style={TRIGGER}
      >
        {current?.label ?? String(value)}
        <span style={{ fontSize: '11px', color: '#6b6258' }}>▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 5px)', right: 0, zIndex: 30,
            minWidth: '100%', padding: '4px',
            background: '#16120e', border: '1px solid #2a221b',
            borderRadius: '10px', boxShadow: '0 12px 28px rgba(0,0,0,.5)',
            display: 'flex', flexDirection: 'column', gap: '2px',
          }}
        >
          {options.map(o => (
            <button
              key={String(o.value)}
              role="option"
              aria-selected={o.value === value}
              onClick={() => { onSelect(o.value); setOpen(false) }}
              className={o.value === value ? '' : 'h-chip'}
              style={{
                textAlign: 'left', whiteSpace: 'nowrap',
                padding: '7px 10px', borderRadius: '7px', border: 'none',
                background: o.value === value ? '#2c241c' : 'transparent',
                color: o.value === value ? '#f1ebe2' : '#b3a89a',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11.5px', fontWeight: 600, cursor: 'pointer',
                transition: 'background .12s, color .12s',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * F2: the header printed "Standard (EADGBe) · 15 frets" as plain text while
 * setTuning / setFretCount sat in the store with no callers, so the six tunings
 * the README advertises were unreachable. Same line, now wired up.
 */
export function NeckMenus() {
  const tuning       = useFretboardStore(s => s.tuning)
  const setTuning    = useFretboardStore(s => s.setTuning)
  const fretCount    = useFretboardStore(s => s.fretCount)
  const setFretCount = useFretboardStore(s => s.setFretCount)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <Menu
        label="Tuning"
        value={tuning.id}
        options={TUNINGS.map(t => ({ value: t.id, label: t.name }))}
        onSelect={id => {
          const next = TUNINGS.find(t => t.id === id)
          if (next) setTuning(next)
        }}
      />
      <Menu
        label="Fret count"
        value={fretCount}
        options={FRET_COUNTS.map(n => ({ value: n, label: `${n} frets` }))}
        onSelect={setFretCount}
      />
    </div>
  )
}
