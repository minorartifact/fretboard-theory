import { cellX, fretNumY, L } from './layout'

const INLAY_FRETS   = [3, 5, 7, 9, 12, 15]
const DOUBLE_INLAYS = new Set([12])

interface Props {
  fretCount:    number
  neckTopY:     number
  neckBottomY:  number
}

export function FretboardInlays({ fretCount, neckTopY, neckBottomY }: Props) {
  const midY    = (neckTopY + neckBottomY) / 2
  const numY    = fretNumY()
  const inlayColor = '#b59a6a'

  return (
    <>
      {INLAY_FRETS.filter(f => f <= fretCount).map(fret => {
        const x = cellX(fret)
        return (
          <g key={fret}>
            {DOUBLE_INLAYS.has(fret) ? (
              <>
                <circle cx={x} cy={neckTopY + (neckBottomY - neckTopY) * 0.31} r={L.inlayRadius} fill={inlayColor} opacity={0.5} />
                <circle cx={x} cy={neckTopY + (neckBottomY - neckTopY) * 0.69} r={L.inlayRadius} fill={inlayColor} opacity={0.5} />
              </>
            ) : (
              <circle cx={x} cy={midY} r={L.inlayRadius} fill={inlayColor} opacity={0.5} />
            )}
            <text
              x={x}
              y={numY}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#6b6258"
              fontSize={13}
              fontFamily="'JetBrains Mono', monospace"
              fontWeight={600}
            >
              {fret}
            </text>
          </g>
        )
      })}

      {/* Open string "0" marker */}
      <text
        x={L.openColWidth / 2}
        y={numY}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#574d42"
        fontSize={11}
        fontFamily="'JetBrains Mono', monospace"
        fontWeight={600}
      >
        0
      </text>
    </>
  )
}
