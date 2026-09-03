import { useMemo } from 'react'
import { useTheoryStore } from '../../store/theory'
import { useInteractiveStore } from '../../store/interactive'
import { useProgressionStore, useDisplayedStep } from '../../store/progression'
import { spellInScale } from '../../theory/pitch'
import { CHORD_QUALITIES_BY_ID } from '../../theory/chords'
import { resolveProgression } from '../../theory/progression'
import { degreeFill, degreeTextColor } from './colors'
import type { Chord, PitchClass } from '../../theory/types'

const CHORD_ROLE_COLORS = ['#e0564f', '#cbb02e', '#3897d6', '#c23bb6', '#8888aa']

export function NoteChips() {
  const root           = useTheoryStore(s => s.root)
  const scale          = useTheoryStore(s => s.scale)
  const chordQualityId = useTheoryStore(s => s.chordQualityId)
  const progSteps      = useProgressionStore(s => s.steps)
  const step           = useDisplayedStep()
  const selectedIntervals = useInteractiveStore(s => s.selectedIntervals)
  const toggleInterval    = useInteractiveStore(s => s.toggleInterval)

  const activeChord: Chord | null = useMemo(() => {
    if (!scale) return null
    if (step != null && progSteps.length > 0) {
      try {
        const resolved = resolveProgression(root, scale, { steps: progSteps })
        const c = resolved[step]
        if (c) return c
      } catch { /* resolveProgression throws for non-diatonic scales */ }
    }
    if (chordQualityId) {
      const q = CHORD_QUALITIES_BY_ID[chordQualityId]
      if (q) return { root, quality: q }
    }
    return null
  }, [root, scale, chordQualityId, progSteps, step])

  if (!scale) return null

  const chordActive = activeChord !== null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#6b6258', marginRight: '4px' }}>
        Spotlight
      </span>
      {scale.pattern.map((semitones, i) => {
        const pc       = ((root + semitones) % 12) as PitchClass
        const degLabel = scale.degrees[i]
        const noteName = spellInScale(pc, root, scale)

        let chipColor = degreeFill(degLabel)
        let opacity   = 1

        if (chordActive && activeChord) {
          const offset   = (pc - activeChord.root + 12) % 12
          const chordIdx = activeChord.quality.pattern.indexOf(offset)
          if (chordIdx >= 0) {
            chipColor = CHORD_ROLE_COLORS[Math.min(chordIdx, CHORD_ROLE_COLORS.length - 1)]
          } else {
            opacity = 0.32
          }
        }

        // The tonic is never dimmed by a selection — it is the reference the other
        // degrees are read against. Rendering it as a toggle made it a control that
        // did nothing, so it is a static chip instead.
        const isTonic  = semitones === 0
        const selected = !isTonic && selectedIntervals.includes(semitones)
        const shortcut = i < 9 ? String(i + 1) : null

        const chipStyle = {
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '999px',
          background: chipColor,
          color: chordActive ? '#fff' : degreeTextColor(degLabel),
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700, fontSize: '14px',
          opacity, cursor: isTonic ? 'default' : 'pointer',
          outline: selected ? '2px solid #f1ebe2' : '2px solid transparent',
          outlineOffset: '2px',
          transition: 'opacity .15s, outline-color .12s',
        } as const

        // F3: nothing marked these as pressable. The chip's position in the row
        // is its 2-9 shortcut, and the tooltip spells that out — a separate
        // keycap just repeated the degree number on unaltered scales. The tonic
        // reads as locked rather than pretending to be a toggle.
        const face = (
          <>
            <span>{noteName}</span>
            <span style={{ fontSize: '11px', opacity: 0.72, fontWeight: 600 }}>{degLabel}</span>
            {isTonic ? (
              <span style={{
                fontSize: '11px', fontWeight: 700, letterSpacing: '.1em',
                opacity: 0.62, marginLeft: '1px',
              }}>
                TONIC
              </span>
            ) : null}
          </>
        )

        return isTonic ? (
          <span
            key={i}
            title={`${noteName} · degree ${degLabel} — the root, always shown on the neck`}
            style={chipStyle}
          >
            {face}
          </span>
        ) : (
          <button
            key={i}
            onClick={() => toggleInterval(semitones)}
            title={shortcut
              ? `${noteName} · degree ${degLabel} — click or press ${shortcut} to highlight`
              : `${noteName} · degree ${degLabel} — click to highlight`}
            style={chipStyle}
          >
            {face}
          </button>
        )
      })}
    </div>
  )
}
