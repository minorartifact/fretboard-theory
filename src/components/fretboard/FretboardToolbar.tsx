import { useInteractiveStore, POSITIONS, type FretboardMode } from '../../store/interactive'
import { useViewStore } from '../../store/view'
import { useTheoryStore } from '../../store/theory'
import { useFretboardStore } from '../../store/fretboard'
import { ALL_INTERVALS } from '../../theory/intervals'
import { SEMITONE_TO_INTERVAL } from '../../theory/constants'
import { getPitchName } from '../../theory/pitch'

const SEG_BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  height: '32px', padding: '0 12px', borderRadius: '7px', border: 'none',
  background: 'transparent', color: '#8a7f72', fontSize: '12px',
  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  transition: 'background .12s, color .12s', whiteSpace: 'nowrap',
}

const SEG_MONO: React.CSSProperties = { ...SEG_BTN, fontFamily: "'JetBrains Mono', monospace" }

const SEGMENTED: React.CSSProperties = {
  display: 'flex', gap: '3px', background: '#16120e',
  border: '1px solid #2a221b', borderRadius: '10px', padding: '3px',
  flexShrink: 0,
}

const GROUP_LABEL: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, letterSpacing: '.16em',
  textTransform: 'uppercase', color: '#6b6258', flexShrink: 0,
}

const ACTION_BTN: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '7px 13px', borderRadius: '10px',
  border: '1px solid #2a221b', background: '#1b150f',
  color: '#b3a89a', fontSize: '12.5px', fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s',
  flexShrink: 0, whiteSpace: 'nowrap',
}

const ICON_BTN: React.CSSProperties = {
  ...ACTION_BTN, padding: '7px 11px', fontSize: '13px', gap: 0,
}

// Each mode gets its own accent so the neck's treatment is predictable.
const MODE_ACCENT: Record<FretboardMode, { fg: string; bg: string }> = {
  explore:   { fg: '#f1ebe2', bg: '#2c241c' },
  identify:  { fg: '#f0cf95', bg: 'rgba(224,168,90,.18)' },
  chords:    { fg: '#6cd8e8', bg: 'rgba(56,196,214,.16)' },
  intervals: { fg: '#c3aef2', bg: 'rgba(150,120,230,.22)' },
}

const MODES: { id: FretboardMode; label: string; hint: string }[] = [
  { id: 'explore',   label: 'Explore',   hint: 'Tap a fret to hear it · hover a note to light up its octaves' },
  { id: 'identify',  label: 'Identify',  hint: 'Tap notes to name the interval or chord they form' },
  { id: 'chords',    label: 'Chords',    hint: 'Each colour is one voicing · hover a chord to focus' },
  { id: 'intervals', label: 'Intervals', hint: 'Pick intervals below · tap any fret to move the anchor' },
]

interface Props {
  onHearScale: () => void
}

export function FretboardToolbar({ onHearScale }: Props) {
  const posIdx            = useInteractiveStore(s => s.posIdx)
  const setPosIdx         = useInteractiveStore(s => s.setPosIdx)
  const mode              = useInteractiveStore(s => s.mode)
  const setMode           = useInteractiveStore(s => s.setMode)
  const selectedIntervals = useInteractiveStore(s => s.selectedIntervals)
  const anchor            = useInteractiveStore(s => s.anchor)
  const toggleInterval    = useInteractiveStore(s => s.toggleInterval)
  const clearIntervals    = useInteractiveStore(s => s.clearIntervals)

  const fullscreen       = useViewStore(s => s.fullscreen)
  const toggleFullscreen = useViewStore(s => s.toggleFullscreen)
  const root             = useTheoryStore(s => s.root)
  const hasScale         = useTheoryStore(s => s.scale !== null)
  const fretCount        = useFretboardStore(s => s.fretCount)

  const anchorPc   = anchor?.pc ?? root
  const anchorName = getPitchName(anchorPc, 'auto', root)
  const activeMode = MODES.find(m => m.id === mode)
  const hint       = activeMode?.hint ?? ''
  const modeLabel  = activeMode?.label ?? ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={GROUP_LABEL}>Mode</span>
        <div style={SEGMENTED}>
          {MODES.map(m => {
            const active = mode === m.id
            const accent = MODE_ACCENT[m.id]
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={active ? { ...SEG_BTN, background: accent.bg, color: accent.fg } : SEG_BTN}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        <span style={GROUP_LABEL}>Position</span>
        <div style={SEGMENTED}>
          <button onClick={() => setPosIdx(null)} style={posIdx === null ? { ...SEG_BTN, background: '#2c241c', color: '#f1ebe2' } : SEG_BTN}>
            All
          </button>
          {POSITIONS.map((pos, i) => ({ pos, i })).filter(({ pos }) => pos.hi <= fretCount).map(({ pos, i }) => (
            <button
              key={i}
              onClick={() => setPosIdx(posIdx === i ? null : i)}
              style={posIdx === i ? { ...SEG_MONO, background: 'rgba(224,168,90,.16)', color: '#f0cf95' } : SEG_MONO}
            >
              {pos.label}
            </button>
          ))}
        </div>

        <button
          onClick={onHearScale}
          disabled={!hasScale}
          className={hasScale ? 'h-icon' : ''}
          title={hasScale ? 'Play the scale through the current position' : 'Pick a scale first'}
          style={{
            ...ACTION_BTN,
            color: hasScale ? '#b3a89a' : '#a89d90',
            cursor: hasScale ? 'pointer' : 'not-allowed',
          }}
        >
          ▶  Hear scale
        </button>

        <span style={{ flex: 1, minWidth: 0 }} />

        <button
          onClick={toggleFullscreen}
          title={fullscreen ? 'Exit fullscreen (F or Esc)' : 'Fullscreen — the neck and your progression, no chrome (F)'}
          style={{
            ...ICON_BTN,
            border: `1px solid ${fullscreen ? 'rgba(224,168,90,.5)' : '#2a221b'}`,
            background: fullscreen ? 'rgba(224,168,90,.15)' : '#1b150f',
            color: fullscreen ? '#f0cf95' : '#b3a89a',
          }}
        >
          {fullscreen ? '⤡' : '⤢'}
        </button>
      </div>

      {/* The mode hint gets a row of its own. As a flex:1 filler it was the
          first thing to ellipsis away on a tablet, and it is the only
          explanation of the four modes anywhere in the app. */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: '7px', flexWrap: 'wrap',
        fontSize: '12px', lineHeight: 1.5, color: '#8a7f72',
      }}>
        <span style={{ fontWeight: 700, color: MODE_ACCENT[mode].fg }}>{modeLabel}</span>
        <span>— {hint}</span>
      </div>

      {mode === 'intervals' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={GROUP_LABEL}>From {anchorName}</span>
          <div style={SEGMENTED}>
            {ALL_INTERVALS.map(semi => (
              <button
                key={semi}
                onClick={() => toggleInterval(semi)}
                title={`${SEMITONE_TO_INTERVAL[semi]} — ${semi} semitone${semi === 1 ? '' : 's'} above ${anchorName}`}
                style={selectedIntervals.includes(semi)
                  ? { ...SEG_MONO, background: 'rgba(150,120,230,.22)', color: '#c3aef2' }
                  : SEG_MONO}
              >
                {SEMITONE_TO_INTERVAL[semi]}
              </button>
            ))}
          </div>

          {anchor === null
            ? <span style={{ fontSize: '11.5px', color: '#6b6258' }}>anchor follows the root</span>
            : <span style={{ fontSize: '11.5px', color: '#8a7f72' }}>anchored · string {anchor.string + 1}, fret {anchor.fret}</span>}

          {(selectedIntervals.length > 0 || anchor !== null) && (
            <button onClick={clearIntervals} className="h-ghost" style={{
              fontSize: '11.5px', color: '#8a7f72', background: 'transparent',
              border: '1px solid #2a221b', borderRadius: '8px', padding: '4px 10px',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
            }}>
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}
