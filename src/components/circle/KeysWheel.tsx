import { ringLabel, RINGS, type Cursor, type KeyWedge, type Ring } from '../../theory/keys'
import {
  BAND, CX, CY, R_HOLE, R_TAB, SIZE,
  labelAngle, polar, segmentPath, tabAngle, wedgeAngles,
} from './wheelGeometry'

/**
 * The three-ring key wheel: every major key, its relative minor and its
 * leading-tone diminished, each wedge sharing one key signature.
 *
 * Presentation only. It takes a cursor and reports what was pointed at; the
 * overlay owns which key is current and what a click does.
 */

// Warm golds for the majors, cool parchment for the minors, muted for the
// diminished — the same hierarchy the printed card uses to say which ring you
// are meant to read first.
const RING_STYLE: Record<Ring, { fill: string; text: string; weight: number }> = {
  major: { fill: '#241c14', text: '#e0a85a', weight: 800 },
  minor: { fill: '#1e1811', text: '#d8cdbd', weight: 700 },
  dim:   { fill: '#191410', text: '#9a8f80', weight: 600 },
}

const CURRENT = { fill: 'rgba(224,168,90,.30)', stroke: '#e0a85a', text: '#fff4e2' }
const HOVER   = { fill: 'rgba(224,168,90,.14)', stroke: 'rgba(224,168,90,.55)' }

interface Props {
  wedges:   KeyWedge[]
  /** The key the app is actually in, if the wheel can name it. */
  current:  Cursor | null
  cursor:   Cursor
  onCursor: (c: Cursor) => void
  onPick:   (c: Cursor) => void
}

export function KeysWheel({ wedges, current, cursor, onCursor, onPick }: Props) {
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%"
      height="100%"
      style={{ display: 'block', maxHeight: '100%', userSelect: 'none' }}
      role="listbox"
      aria-label="Circle of fifths — pick a key"
    >
      {wedges.map(w => {
        const { centre } = wedgeAngles(w.index)
        const sig = w.signature
        const tab = polar(R_TAB, centre)
        return (
          <text
            key={`tab-${w.index}`}
            x={tab.x} y={tab.y}
            transform={`rotate(${tabAngle(centre)} ${tab.x} ${tab.y})`}
            textAnchor="middle" dominantBaseline="central"
            fill="#6b6258" fontSize={11} fontWeight={700}
            fontFamily="'JetBrains Mono', monospace"
            opacity={0.9}
          >
            {sig.accidental === null
              ? '♮'
              : `${sig.notes.length}${sig.accidental === '#' ? '♯' : '♭'}`}
          </text>
        )
      })}

      {RINGS.map(ring =>
        wedges.map(w => {
          const isCurrent = current?.index === w.index && current.ring === ring
          const isCursor  = cursor.index === w.index && cursor.ring === ring
          const style     = RING_STYLE[ring]
          const band      = BAND[ring]
          const { centre } = wedgeAngles(w.index)
          const p = polar((band.outer + band.inner) / 2, centre)

          const fill   = isCursor ? HOVER.fill : isCurrent ? CURRENT.fill : style.fill
          const stroke = isCursor ? HOVER.stroke : isCurrent ? CURRENT.stroke : '#2a221b'

          return (
            <g
              key={`${ring}-${w.index}`}
              role="option"
              aria-selected={isCurrent}
              aria-label={ringLabel(w, ring)}
              onMouseEnter={() => onCursor({ index: w.index, ring })}
              onClick={() => onPick({ index: w.index, ring })}
              style={{ cursor: 'pointer' }}
            >
              <path
                d={segmentPath(w.index, band.outer, band.inner)}
                fill={fill}
                stroke={stroke}
                strokeWidth={isCursor || isCurrent ? 2 : 1}
              />
              <text
                x={p.x} y={p.y}
                transform={`rotate(${labelAngle(centre)} ${p.x} ${p.y})`}
                textAnchor="middle" dominantBaseline="central"
                fill={isCursor || isCurrent ? CURRENT.text : style.text}
                fontSize={band.font}
                fontWeight={style.weight}
                fontFamily={ring === 'major' ? 'inherit' : "'JetBrains Mono', monospace"}
                style={{ pointerEvents: 'none' }}
              >
                {ringLabel(w, ring)}
              </text>
            </g>
          )
        }),
      )}

      <circle cx={CX} cy={CY} r={R_HOLE - 4} fill="#16120e" stroke="#2a221b" strokeWidth={1} />
    </svg>
  )
}
