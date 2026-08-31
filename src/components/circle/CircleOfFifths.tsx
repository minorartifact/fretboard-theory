import { useState, useMemo } from 'react'
import { useTheoryStore } from '../../store/theory'
import { useProgressionStore } from '../../store/progression'
import { isInScale, getScaleDegreeLabel } from '../../theory/scales'
import { resolveProgression } from '../../theory/progression'
import { SHARP_NAMES, FLAT_NAMES, ROOT_PREFERS_SHARPS } from '../../theory/constants'
import { degreeFill, degreeTextColor } from '../fretboard/colors'
import type { PitchClass } from '../../theory/types'

type CircleMode = 'fifths' | 'thirds'

// Clockwise from 12 o'clock
const FIFTHS_PCS: PitchClass[] = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]
const THIRDS_PCS: PitchClass[] = [0, 4, 8, 1, 5, 9, 2, 6, 10, 3, 7, 11]

const SIZE   = 240
const CX     = SIZE / 2
const CY     = SIZE / 2
const RING_R = 95
const NODE_R = 18

function noteName(pc: number, root: PitchClass): string {
  const raw = ROOT_PREFERS_SHARPS[root] ? SHARP_NAMES[pc] : FLAT_NAMES[pc]
  return raw.replace(/#/g, '♯').replace(/b/g, '♭')
}

export function CircleOfFifths() {
  const root    = useTheoryStore(s => s.root)
  const scale   = useTheoryStore(s => s.scale)
  const setRoot = useTheoryStore(s => s.setRoot)
  const [mode, setMode]       = useState<CircleMode>('fifths')
  const [hoveredPc, setHoveredPc] = useState<number | null>(null)

  const progSteps  = useProgressionStore(s => s.steps)
  const activeStep = useProgressionStore(s => s.activeStep)

  const pcs = mode === 'fifths' ? FIFTHS_PCS : THIRDS_PCS

  // Resolve active chord from progression
  const { chordRoot, chordPcs } = useMemo(() => {
    if (activeStep == null || progSteps.length === 0 || !scale) {
      return { chordRoot: null as PitchClass | null, chordPcs: new Set<number>() }
    }
    try {
      const resolved = resolveProgression(root, scale, { steps: progSteps })
      const chord = resolved[activeStep]
      if (!chord) return { chordRoot: null, chordPcs: new Set<number>() }
      const pcs = new Set(chord.quality.pattern.map(off => (chord.root + off) % 12))
      return { chordRoot: chord.root, chordPcs: pcs }
    } catch {
      return { chordRoot: null as PitchClass | null, chordPcs: new Set<number>() }
    }
  }, [root, scale, progSteps, activeStep])

  const chordActive = chordRoot !== null

  // Build per-node data
  const nodes = useMemo(() => {
    return pcs.map((pc, i) => {
      const angle = (Math.PI * 2 * i / 12) - Math.PI / 2
      const x     = CX + RING_R * Math.cos(angle)
      const y     = CY + RING_R * Math.sin(angle)

      const inSc = scale ? isInScale(pc, root, scale) : false
      let fill      = '#1a140f'
      let textColor = '#8a7f72'

      if (inSc && scale) {
        const degLabel = getScaleDegreeLabel(pc, root, scale) ?? '1'
        fill      = degreeFill(degLabel)
        textColor = degreeTextColor(degLabel)
      }

      const isChordRoot  = chordActive && pc === chordRoot
      const isChordTone  = chordActive && chordPcs.has(pc)
      const isScaleRoot  = pc === root

      return { pc, x, y, fill, textColor, isScaleRoot, isChordRoot, isChordTone, name: noteName(pc, root) }
    })
  }, [pcs, root, scale, chordActive, chordRoot, chordPcs])

  // Scale arc polygon — positions of in-scale nodes in circle order
  const arcPoints = nodes
    .filter(n => scale && isInScale(n.pc, root, scale))
    .map(n => `${n.x},${n.y}`)
    .join(' ')

  // Key facts
  const facts = mode === 'fifths'
    ? [
        { label: 'Dominant · V',    value: noteName((root + 7) % 12, root) },
        { label: 'Subdominant · IV', value: noteName((root + 5) % 12, root) },
        { label: 'Relative minor',   value: noteName((root + 9) % 12, root) + 'm' },
      ]
    : [
        { label: 'Major 3rd',  value: noteName((root + 4) % 12, root) },
        { label: 'Minor 3rd',  value: noteName((root + 3) % 12, root) },
        { label: 'Perfect 5th', value: noteName((root + 7) % 12, root) },
      ]

  return (
    <section>
      {/* Header + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <div style={{ display: 'flex', background: '#16120e', border: '1px solid #2a221b', borderRadius: '9px', padding: '3px', gap: '2px' }}>
          {(['fifths', 'thirds'] as CircleMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '4px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                background: mode === m ? '#2c241c' : 'transparent',
                color:      mode === m ? '#f1ebe2'  : '#6b6258',
                fontSize: '11.5px', fontWeight: 600, fontFamily: 'inherit',
                transition: 'background .12s, color .12s',
              }}
            >
              {m === 'fifths' ? '5ths' : '3rds'}
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        style={{ display: 'block', margin: '0 auto' }}
        aria-label={`Circle of ${mode}`}
      >
        {/* Faint guide ring */}
        <circle cx={CX} cy={CY} r={RING_R} fill="none" stroke="#2a221b" strokeWidth={1.5} />

        {/* Scale arc polygon */}
        {arcPoints && (
          <polygon
            points={arcPoints}
            fill="rgba(224,90,79,.06)"
            stroke="rgba(224,90,79,.22)"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        )}

        {/* Centre: root name + TONIC label */}
        <text
          x={CX} y={CY - 7}
          textAnchor="middle" dominantBaseline="central"
          fill="#e05a5a" fontSize={24}
          fontFamily="'JetBrains Mono', monospace" fontWeight={700}
        >
          {noteName(root, root)}
        </text>
        <text
          x={CX} y={CY + 14}
          textAnchor="middle" dominantBaseline="central"
          fill="#6b6258" fontSize={11}
          fontFamily="'Hanken Grotesk', sans-serif"
          fontWeight={700} letterSpacing="2px"
        >
          TONIC
        </text>

        {/* Note nodes */}
        {nodes.map(({ pc, x, y, fill, textColor, isScaleRoot, isChordRoot, isChordTone, name }) => {
          const isHovered = hoveredPc === pc
          const hasSpecialRing = isChordRoot || (!chordActive && isScaleRoot)
          return (
            <g
              key={pc}
              onClick={() => setRoot(pc as PitchClass)}
              onMouseEnter={() => setHoveredPc(pc)}
              onMouseLeave={() => setHoveredPc(null)}
              style={{ cursor: 'pointer' }}
            >
              <title>Set root: {name}</title>
              {/* White halo: scale root (no chord) or chord root */}
              {hasSpecialRing && (
                <circle cx={x} cy={y} r={NODE_R + 4.5} fill="none" stroke="rgba(255,255,255,.92)" strokeWidth={2.5} />
              )}
              {/* Golden ring: non-root chord tones */}
              {isChordTone && !isChordRoot && (
                <circle cx={x} cy={y} r={NODE_R + 4} fill="none" stroke="#f0d28a" strokeWidth={2.5} />
              )}
              {/* Hover ring: subtle glow when not already highlighted */}
              {isHovered && !hasSpecialRing && (
                <circle cx={x} cy={y} r={NODE_R + 4} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth={1.5} />
              )}
              <circle
                cx={x} cy={y} r={NODE_R}
                fill={fill}
                stroke={isHovered ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.3)'}
                strokeWidth={isHovered ? 1.5 : 1}
              />
              <text
                x={x} y={y + 0.5}
                textAnchor="middle" dominantBaseline="central"
                fill={textColor} fontSize={11}
                fontFamily="'JetBrains Mono', monospace" fontWeight={700}
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {name}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Key facts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', borderTop: '1px solid #221b14', paddingTop: '12px', marginTop: '6px' }}>
        {facts.map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: '#8a7f72' }}>{label}</span>
            <span style={{ color: '#d8cdbf', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
