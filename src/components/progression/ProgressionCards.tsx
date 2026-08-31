import { useMemo } from 'react'
import { useTheoryStore } from '../../store/theory'
import { useProgressionStore } from '../../store/progression'
import { resolveProgression } from '../../theory/progression'
import { getPitchName } from '../../theory/pitch'
import { degreeFillFor } from '../fretboard/colors'
import { ROMAN, romanNumeral } from './romanNumeral'
import { SaveSongForm } from './SaveSongForm'
import { useSaveSong } from './useSaveSong'

interface Props {
  /** Owned by ProgressionPanel because it drives that component's edit cursor. */
  handleStepClick: (idx: number) => void
}

export function ProgressionCards({ handleStepClick }: Props) {
  const root       = useTheoryStore(s => s.root)
  const scale      = useTheoryStore(s => s.scale)
  const steps      = useProgressionStore(s => s.steps)
  const activeStep = useProgressionStore(s => s.activeStep)
  const beatIndex  = useProgressionStore(s => s.beatIndex)
  const playing    = useProgressionStore(s => s.playing)
  const bpm        = useProgressionStore(s => s.bpm)
  const loop       = useProgressionStore(s => s.loop)
  const metronome  = useProgressionStore(s => s.metronome)
  const hoverStep  = useProgressionStore(s => s.hoverStep)
  const removeAt   = useProgressionStore(s => s.removeAt)
  const restart    = useProgressionStore(s => s.restart)
  const stepBy     = useProgressionStore(s => s.stepBy)
  const toggle     = useProgressionStore(s => s.toggle)
  const toggleLoop = useProgressionStore(s => s.toggleLoop)
  const toggleMetronome = useProgressionStore(s => s.toggleMetronome)
  const setBpm     = useProgressionStore(s => s.setBpm)

  const save = useSaveSong()

  const resolved = useMemo(() => {
    if (!scale || steps.length === 0) return []
    try { return resolveProgression(root, scale, { steps }) }
    catch { /* resolveProgression throws for non-diatonic scales */ return [] }
  }, [root, scale, steps])

  const progEmpty = steps.length === 0
  const progPos   = steps.length ? `${(activeStep ?? 0) + 1} / ${steps.length}` : '–'

  const BTN_JAM: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '28px', height: '28px', fontSize: '11px',
    color: '#9a8f82', background: '#1b150f',
    border: '1px solid #2a221b', borderRadius: '8px',
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background .12s, color .12s',
  }

  return (
    <>
      {/* Transport header — same as normal mode */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#6b6258' }}>
            Progression
          </span>
          <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#8a7f72', fontWeight: 600 }}>
            {progPos}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={restart} style={BTN_JAM} className="h-icon" title="Restart">&#x23EE;</button>
          <button onClick={() => stepBy(-1)} style={BTN_JAM} className="h-icon" title="Previous">&#x25C0;</button>
          <button
            onClick={toggle}
            title={playing ? 'Pause (Space)' : 'Play (Space)'}
            className={!progEmpty ? 'h-icon' : ''}
            style={{
              width: '34px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: playing ? '11px' : '13px', color: '#fff',
              background: progEmpty ? '#3a2e22' : '#e0564f',
              border: 'none', borderRadius: '8px',
              cursor: progEmpty ? 'default' : 'pointer', fontFamily: 'inherit',
              transition: 'background .12s',
            }}
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <button onClick={() => stepBy(1)} style={BTN_JAM} className="h-icon" title="Next">&#x25B6;</button>
          <button
            onClick={toggleLoop}
            title={loop ? 'Loop: on' : 'Loop: off'}
            className="h-icon"
            style={{ ...BTN_JAM, color: loop ? '#e0a85a' : '#6b6258', background: loop ? 'rgba(224,168,90,.12)' : '#1b150f', border: `1px solid ${loop ? 'rgba(224,168,90,.4)' : '#2a221b'}`, fontSize: '14px' }}
          >
            &#x21BB;
          </button>
          <button
            onClick={toggleMetronome}
            title={metronome ? 'Metronome: on' : 'Metronome: off'}
            aria-pressed={metronome}
            className="h-icon"
            style={{
              ...BTN_JAM,
              color: metronome ? '#e0a85a' : '#6b6258',
              background: metronome ? 'rgba(224,168,90,.12)' : '#1b150f',
              border: `1px solid ${metronome ? 'rgba(224,168,90,.4)' : '#2a221b'}`,
              fontSize: '12px', fontWeight: 800,
            }}
          >
            M
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px', background: '#1b150f', border: '1px solid #2a221b', borderRadius: '8px', padding: '0 3px' }}>
            <button onClick={() => setBpm(bpm - 5)} className="h-ghost" style={{ width: '20px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#8a7f72', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color .12s' }}>&#x2212;</button>
            <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#c7bcae', minWidth: '52px', textAlign: 'center' }}>{bpm} BPM</span>
            <button onClick={() => setBpm(bpm + 5)} className="h-ghost" style={{ width: '20px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#8a7f72', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color .12s' }}>+</button>
          </div>
          <button onClick={save.open} className="h-ghost" style={{ fontSize: '11.5px', color: save.saving ? '#e0a85a' : '#8a7f72', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', marginLeft: '4px', transition: 'color .12s' }}>
            Save…
          </button>
        </div>
      </div>

      <SaveSongForm control={save} marginBottom="12px" />

      {/* Large chord cards */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {steps.map((step, idx) => {
          const chord    = resolved[idx]
          const isPlay   = activeStep === idx
          const deg      = step.degree
          const secDomOf = step.secondaryDominantOf
          const fill     = degreeFillFor(secDomOf ?? deg)
          const targetRn = secDomOf != null ? (ROMAN[secDomOf - 1] ?? `${secDomOf}`) : null
          const numeral  = targetRn != null
            ? `V/${targetRn}`
            : (chord ? romanNumeral(deg - 1, chord.quality) : ROMAN[deg - 1] ?? `${deg}`)
          const noteName = chord ? getPitchName(chord.root, 'auto', root) : ''
          const qualSym  = chord?.quality.symbol ?? ''

          return (
            <div
              key={idx}
              onClick={() => handleStepClick(idx)}
              onMouseEnter={() => { if (chord) hoverStep(idx) }}
              onMouseLeave={() => hoverStep(null)}
              title={chord ? `${noteName}${chord.quality.name}` : ''}
              className={!isPlay ? 'h-card' : ''}
              style={{
                position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                padding: '24px 28px 18px', borderRadius: '14px',
                cursor: 'pointer', minWidth: '100px',
                transition: 'border-color .12s, background .12s, box-shadow .12s',
                border: isPlay ? '1px solid #8a6e46' : '1px solid #2a221b',
                background: isPlay ? '#2b1e10' : '#16120e',
              }}
            >
              {/* Play bar */}
              <span style={{ position: 'absolute', top: 0, left: '14px', right: '14px', height: '3px', borderRadius: '0 0 2px 2px', background: isPlay ? '#e0a85a' : 'transparent' }} />

              {/* Step number */}
              <span style={{ position: 'absolute', top: '6px', left: '10px', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: isPlay ? '#e0a85a' : '#3f352a' }}>
                {idx + 1}
              </span>

              {/* Roman numeral */}
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: secDomOf != null ? '20px' : '32px', fontWeight: 700, color: fill, lineHeight: 1, marginTop: '6px' }}>
                {numeral}
              </span>

              {/* Chord name */}
              <span style={{ fontSize: '17px', color: isPlay ? '#f1ebe2' : '#8a7f72', fontWeight: 700, lineHeight: 1, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                {noteName}<span style={{ fontSize: '13px', fontWeight: 500, color: isPlay ? '#b3a89a' : '#6b6258' }}>{qualSym}</span>
              </span>

              {/* Beat dots */}
              <div style={{ display: 'flex', gap: '5px', marginTop: '2px' }}>
                {[0, 1, 2, 3].map(beat => (
                  <span
                    key={beat}
                    style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      transition: 'background .08s',
                      background: isPlay && playing && beat === beatIndex
                        ? fill
                        : isPlay && !playing && beat === 0
                          ? `${fill}55`
                          : '#211a13',
                    }}
                  />
                ))}
              </div>

              {/* Remove */}
              <span
                onClick={e => { e.stopPropagation(); removeAt(idx) }}
                role="button" aria-label="Remove" title="Remove"
                className="h-danger"
                style={{ position: 'absolute', top: '-8px', right: '-7px', width: '17px', height: '17px', borderRadius: '50%', background: '#2a221b', color: '#8a7f72', fontSize: '12px', lineHeight: '15px', textAlign: 'center', border: '1px solid #100c09', cursor: 'pointer', transition: 'background .12s, color .12s, border-color .12s' }}
              >
                &#xd7;
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}
