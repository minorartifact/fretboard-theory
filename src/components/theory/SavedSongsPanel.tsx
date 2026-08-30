import { useSongsStore } from '../../store/songs'

export function SavedSongsPanel() {
  const songs      = useSongsStore(s => s.songs)
  const deleteSong = useSongsStore(s => s.deleteSong)
  const loadSong   = useSongsStore(s => s.loadSong)

  if (songs.length === 0) {
    return (
      <p style={{ fontSize: '11.5px', color: '#4a4136', lineHeight: 1.6, margin: 0 }}>
        No saved songs yet. Build a progression and hit Save.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {songs.map(song => (
        <div
          key={song.id}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 9px', borderRadius: '8px',
            border: '1px solid transparent',
            transition: 'border-color .12s, background .12s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLDivElement
            el.style.background = '#1b150f'
            el.style.borderColor = '#2a221b'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLDivElement
            el.style.background = 'transparent'
            el.style.borderColor = 'transparent'
          }}
        >
          <button
            onClick={() => loadSong(song.id)}
            title={`Load: ${song.name}`}
            style={{
              flex: 1, minWidth: 0, textAlign: 'left',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', padding: 0,
            }}
          >
            <span style={{
              display: 'block', fontSize: '12.5px', fontWeight: 600,
              color: '#c7bcae', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {song.name}
            </span>
            <span style={{
              display: 'block', fontSize: '10.5px',
              fontFamily: "'JetBrains Mono', monospace",
              color: '#4a4136', marginTop: '1px',
            }}>
              {song.steps.length} chords · {song.bpm} BPM
            </span>
          </button>

          <span
            role="button"
            aria-label="Delete"
            title="Delete"
            onClick={() => deleteSong(song.id)}
            className="h-danger"
            style={{
              width: '18px', height: '18px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#1b150f', border: '1px solid #2a221b',
              color: '#6b6258', fontSize: '13px', lineHeight: 1,
              cursor: 'pointer', flexShrink: 0,
              transition: 'background .12s, color .12s, border-color .12s',
            }}
          >
            ×
          </span>
        </div>
      ))}
    </div>
  )
}
