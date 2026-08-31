import { useInteractiveStore, type PinnedNote } from '../../store/interactive'
import { useTheoryStore } from '../../store/theory'
import { useFretboardStore } from '../../store/fretboard'
import { getPitchName } from '../../theory/pitch'
import { detectInterval, detectChord, INTERVAL_NAMES } from '../../theory/identify'
import { intervalPitchClasses } from '../../theory/intervals'
import { Keycap } from '../ui/Keycap'
import type { PitchClass, Tuning } from '../../theory/types'

function countNeckPositions(pc: number, tuning: Tuning, fretCount: number): number {
  let n = 0
  for (const openNote of tuning.openNotes) {
    for (let f = 0; f <= fretCount; f++) {
      if ((openNote + f) % 12 === pc) n++
    }
  }
  return n
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, letterSpacing: '.16em',
  textTransform: 'uppercase', color: '#6b6258', flexShrink: 0,
}

function NoteChip({ note, root }: { note: PinnedNote; root: PitchClass }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '5px 12px', borderRadius: '999px',
      background: '#241c14', border: '1px solid #3a2e22',
      color: '#ede6dd', fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 700, fontSize: '14px',
    }}>
      {getPitchName(note.pc, 'auto', root)}
    </span>
  )
}

/** A keyboard hint: the key, then what it does. */
function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      <Keycap>{keys}</Keycap>
      <span style={{ fontSize: '12px', color: '#8a7f72' }}>{label}</span>
    </span>
  )
}

/** The keyboard hints that used to be buried in a sentence under the neck. */
const HINTS = (
  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
    <Hint keys="2–9" label="spotlight" />
    <Hint keys="0" label="clear" />
    <Hint keys="?" label="shortcuts" />
  </span>
)

export function FretboardReadout() {
  const hoverPc   = useInteractiveStore(s => s.hoverPc)
  const identify  = useInteractiveStore(s => s.mode === 'identify')
  const pinned    = useInteractiveStore(s => s.pinned)
  const clearPins = useInteractiveStore(s => s.clearPins)
  const root      = useTheoryStore(s => s.root)
  const scale     = useTheoryStore(s => s.scale)
  const tuning    = useFretboardStore(s => s.tuning)
  const fretCount = useFretboardStore(s => s.fretCount)

  const intervalMode      = useInteractiveStore(s => s.mode === 'intervals')
  const exploreMode       = useInteractiveStore(s => s.mode === 'explore')
  const clearIntervals    = useInteractiveStore(s => s.clearIntervals)
  const selectedIntervals = useInteractiveStore(s => s.selectedIntervals)
  const anchor            = useInteractiveStore(s => s.anchor)

  const row = (children: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', width: '100%', flexWrap: 'wrap' }}>
      {children}
    </div>
  )

  if (intervalMode) {
    const anchorPc   = anchor?.pc ?? root
    const anchorName = getPitchName(anchorPc, 'auto', root)
    const litCount   = [...intervalPitchClasses(anchorPc, selectedIntervals)]
      .reduce<number>((n, pc) => n + countNeckPositions(pc, tuning, fretCount), 0)

    return row(<>
      <span style={SECTION_LABEL}>Intervals</span>
      <span style={{ fontSize: '26px', fontWeight: 800, color: '#f1ebe2', fontFamily: "'JetBrains Mono', monospace" }}>
        {anchorName}
      </span>
      {selectedIntervals.length === 0 ? (
        <span style={{ fontSize: '14px', color: '#9a8f82' }}>
          Pick an interval above to light up every place it lands. Tap any fret to move the anchor off the root.
        </span>
      ) : (
        <>
          <span style={{ fontSize: '15px', color: '#cdbfaf', fontWeight: 600 }}>
            {selectedIntervals.map(s => INTERVAL_NAMES[s]).join(' · ')}
          </span>
          <span style={{ fontSize: '14px', color: '#8a7f72' }}>
            {litCount} position{litCount === 1 ? '' : 's'} lit
            {anchor ? ` · anchored at string ${anchor.string + 1}, fret ${anchor.fret}` : ' · anchor follows the root'}
          </span>
        </>
      )}
    </>)
  }

  // Explore mode with chips/number keys active — say what is lit.
  if (exploreMode && selectedIntervals.length > 0) {
    const pcs      = [...intervalPitchClasses(root, selectedIntervals)]
    const names    = pcs.map(pc => getPitchName(pc, 'auto', root)).join(' · ')
    const litCount = pcs.reduce<number>((n, pc) => n + countNeckPositions(pc, tuning, fretCount), 0)

    return row(<>
      <span style={SECTION_LABEL}>Highlighting</span>
      <span style={{ fontSize: '26px', fontWeight: 800, color: '#f1ebe2', fontFamily: "'JetBrains Mono', monospace" }}>
        {names}
      </span>
      <span style={{ fontSize: '14px', color: '#8a7f72' }}>
        {litCount} position{litCount === 1 ? '' : 's'} lit · press a number again to remove it, 0 to clear
      </span>
      <button
        onClick={clearIntervals}
        className="h-ghost"
        style={{
          marginLeft: 'auto', fontSize: '12px', color: '#8a7f72',
          background: 'transparent', border: '1px solid #2a221b',
          borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
          fontFamily: 'inherit', fontWeight: 600, flexShrink: 0,
        }}
      >
        Clear
      </button>
    </>)
  }

  if (!identify) {
    // F7: this band is the most prominent surface after the neck, and its
    // default state used to be a fixed sentence that said nothing about the
    // key. With no note under the cursor it describes the tonic instead.
    const shownPc: PitchClass = hoverPc ?? root
    const hovering  = hoverPc != null
    const count     = countNeckPositions(shownPc, tuning, fretCount)
    const noteName  = getPitchName(shownPc, 'auto', root)
    const offset    = ((shownPc - root) + 12) % 12
    const scaleIdx  = scale ? scale.pattern.indexOf(offset) : -1
    const degLabel  = scaleIdx >= 0 && scale ? scale.degrees[scaleIdx] : null
    const rootName  = getPitchName(root, 'auto', root)

    const detail = offset === 0
      ? `the tonic · every ${noteName} on the neck`
      : `${degLabel ? `degree ${degLabel} · ` : ''}${INTERVAL_NAMES[offset]} above ${rootName}`

    return row(<>
      <span style={SECTION_LABEL}>{hovering ? 'Under cursor' : 'Key'}</span>
      <span style={{ fontSize: '30px', fontWeight: 800, color: '#f1ebe2', fontFamily: "'JetBrains Mono', monospace" }}>
        {noteName}
      </span>
      <span style={{ fontSize: '14px', color: '#8a7f72' }}>
        {detail} · {count} position{count === 1 ? '' : 's'} on the neck
      </span>
      {HINTS}
    </>)
  }

  // Identify mode
  let result: React.ReactNode

  if (pinned.length === 0) {
    // Nothing on the neck changes when you enter this mode, so if the readout
    // stays a caption too, the mode switch looks like it did nothing at all.
    result = (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '20px', fontWeight: 800, color: '#f0cf95' }}>
          Tap any note to start
        </span>
        <span style={{ fontSize: '13px', color: '#8a7f72' }}>
          two notes name the interval between them · three or more name the chord
        </span>
      </div>
    )
  } else if (pinned.length === 1) {
    result = (
      <span style={{ fontSize: '15px', color: '#cdbfaf' }}>
        Add another note to measure the interval.
      </span>
    )
  } else if (pinned.length === 2) {
    const { name, semitones } = detectInterval(pinned[0].midi, pinned[1].midi)
    result = (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
        <span style={{ fontSize: '26px', fontWeight: 800, color: '#f1ebe2' }}>{name}</span>
        <span style={{ fontSize: '13px', color: '#8a7f72', fontFamily: "'JetBrains Mono', monospace" }}>
          {semitones} semitones
        </span>
      </div>
    )
  } else {
    const chord = detectChord(pinned.map(p => p.pc))
    if (chord) {
      const rootName = getPitchName(chord.root, 'auto', root)
      result = (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{ fontSize: '28px', fontWeight: 800, color: '#e0a85a', fontFamily: "'JetBrains Mono', monospace" }}>
            {rootName}{chord.symbol}
          </span>
          <span style={{ fontSize: '15px', color: '#cdbfaf', fontWeight: 600 }}>
            {rootName} {chord.word}
          </span>
        </div>
      )
    } else {
      result = (
        <span style={{ fontSize: '15px', color: '#9a8f82' }}>
          Stacked notes — no common chord. Remove a note or try another voicing.
        </span>
      )
    }
  }

  return row(<>
    <span style={SECTION_LABEL}>Identify</span>
    {pinned.length > 0 && (
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {pinned.map((p, i) => <NoteChip key={i} note={p} root={root} />)}
      </div>
    )}
    {result}
    {pinned.length > 0 && (
      <button
        onClick={clearPins}
        style={{
          marginLeft: 'auto', fontSize: '12px', color: '#8a7f72',
          background: 'transparent', border: '1px solid #2a221b',
          borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
          fontFamily: 'inherit', fontWeight: 600, flexShrink: 0,
        }}
        className="h-ghost"
      >
        Clear notes
      </button>
    )}
  </>)
}
