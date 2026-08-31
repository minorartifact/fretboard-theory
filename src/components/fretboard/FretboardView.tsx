import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useFretboardAnnotations } from '../../hooks/useFretboardAnnotations'
import { useFretboardStore } from '../../store/fretboard'
import { useTheoryStore } from '../../store/theory'
import { useProgressionStore } from '../../store/progression'
import { useInteractiveStore, POSITIONS } from '../../store/interactive'
import { FretboardCell } from './FretboardCell'
import { FretboardInlays } from './FretboardInlays'
import { FretboardToolbar } from './FretboardToolbar'
import { FretboardReadout } from './FretboardReadout'
import { L, svgWidth, svgHeight, stringY, cellX, fretWireX, neckTop, neckBottom } from './layout'
import { playNote } from '../../audio/chordSynth'
import { intervalPitchClasses, intervalLabelFrom } from '../../theory/intervals'
import type { PitchClass } from '../../theory/types'

interface Ripple { id: number; x: number; y: number }

const MIN_NECK_WIDTH = 640

export function FretboardView() {
  const { annotations, voicings } = useFretboardAnnotations()
  const fretCount      = useFretboardStore(s => s.fretCount)
  const tuning         = useFretboardStore(s => s.tuning)
  const chordQualityId = useTheoryStore(s => s.chordQualityId)
  const root           = useTheoryStore(s => s.root)
  const scale          = useTheoryStore(s => s.scale)
  const hoveredStep    = useProgressionStore(s => s.hoveredStep)
  const activeStep     = useProgressionStore(s => s.activeStep)
  const progSteps      = useProgressionStore(s => s.steps)

  const hoverPc     = useInteractiveStore(s => s.hoverPc)
  const posIdx      = useInteractiveStore(s => s.posIdx)
  const mode        = useInteractiveStore(s => s.mode)
  const pinned      = useInteractiveStore(s => s.pinned)

  const identify     = mode === 'identify'
  const voicingMode  = mode === 'chords'
  const intervalMode = mode === 'intervals'


  const selectedIntervals = useInteractiveStore(s => s.selectedIntervals)
  const anchor            = useInteractiveStore(s => s.anchor)
  const setAnchor         = useInteractiveStore(s => s.setAnchor)

  const progStep    = hoveredStep ?? activeStep
  const chordActive = voicingMode || chordQualityId !== null || (progStep !== null && progSteps.length > 0)
  const setHoverPc = useInteractiveStore(s => s.setHoverPc)
  const togglePin  = useInteractiveStore(s => s.togglePin)

  // A degree/interval selection lights the neck in explore mode too — that's what
  // the note chips and the 1-9 keys drive. Only the dedicated intervals mode lets
  // the anchor move off the root or relabels the dots.
  const anchorPc      = intervalMode ? (anchor?.pc ?? root) : root
  const intervalsLive = selectedIntervals.length > 0 && (intervalMode || mode === 'explore')
  const litPcs = useMemo(
    () => (intervalsLive ? intervalPitchClasses(anchorPc, selectedIntervals) : null),
    [intervalsLive, anchorPc, selectedIntervals],
  )

  // Roving-tabindex focus for keyboard traversal of the neck. The ring only
  // shows while the neck actually holds focus, so it never reads as a selection.
  const [focusCell, setFocusCell] = useState<{ s: number; f: number }>({ s: 0, f: 0 })
  const [neckFocused, setNeckFocused] = useState(false)

  useEffect(() => {
    if (!neckFocused) return
    const el = document.getElementById(`fbcell-${focusCell.s}-${focusCell.f}`)
    ;(el as unknown as HTMLElement | null)?.focus()
  }, [focusCell, neckFocused])

  const [flashId, setFlashId] = useState<string | null>(null)
  const [ripples, setRipples] = useState<Ripple[]>([])
  const rippleIdRef  = useRef(0)
  const hearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHearingRef = useRef(false)

  useEffect(() => () => {
    if (hearTimerRef.current) clearTimeout(hearTimerRef.current)
  }, [])

  const pos = posIdx !== null ? POSITIONS[posIdx] : null

  function inWindow(fret: number): boolean {
    return pos === null || (fret >= pos.lo && fret <= pos.hi)
  }

  function addRipple(x: number, y: number) {
    const id = ++rippleIdRef.current
    setRipples(prev => [...prev, { id, x, y }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 520)
  }

  function handlePointerDown(si: number, fret: number, pc: PitchClass, midi: number, x: number, y: number) {
    setFocusCell({ s: si, f: fret })   // keep the roving index where the user last acted
    playNote(midi)
    addRipple(x, y)
    if (identify) togglePin({ string: si, fret, pc, midi })
    if (intervalMode) {
      // Clicking the current anchor releases it back to following the root.
      const isCurrent = anchor?.string === si && anchor?.fret === fret
      setAnchor(isCurrent ? null : { string: si, fret, pc, midi })
    }
  }

  function hearScale() {
    if (isHearingRef.current || !scale) return
    const notes: { s: number; f: number; midi: number; off: number }[] = []
    for (let s = 0; s < tuning.openNotes.length; s++) {
      for (let f = 0; f <= fretCount; f++) {
        if (!inWindow(f)) continue
        const midi = tuning.openNotes[s] + f
        const pc   = midi % 12
        const off  = (pc - root + 12) % 12
        if (!scale.pattern.includes(off)) continue
        notes.push({ s, f, midi, off })
      }
    }
    notes.sort((a, b) => a.midi - b.midi)
    let startIdx = notes.findIndex(d => d.off === 0)
    if (startIdx < 0) startIdx = 0
    const run: typeof notes = []
    let lastMidi = -1
    for (let i = startIdx; i < notes.length && run.length < scale.pattern.length + 1; i++) {
      if (notes[i].midi === lastMidi) continue
      run.push(notes[i])
      lastMidi = notes[i].midi
    }
    if (!run.length) return
    isHearingRef.current = true
    let i = 0
    const step = () => {
      if (i >= run.length) {
        isHearingRef.current = false
        setFlashId(null)
        return
      }
      const p = run[i]
      playNote(p.midi)
      setFlashId(`${p.s}-${p.f}`)
      i++
      hearTimerRef.current = setTimeout(step, 240)
    }
    step()
  }

  const stringCount = tuning.openNotes.length

  const handleKeyDown = useCallback((e: React.KeyboardEvent<SVGSVGElement>) => {
    const step = (ds: number, df: number) => {
      e.preventDefault()
      setFocusCell(c => ({
        s: Math.min(stringCount - 1, Math.max(0, c.s + ds)),
        f: Math.min(fretCount, Math.max(0, c.f + df)),
      }))
    }
    switch (e.key) {
      case 'ArrowRight': return step(0, 1)
      case 'ArrowLeft':  return step(0, -1)
      // String 0 is the low E at the bottom, so Up moves toward higher strings.
      case 'ArrowUp':    return step(1, 0)
      case 'ArrowDown':  return step(-1, 0)
      case 'Home':       e.preventDefault(); return setFocusCell(c => ({ ...c, f: 0 }))
      case 'End':        e.preventDefault(); return setFocusCell(c => ({ ...c, f: fretCount }))
      case 'Enter':
      case ' ': {
        e.preventDefault()
        const midi = tuning.openNotes[focusCell.s] + focusCell.f
        handlePointerDown(
          focusCell.s, focusCell.f, (midi % 12) as PitchClass, midi,
          cellX(focusCell.f), stringY(focusCell.s),
        )
        return
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stringCount, fretCount, tuning, focusCell])

  // Build cell → voicing-color lookup; first voicing to claim a cell wins.
  const voicingCellColor = useMemo(() => {
    const map = new Map<string, string>()
    for (const v of voicings) {
      for (const key of v.cells) {
        if (!map.has(key)) map.set(key, v.color)
      }
    }
    return map
  }, [voicings])

  const W    = svgWidth(fretCount)
  const H    = svgHeight()
  const topY = neckTop()
  const botY = neckBottom()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, padding: '10px 0 6px' }}>
        <FretboardToolbar onHearScale={hearScale} />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowX: 'auto', overflowY: 'hidden', paddingBottom: '8px' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          onKeyDown={handleKeyDown}
          onFocus={() => setNeckFocused(true)}
          onBlur={() => setNeckFocused(false)}
          style={{
            display: 'block', overflow: 'visible',
            maxWidth: '100%', maxHeight: '100%',
            // Below this the neck would be illegible, so the container scrolls instead.
            minWidth: `${MIN_NECK_WIDTH}px`,
          }}
          aria-label="Guitar fretboard"
        >
          <defs>
            <linearGradient id="fbwood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#2f2017" />
              <stop offset="48%"  stopColor="#1c120c" />
              <stop offset="100%" stopColor="#2b1c13" />
            </linearGradient>
            <linearGradient id="fbnut" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#efe3b8" />
              <stop offset="100%" stopColor="#c9b67e" />
            </linearGradient>
          </defs>

          {/* Open-string column */}
          <rect x={2} y={topY} width={L.openColWidth - 6} height={botY - topY} fill="#16110c" rx={4} />

          {/* Fretboard wood */}
          <rect x={L.openColWidth} y={topY} width={W - L.openColWidth - 8} height={botY - topY} fill="url(#fbwood)" rx={3} />
          <rect x={L.openColWidth} y={topY} width={W - L.openColWidth - 8} height={botY - topY} fill="none" stroke="rgba(0,0,0,.4)" strokeWidth={1} rx={3} />

          {/* String lines */}
          {Array.from({ length: annotations.length }, (_, si) => (
            <line
              key={si}
              x1={6} y1={stringY(si)}
              x2={W - 8} y2={stringY(si)}
              stroke={L.stringColors[si]}
              strokeWidth={L.stringWidths[si]}
              strokeLinecap="round"
            />
          ))}

          {/* Fret wires */}
          {Array.from({ length: fretCount }, (_, i) => {
            const n = i + 1
            const x = fretWireX(n)
            return (
              <line key={i} x1={x} y1={topY} x2={x} y2={botY} stroke="#998976" strokeWidth={n === 12 ? 3 : 2.4} strokeLinecap="round" />
            )
          })}

          {/* Nut */}
          <rect x={L.openColWidth} y={topY - 2} width={L.nutWidth} height={botY - topY + 4} fill="url(#fbnut)" rx={2} />

          {/* Inlays + fret numbers */}
          <FretboardInlays fretCount={fretCount} neckTopY={topY} neckBottomY={botY} />

          {/* Position window highlight overlay */}
          {posIdx !== null && (() => {
            const p  = POSITIONS[posIdx]
            const lx = p.lo <= 0 ? 2 : fretWireX(p.lo - 1)
            const rx = fretWireX(p.hi)
            return (
              <rect
                x={lx} y={topY - 3}
                width={rx - lx} height={botY - topY + 6}
                fill="rgba(224,168,90,.07)"
                stroke="rgba(224,168,90,.34)"
                strokeWidth={1.5}
                rx={6}
              />
            )
          })()}

          {/* Note dots */}
          {annotations.map((stringAnnotations, si) =>
            stringAnnotations.map(ann => {
              const fret = ann.fretboardNote.fret
              const pc   = ann.fretboardNote.pitchClass
              const midi = ann.fretboardNote.midiNote
              const x    = cellX(fret)
              const y    = stringY(si)
              const key  = `${si}-${fret}`
              const lit     = litPcs?.has(pc) ?? false
              const isTonic = pc === root
              return (
                <FretboardCell
                  key={key}
                  annotation={ann}
                  x={x} y={y}
                  chordActive={chordActive}
                  hoverPc={hoverPc}
                  inWindow={inWindow(fret)}
                  isPinned={pinned.some(p => p.string === si && p.fret === fret)}
                  isFlash={flashId === key}
                  voicingColor={voicingCellColor.get(key) ?? null}
                  voicingMode={voicingMode}
                  intervalsLive={intervalsLive}
                  intervalLit={lit}
                  isTonic={isTonic}
                  cellId={`fbcell-${si}-${fret}`}
                  isFocused={focusCell.s === si && focusCell.f === fret}
                  showFocusRing={neckFocused && focusCell.s === si && focusCell.f === fret}
                  ariaLabel={`${ann.pitchName}, string ${si + 1}, fret ${fret}${ann.highlighted ? `, degree ${ann.degreeLabel}` : ''}`}
                  intervalLabel={(lit || isTonic) && intervalMode ? intervalLabelFrom(anchorPc, pc) : null}
                  isAnchor={intervalMode && anchor?.string === si && anchor?.fret === fret}
                  onPointerDown={() => handlePointerDown(si, fret, pc, midi, x, y)}
                  onMouseEnter={() => setHoverPc(pc)}
                  onMouseLeave={() => setHoverPc(null)}
                />
              )
            })
          )}

          {/* Tap ripples */}
          {ripples.map(r => (
            <circle
              key={`rip-${r.id}`}
              cx={r.x} cy={r.y} r={L.dotRadius}
              fill="none" stroke="rgba(255,255,255,.7)" strokeWidth={2}
              style={{ animation: 'fbripple .5s ease-out forwards', transformOrigin: `${r.x}px ${r.y}px` }}
            />
          ))}
        </svg>
      </div>

      <div style={{ flexShrink: 0, borderTop: '1px solid #2a221b', background: '#13100c', minHeight: '72px', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
        <FretboardReadout />
      </div>
    </div>
  )
}
