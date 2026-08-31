import { useState, useMemo, useCallback } from 'react'
import { useTheoryStore } from '../../store/theory'
import { useProgressionStore, COMMON_PROGRESSIONS } from '../../store/progression'
import { useViewStore } from '../../store/view'
import { getDiatonicChords, getSecondaryDominant } from '../../theory/chords'
import { resolveProgression } from '../../theory/progression'
import { getPitchName } from '../../theory/pitch'
import { degreeFillFor } from '../fretboard/colors'
import { ProgressionCards } from './ProgressionCards'
import { NewSlotCard } from './NewSlotCard'
import { SaveSongForm } from './SaveSongForm'
import { useSaveSong } from './useSaveSong'
import { ROMAN, romanNumeral } from './romanNumeral'
import { playChord } from '../../audio/chordSynth'

const BTN: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '36px', height: '32px', fontSize: '12px',
  color: '#9a8f82', background: '#1b150f',
  border: '1px solid #2a221b', borderRadius: '8px',
  cursor: 'pointer', fontFamily: 'inherit',
  transition: 'background .12s, color .12s',
}

export function ProgressionPanel() {
  const root       = useTheoryStore(s => s.root)
  const scale      = useTheoryStore(s => s.scale)
  const steps      = useProgressionStore(s => s.steps)
  const activeStep = useProgressionStore(s => s.activeStep)
  const playing    = useProgressionStore(s => s.playing)
  const bpm        = useProgressionStore(s => s.bpm)
  const loop       = useProgressionStore(s => s.loop)
  const metronome  = useProgressionStore(s => s.metronome)
  const fullscreen = useViewStore(s => s.fullscreen)
  const toggleProgression = useViewStore(s => s.toggleProgression)
  const append         = useProgressionStore(s => s.append)
  const appendStep     = useProgressionStore(s => s.appendStep)
  const replaceAt      = useProgressionStore(s => s.replaceAt)
  const replaceAtStep  = useProgressionStore(s => s.replaceAtStep)
  const removeAt       = useProgressionStore(s => s.removeAt)
  const focusStep  = useProgressionStore(s => s.focusStep)
  const hoverStep  = useProgressionStore(s => s.hoverStep)
  const stepBy     = useProgressionStore(s => s.stepBy)
  const clear      = useProgressionStore(s => s.clear)
  const undoClear  = useProgressionStore(s => s.undoClear)
  const lastCleared = useProgressionStore(s => s.lastCleared)
  const toggle     = useProgressionStore(s => s.toggle)
  const restart    = useProgressionStore(s => s.restart)
  const setBpm     = useProgressionStore(s => s.setBpm)
  const toggleLoop = useProgressionStore(s => s.toggleLoop)
  const toggleMetronome = useProgressionStore(s => s.toggleMetronome)
  const loadPreset = useProgressionStore(s => s.loadPreset)

  const [editCursor, setEditCursor] = useState<number | 'new'>('new')
  const save = useSaveSong()

  const ec: number | 'new' =
    editCursor === 'new' || editCursor < steps.length
      ? editCursor
      : steps.length > 0 ? steps.length - 1 : 'new'

  const diatonic = useMemo(() => scale ? getDiatonicChords(root, scale) : [], [root, scale])

  const resolved = useMemo(() => {
    if (!scale || steps.length === 0) return []
    try { return resolveProgression(root, scale, { steps }) }
    catch { /* resolveProgression throws for non-diatonic scales */ return [] }
  }, [root, scale, steps])

  const scaleLen  = scale?.pattern.length ?? 0
  const progEmpty = steps.length === 0
  const progPos   = steps.length ? `${(activeStep ?? 0) + 1} / ${steps.length}` : '–'

  const handleDiatonicTap = (deg: number) => {
    if (ec === 'new') {
      const newIdx = steps.length
      append(deg)
      focusStep(newIdx)
    } else {
      replaceAt(ec, deg)
      focusStep(ec)
      const next = ec + 1
      if (next < steps.length) {
        setEditCursor(next)
        focusStep(next)
      } else {
        setEditCursor('new')
      }
    }
  }

  const handleSecDomTap = (targetDeg: number, targetDegIdx: number) => {
    const targetChord = diatonic[targetDegIdx]
    if (!targetChord) return
    const secDom = getSecondaryDominant(targetChord.root)
    const step = { degree: targetDeg, chordOverride: secDom, secondaryDominantOf: targetDeg }
    if (ec === 'new') {
      const newIdx = steps.length
      appendStep(step)
      focusStep(newIdx)
    } else {
      replaceAtStep(ec, step)
      focusStep(ec)
      const next = ec + 1
      if (next < steps.length) {
        setEditCursor(next)
        focusStep(next)
      } else {
        setEditCursor('new')
      }
    }
  }

  const handleStepClick = useCallback((idx: number) => {
    const alreadySelected = ec === idx && activeStep === idx
    if (alreadySelected) {
      // Clicking the active card previews it and then releases the playhead.
      // Without a way to deselect, an active step held the fretboard in
      // chord-dimmed mode and only Clear — which discards the progression —
      // could get back to the plain scale view.
      const chord = useProgressionStore.getState().activeChord()
      if (chord) playChord(chord.root, chord.quality.pattern)
      focusStep(null)
      setEditCursor('new')
      return
    }
    setEditCursor(idx)
    focusStep(idx)
  }, [ec, activeStep, focusStep])

  return (
    <div style={{
      flexShrink: 0, borderTop: '1px solid var(--border-subtle)',
      background: '#13100c',
      ...(fullscreen
        ? { padding: '14px 40px 20px', display: 'flex', flexDirection: 'column', gap: 0 }
        : { padding: '16px 40px 18px', display: 'flex', gap: '36px', flexWrap: 'wrap', alignItems: 'flex-start' }
      ),
    }}>

      {fullscreen ? (
        <ProgressionCards handleStepClick={handleStepClick} />
      ) : (
      <>
      {/* ── Left: diatonic chord palette ─────────────────────────────── */}
      <div style={{ flex: '1 1 430px', minWidth: 0 }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#6b6258', marginBottom: '12px' }}>
          Diatonic chords
          {ec !== 'new' ? (
            <span style={{ color: '#e0a85a', fontWeight: 600, letterSpacing: '.02em', textTransform: 'none', marginLeft: '8px' }}>
              · tap to replace step {ec + 1}
            </span>
          ) : (
            <span style={{ color: '#534a40', fontWeight: 600, letterSpacing: '.02em', textTransform: 'none', marginLeft: '8px' }}>
              · tap to add to progression
            </span>
          )}
        </div>

        {diatonic.length > 0 ? (
          <>
            <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
              {diatonic.map((chord, i) => {
                const deg      = i + 1
                const fill     = degreeFillFor(deg)
                const rootName = getPitchName(chord.root, 'auto', root)
                const numeral  = romanNumeral(i, chord.quality)
                const isActive = activeStep != null && steps[activeStep]?.degree === deg && steps[activeStep]?.secondaryDominantOf == null

                return (
                  <button
                    key={i}
                    onClick={() => handleDiatonicTap(deg)}
                    title={`${rootName} ${chord.quality.name}`}
                    className={!isActive ? 'h-chord' : ''}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                      padding: '9px 14px', borderRadius: '10px',
                      border: `1px solid ${isActive ? '#5a4632' : '#2a221b'}`,
                      background: isActive ? '#2a2017' : '#1b150f',
                      cursor: 'pointer', minWidth: '58px',
                      transition: 'background .12s, border-color .12s',
                    }}
                  >
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '17px', fontWeight: 700, color: fill, lineHeight: 1 }}>
                      {numeral}
                    </span>
                    <span style={{ fontSize: '12.5px', color: isActive ? '#ede6dd' : '#8a7f72', fontWeight: 600 }}>
                      {rootName}{chord.quality.symbol}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Secondary dominants row */}
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#a89d90', marginBottom: '7px' }}>
                Secondary dominants
              </div>
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                {/* V/ii through V/vi = target degrees 2–6 */}
                {[1, 2, 3, 4, 5].map(targetDegIdx => {
                  const targetDeg   = targetDegIdx + 1   // 2–6
                  const targetChord = diatonic[targetDegIdx]
                  if (!targetChord) return null
                  const secDom    = getSecondaryDominant(targetChord.root)
                  const secName   = getPitchName(secDom.root, 'auto', root)
                  const fill      = degreeFillFor(targetDeg)
                  const targetRn  = ROMAN[targetDegIdx] ?? `${targetDeg}`
                  const isActive  = activeStep != null && steps[activeStep]?.secondaryDominantOf === targetDeg

                  return (
                    <button
                      key={targetDeg}
                      onClick={() => handleSecDomTap(targetDeg, targetDegIdx)}
                      title={`${secName}7 → resolves to ${getPitchName(targetChord.root, 'auto', root)} (V/${targetRn})`}
                      className={!isActive ? 'h-chord' : ''}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                        padding: '7px 12px', borderRadius: '10px',
                        border: `1px solid ${isActive ? '#5a4632' : '#221c15'}`,
                        background: isActive ? '#2a2017' : '#161009',
                        cursor: 'pointer', minWidth: '52px',
                        transition: 'background .12s, border-color .12s',
                      }}
                    >
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, color: fill, lineHeight: 1, opacity: 0.85 }}>
                        V/{targetRn}
                      </span>
                      <span style={{ fontSize: '11.5px', color: isActive ? '#ede6dd' : '#6b6258', fontWeight: 600 }}>
                        {secName}7
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <div style={{ fontSize: '12px', color: '#a89d90' }}>
            {scale ? 'Diatonic chords require a 7-tone scale.' : 'Select a scale to see diatonic chords.'}
          </div>
        )}
      </div>

      {/* ── Right: progression track + transport ─────────────────────── */}
      <div style={{ flex: '1 1 360px', minWidth: 0 }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#6b6258' }}>
              Progression
            </span>
            <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#8a7f72', fontWeight: 600 }}>
              {progPos}
            </span>
            <button
              onClick={toggleProgression}
              title="Hide the progression panel"
              className="h-ghost"
              style={{ fontSize: '12px', lineHeight: 1, color: '#4a4540', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '2px 4px' }}
            >
              ▾
            </button>
          </div>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={restart} style={BTN} className="h-icon" title="Restart">&#x23EE;</button>
            <button onClick={() => stepBy(-1)} style={BTN} className="h-icon" title="Previous step">&#x25C0;</button>
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
            <button onClick={() => stepBy(1)} style={BTN} className="h-icon" title="Next step">&#x25B6;</button>
            <button
              onClick={toggleLoop}
              title={loop ? 'Loop: on' : 'Loop: off'}
              className="h-icon"
              style={{
                ...BTN,
                color: loop ? '#e0a85a' : '#6b6258',
                background: loop ? 'rgba(224,168,90,.12)' : '#1b150f',
                border: `1px solid ${loop ? 'rgba(224,168,90,.4)' : '#2a221b'}`,
                fontSize: '12.5px', fontWeight: 700,
                width: 'auto', padding: '0 11px', gap: '5px',
              }}
            >
              &#x21BB; Loop
            </button>
            <button
              onClick={toggleMetronome}
              title={metronome ? 'Metronome: on' : 'Metronome: off'}
              aria-pressed={metronome}
              className="h-icon"
              style={{
                ...BTN,
                color: metronome ? '#e0a85a' : '#6b6258',
                background: metronome ? 'rgba(224,168,90,.12)' : '#1b150f',
                border: `1px solid ${metronome ? 'rgba(224,168,90,.4)' : '#2a221b'}`,
                fontSize: '12.5px', fontWeight: 700,
                width: 'auto', padding: '0 11px', gap: '5px',
              }}
            >
              &#x2669; Click
            </button>
            {/* BPM control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px', background: '#1b150f', border: '1px solid #2a221b', borderRadius: '8px', padding: '0 3px' }}>
              <button onClick={() => setBpm(bpm - 5)} title="Decrease BPM" className="h-ghost" style={{ width: '22px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#8a7f72', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color .12s' }}>&#x2212;</button>
              <span style={{ fontSize: '12.5px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#c7bcae', minWidth: '58px', textAlign: 'center' }}>{bpm} BPM</span>
              <button onClick={() => setBpm(bpm + 5)} title="Increase BPM" className="h-ghost" style={{ width: '22px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#8a7f72', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color .12s' }}>+</button>
            </div>
            {progEmpty && lastCleared ? (
              <button onClick={undoClear} title={`Restore the ${lastCleared.length} chords you just cleared`} className="h-ghost" style={{ fontSize: '11.5px', color: '#e0a85a', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', marginLeft: '4px', transition: 'color .12s' }}>
                Undo clear
              </button>
            ) : (
              <button onClick={clear} disabled={progEmpty} title="Clear progression" className={progEmpty ? '' : 'h-ghost'} style={{ fontSize: '11.5px', color: progEmpty ? '#a89d90' : '#8a7f72', background: 'transparent', border: 'none', cursor: progEmpty ? 'default' : 'pointer', fontWeight: 600, fontFamily: 'inherit', marginLeft: '4px', transition: 'color .12s' }}>
                Clear
              </button>
            )}
            {!progEmpty && (
              <button
                onClick={save.open}
                title="Save progression as a song"
                className="h-ghost"
                style={{ fontSize: '11.5px', color: save.saving ? '#e0a85a' : '#8a7f72', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', marginLeft: '2px', transition: 'color .12s' }}
              >
                Save…
              </button>
            )}
          </div>
        </div>

        <SaveSongForm control={save} marginBottom="10px" />

        {/* Track area */}
        <div style={{
          display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center',
          minHeight: '80px', padding: '12px 11px',
          background: '#100c09', border: '1px solid #221b14', borderRadius: '11px',
        }}>
          {progEmpty && ec === 'new' ? (
            /* F9: the empty state used to be a wordless dashed "+", with the
               presets that would actually get a player started stranded in a
               row below the panel. They live here now, where the track is. */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', width: '100%' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#c7bcae' }}>
                No chords yet
              </div>
              <div style={{ fontSize: '12px', color: '#8a7f72', lineHeight: 1.5 }}>
                Tap a numeral on the left, or start from a familiar progression:
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                {COMMON_PROGRESSIONS.map(preset => {
                  const ok = preset.steps.every(st => st.degree <= scaleLen)
                  return (
                    <button
                      key={preset.name}
                      onClick={() => { if (ok) { loadPreset(preset); setEditCursor('new') } }}
                      title={ok ? `Load: ${preset.name}` : 'Requires a 7-tone scale'}
                      className={ok ? 'h-chip' : ''}
                      disabled={!ok}
                      style={{
                        fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                        color: ok ? '#c7bcae' : '#6b6258',
                        background: '#1b150f', border: '1px solid #2a221b', borderRadius: '7px',
                        height: '32px', padding: '0 12px',
                        cursor: ok ? 'pointer' : 'not-allowed',
                        transition: 'background .12s, border-color .12s, color .12s',
                      }}
                    >
                      {preset.name}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <>
              {steps.map((step, idx) => {
                const chord    = resolved[idx]
                const isPlay   = activeStep === idx
                const isEdit   = ec === idx
                const deg      = step.degree
                const secDomOf = step.secondaryDominantOf
                const fill     = degreeFillFor(secDomOf ?? deg)
                const targetRn = secDomOf != null ? (ROMAN[secDomOf - 1] ?? `${secDomOf}`) : null
                const numeral  = targetRn != null
                  ? `V/${targetRn}`
                  : (chord ? romanNumeral(deg - 1, chord.quality) : ROMAN[deg - 1] ?? `${deg}`)
                const noteName = chord ? getPitchName(chord.root, 'auto', root) : ''
                const qualSym  = chord?.quality.symbol ?? ''
                const tipLabel = chord ? `${noteName}${chord.quality.name}` : ''

                return (
                  <div
                    key={idx}
                    onClick={() => handleStepClick(idx)}
                    onMouseEnter={() => { if (chord) hoverStep(idx) }}
                    onMouseLeave={() => hoverStep(null)}
                    title={tipLabel}
                    className={!isPlay && !isEdit ? 'h-card' : ''}
                    style={{
                      position: 'relative',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                      padding: '13px 16px 10px', borderRadius: '10px',
                      cursor: 'pointer', minWidth: '62px',
                      transition: 'border-color .12s, background .12s, box-shadow .12s',
                      border: isEdit
                        ? '1px solid #8a7f72'
                        : isPlay
                          ? '1px solid #8a6e46'
                          : '1px solid #2a221b',
                      background: isPlay ? '#2b1e10' : '#16120e',
                      boxShadow: isEdit ? '0 0 0 2px rgba(200,190,178,.12)' : 'none',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 0, left: '12px', right: '12px',
                      height: '3px', borderRadius: '0 0 2px 2px',
                      background: isPlay ? '#e0a85a' : 'transparent',
                    }} />
                    <span style={{
                      position: 'absolute', bottom: 0, left: '12px', right: '12px',
                      height: '2px', borderRadius: '2px 2px 0 0',
                      background: isEdit ? 'rgba(200,190,178,.5)' : 'transparent',
                    }} />
                    <span style={{
                      position: 'absolute', top: '5px', left: '8px',
                      fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                      color: isPlay ? '#e0a85a' : '#3f352a',
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: secDomOf != null ? '13px' : '19px', fontWeight: 700, color: fill, lineHeight: 1, marginTop: '4px' }}>
                      {numeral}
                    </span>
                    <span style={{ fontSize: '13px', color: isPlay ? '#f1ebe2' : isEdit ? '#c7bcae' : '#9a8f82', fontWeight: 700, lineHeight: 1.2, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                      {noteName}<span style={{ fontSize: '11px', fontWeight: 500, color: isPlay ? '#b3a89a' : '#6b6258' }}>{qualSym}</span>
                    </span>
                    <span
                      onClick={e => { e.stopPropagation(); removeAt(idx) }}
                      role="button"
                      aria-label="Remove"
                      title="Remove"
                      className="h-danger"
                      style={{
                        position: 'absolute', top: '-8px', right: '-7px',
                        width: '17px', height: '17px', borderRadius: '50%',
                        background: '#2a221b', color: '#8a7f72', fontSize: '12px',
                        lineHeight: '15px', textAlign: 'center',
                        border: '1px solid #100c09', cursor: 'pointer',
                        transition: 'background .12s, color .12s, border-color .12s',
                      }}
                    >
                      &#xd7;
                    </span>
                  </div>
                )
              })}

              <NewSlotCard
                isFocused={ec === 'new'}
                onClick={() => setEditCursor('new')}
              />
            </>
          )}
        </div>

      </div>
      </>
      )}
    </div>
  )
}

// ── Jam View ────────────────────────────────────────────────────────────────
