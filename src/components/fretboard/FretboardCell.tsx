import type { NoteAnnotation, PitchClass } from '../../theory/types'
import { useTheoryStore } from '../../store/theory'
import { L } from './layout'
import { isChordTone, degreeFill, degreeTextColor } from './colors'
import { SEMITONE_TO_DEGREE } from '../../theory/constants'

const ANCHOR_STROKE = '#a98ae0'

interface Props {
  annotation:    NoteAnnotation
  x:             number
  y:             number
  chordActive:   boolean
  hoverPc:       PitchClass | null
  inWindow:      boolean
  identify:      boolean
  isPinned:      boolean
  isFlash:       boolean
  voicingColor:  string | null
  voicingMode:   boolean
  intervalsLive: boolean          // interval mode on AND at least one interval picked
  intervalLit:   boolean          // this note sits at one of the picked intervals
  intervalLabel: string | null    // interval name measured from the anchor
  isTonic:       boolean          // the key's root — always kept visible for orientation
  isAnchor:      boolean
  cellId:        string
  ariaLabel:     string
  isFocused:     boolean           // roving tabindex: only one cell is tabbable
  showFocusRing: boolean           // ...and the neck currently holds focus
  onPointerDown: () => void
  onMouseEnter:  () => void
  onMouseLeave:  () => void
}

export function FretboardCell({
  annotation, x, y, chordActive,
  hoverPc, inWindow, identify, isPinned, isFlash, voicingColor, voicingMode,
  intervalsLive, intervalLit, intervalLabel, isTonic, isAnchor,
  cellId, ariaLabel, isFocused, showFocusRing,
  onPointerDown, onMouseEnter, onMouseLeave,
}: Props) {
  const root  = useTheoryStore(s => s.root)
  const scale = useTheoryStore(s => s.scale)
  const pc    = annotation.fretboardNote.pitchClass
  const isGlow = hoverPc !== null && pc === hoverPc

  // A picked interval — or the anchor itself — must read as a full dot even when
  // it lands outside the active scale, where it would otherwise be a faint speck.
  const showFullDot = annotation.highlighted || intervalLit || isAnchor || isTonic

  return (
    <g>
      {showFullDot ? (() => {
        const scaleOffset = (pc - root + 12) % 12
        const scaleIdx    = scale ? scale.pattern.indexOf(scaleOffset) : -1
        const degLabel    = scale && scaleIdx >= 0 ? scale.degrees[scaleIdx] : (SEMITONE_TO_DEGREE[scaleOffset] ?? '1')
        const fill     = degreeFill(degLabel)
        const txtColor = degreeTextColor(degLabel)
        const showRing = annotation.semitones === 0
        const dimmed   = chordActive && !isChordTone(annotation.role)

        // An interval selection owns the dimming outright: a lit note stays fully
        // visible even when an active chord would otherwise dim it away. The tonic
        // is never dimmed by a selection — it is the reference the intervals are
        // heard against.
        let opacity: number
        if (isPinned || isAnchor)  opacity = 1
        else if (!inWindow)        opacity = 0.14
        else if (intervalsLive)    opacity = (intervalLit || isTonic) ? 1 : 0.1
        else if (dimmed)           opacity = voicingMode ? 0.07 : 0.16
        else                       opacity = 1

        return (
          <g opacity={opacity}>
            {showRing && (
              <circle cx={x} cy={y} r={L.dotRadius + 3.5} fill="none" stroke="rgba(255,255,255,.92)" strokeWidth={2.5} />
            )}
            <circle cx={x} cy={y} r={L.dotRadius} fill={fill} stroke="rgba(0,0,0,.3)" strokeWidth={1} />
            <text
              x={x} y={y + 0.5}
              textAnchor="middle" dominantBaseline="central"
              fill={txtColor} fontSize={13}
              fontFamily="'JetBrains Mono', monospace" fontWeight={700}
              style={{ userSelect: 'none', pointerEvents: 'none' }}
            >
              {intervalLabel ?? annotation.label}
            </text>
          </g>
        )
      })() : (() => {
        // Non-scale note: small faint dot — more visible in identify mode
        let opacity: number
        if (isPinned)         opacity = 1
        else if (!inWindow)   opacity = 0.07
        else if (intervalsLive) opacity = 0.05
        else if (voicingMode) opacity = 0.05
        else                  opacity = identify ? 0.3 : 0.2

        return (
          <g opacity={opacity}>
            <circle
              cx={x} cy={y}
              r={isPinned ? L.dotRadius : 6}
              fill={isPinned ? '#5a5168' : '#c7bcae'}
              stroke={isPinned ? 'rgba(255,255,255,.5)' : 'none'}
              strokeWidth={1}
            />
            {isPinned && (
              <text
                x={x} y={y + 0.5}
                textAnchor="middle" dominantBaseline="central"
                fill="#fff" fontSize={12}
                fontFamily="'JetBrains Mono', monospace" fontWeight={700}
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {annotation.pitchName}
              </text>
            )}
          </g>
        )
      })()}

      {isPinned && (
        <circle cx={x} cy={y} r={L.dotRadius + 5} fill="none" stroke="#f0d28a" strokeWidth={2.5} />
      )}
      {isAnchor && (
        <>
          <circle cx={x} cy={y} r={L.dotRadius + 5} fill="none" stroke={ANCHOR_STROKE} strokeWidth={2.5} />
          <circle cx={x} cy={y} r={L.dotRadius + 8.5} fill="none" stroke={ANCHOR_STROKE} strokeWidth={1} opacity={0.5} />
        </>
      )}
      {isGlow && (
        <circle
          cx={x} cy={y} r={L.dotRadius + 6}
          fill="none" stroke="rgba(255,255,255,.85)" strokeWidth={2}
          style={{ animation: 'fbglow 1.1s ease-in-out infinite' }}
        />
      )}
      {isFlash && (
        <circle cx={x} cy={y} r={L.dotRadius + 7} fill="none" stroke="#e0a85a" strokeWidth={3} />
      )}
      {voicingColor && (
        <circle
          cx={x} cy={y} r={L.dotRadius + 5}
          fill="none"
          stroke={voicingColor}
          strokeWidth={2.5}
          opacity={0.9}
        />
      )}

      {/* Transparent hit target — always on top, pointer-sized, and the
          focusable element for keyboard traversal of the neck. */}
      <circle
        id={cellId}
        data-fretcell=""
        role="button"
        tabIndex={isFocused ? 0 : -1}
        aria-label={ariaLabel}
        cx={x} cy={y} r={19}
        fill="transparent"
        style={{ cursor: 'pointer', outline: 'none' }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onPointerDown={onPointerDown}
      />
      {showFocusRing && (
        <circle
          cx={x} cy={y} r={L.dotRadius + 6.5}
          fill="none" stroke="#7fb2e5" strokeWidth={2.5}
          style={{ pointerEvents: 'none' }}
        />
      )}
    </g>
  )
}
