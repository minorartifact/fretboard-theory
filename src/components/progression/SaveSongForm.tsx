import type { SaveSongControl } from './useSaveSong'

interface Props {
  control:      SaveSongControl
  marginBottom: string
}

export function SaveSongForm({ control, marginBottom }: Props) {
  const { saving, saveName, setSaveName, inputRef, cancel, commit } = control
  if (!saving) return null

  const canSave = saveName.trim().length > 0

  return (
    <div style={{ display: 'flex', gap: '6px', marginBottom, alignItems: 'center' }}>
      <input
        ref={inputRef}
        type="text" value={saveName}
        onChange={e => setSaveName(e.currentTarget.value)}
        onKeyDown={e => {
          if (e.key === 'Enter')  commit()
          if (e.key === 'Escape') cancel()
        }}
        placeholder="Song name…"
        style={{ flex: 1, height: '28px', borderRadius: '7px', border: '1px solid #3a2e22', background: '#16120e', color: '#ede6dd', padding: '0 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', outline: 'none' }}
      />
      <button
        onClick={commit}
        disabled={!canSave}
        className={canSave ? 'h-icon' : ''}
        style={{ height: '28px', padding: '0 12px', borderRadius: '7px', border: '1px solid #3a2e22', background: canSave ? '#231b13' : '#1b150f', color: canSave ? '#ede6dd' : '#a89d90', cursor: canSave ? 'pointer' : 'not-allowed', fontSize: '11.5px', fontWeight: 700, fontFamily: 'inherit', transition: 'background .12s, color .12s' }}
      >
        Save
      </button>
      <button onClick={cancel} className="h-ghost" style={{ height: '28px', padding: '0 8px', background: 'none', border: 'none', color: '#8a7f72', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', transition: 'color .12s' }}>×</button>
    </div>
  )
}
