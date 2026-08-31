import { useMemo } from 'react'
import { useShareUrl } from './hooks/useShareUrl'
import { useProgressionAudio } from './hooks/useProgressionAudio'
import { useMetronomeAudio } from './hooks/useMetronomeAudio'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useMediaQuery, NARROW } from './hooks/useMediaQuery'
import { FretboardView } from './components/fretboard/FretboardView'
import { NoteChips } from './components/fretboard/NoteChips'
import { TheoryPanel } from './components/panels/TheoryPanel'
import { ProgressionPanel } from './components/progression/ProgressionPanel'
import { LabelModeToggle } from './components/ui/LabelModeToggle'
import { NeckMenus } from './components/ui/NeckMenus'
import { KeyStrip } from './components/theory/KeyStrip'
import { ShortcutsOverlay } from './components/ui/ShortcutsOverlay'
import { useTheoryStore } from './store/theory'
import { useProgressionStore } from './store/progression'
import { useViewStore } from './store/view'
import { useInteractiveStore } from './store/interactive'
import { getPitchName } from './theory/pitch'
import { CHORD_QUALITIES_BY_ID } from './theory/chords'
import { resolveProgression } from './theory/progression'

function MainHeader({ narrow }: { narrow: boolean }) {
  const openSidebar = useViewStore(s => s.openSidebar)
  const root           = useTheoryStore(s => s.root)
  const scale          = useTheoryStore(s => s.scale)
  const chordQualityId = useTheoryStore(s => s.chordQualityId)
  const progSteps      = useProgressionStore(s => s.steps)
  const activeStep     = useProgressionStore(s => s.activeStep)

  const rootName = getPitchName(root, 'auto', root)

  // Derive active chord name — progression takes precedence
  const chordName = useMemo(() => {
    if (activeStep != null && progSteps.length > 0 && scale) {
      try {
        const resolved = resolveProgression(root, scale, { steps: progSteps })
        const c = resolved[activeStep]
        if (c) return getPitchName(c.root, 'auto', c.root) + c.quality.symbol
      } catch { /* resolveProgression can throw for non-diatonic scales */ }
    }
    if (chordQualityId) {
      const q = CHORD_QUALITIES_BY_ID[chordQualityId]
      if (q) return rootName + q.symbol
    }
    return null
  }, [root, scale, chordQualityId, progSteps, activeStep, rootName])

  const headline = chordName ?? (scale?.name ?? 'No scale')
  const sub      = chordName
    ? (scale ? `${scale.category} · ${scale.pattern.length} notes · ${chordName} over ${rootName}` : chordName)
    : scale
      ? `${scale.category} · ${scale.pattern.length} notes · spelled from ${rootName}`
      : ''

  return (
    <header style={{ padding: '28px 40px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexShrink: 0 }}>
      <div>
        {narrow && (
          <button
            onClick={openSidebar}
            title="Open scale and chord controls"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '12px', padding: '7px 12px', borderRadius: '9px',
              border: '1px solid #2a221b', background: '#1b150f',
              color: '#b3a89a', fontSize: '12.5px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ☰  Controls
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap', lineHeight: 1.1 }}>
          <span style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-.01em', color: '#e05a5a', fontFamily: "'JetBrains Mono', monospace" }}>
            {rootName}
          </span>
          <span style={{ fontSize: '31px', fontWeight: 800, letterSpacing: '-.02em', color: '#f1ebe2' }}>
            {headline}
          </span>
        </div>
        {sub && (
          <div style={{ fontSize: '12.5px', color: '#8a7f72', marginTop: '12px', letterSpacing: '.03em' }}>
            {sub}
          </div>
        )}
        <KeyStrip />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '11px', flexShrink: 0 }}>
        <LabelModeToggle />
        <NeckMenus />
      </div>
    </header>
  )
}

function CollapsedProgressionBar() {
  const toggleProgression = useViewStore(s => s.toggleProgression)
  const stepCount         = useProgressionStore(s => s.steps.length)

  return (
    <button
      onClick={toggleProgression}
      title="Show the progression panel"
      style={{
        flexShrink: 0, width: '100%',
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '7px 40px', cursor: 'pointer',
        border: 'none', borderTop: '1px solid var(--border-subtle)',
        background: '#13100c', fontFamily: 'inherit',
      }}
      className="h-ghost"
    >
      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#6b6258' }}>
        Progression
      </span>
      <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#8a7f72', fontWeight: 600 }}>
        {stepCount ? `${stepCount} steps` : 'empty'}
      </span>
      <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#4a4540' }}>▴</span>
    </button>
  )
}

function App() {
  useShareUrl()
  useProgressionAudio()
  useMetronomeAudio()
  useKeyboardShortcuts()

  const fullscreen      = useViewStore(s => s.fullscreen)
  const showProgression = useViewStore(s => s.showProgression)
  const sidebarOpen     = useViewStore(s => s.sidebarOpen)
  const closeSidebar    = useViewStore(s => s.closeSidebar)
  const narrow          = useMediaQuery(NARROW)
  const clearFretboardSelection = useInteractiveStore(s => s.clearSelection)

  const handleWorkspacePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.target as Element
    const isInteractive = target.closest(
      'button, input, textarea, select, [role="button"], [contenteditable="true"]',
    )
    if (!isInteractive) clearFretboardSelection()
  }

  // On a narrow screen the sidebar overlays the neck instead of taking a column.
  const sidebarVisible = !fullscreen && (!narrow || sidebarOpen)

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: 'var(--bg-app)', color: 'var(--text-primary)',
      fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
    }}>
      {sidebarVisible && (
        narrow
          ? (
            <>
              <div
                onClick={closeSidebar}
                style={{ position: 'fixed', inset: 0, background: 'rgba(8,6,5,.6)', zIndex: 30 }}
              />
              <div style={{ position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 31, display: 'flex' }}>
                <TheoryPanel />
              </div>
            </>
          )
          : <TheoryPanel />
      )}

      <main
        onPointerDown={handleWorkspacePointerDown}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}
      >
        {!fullscreen && (
          <>
            <MainHeader narrow={narrow} />

            <div style={{ padding: '22px 40px 16px', flexShrink: 0 }}>
              <NoteChips />
            </div>
          </>
        )}

        <div style={{ flex: 1, minHeight: 0, padding: fullscreen ? '12px 28px 16px' : narrow ? '0 16px' : '0 40px', overflow: 'hidden' }}>
          <FretboardView />
        </div>

        {/* Shown in both layouts — fullscreen renders them as large play-along
            cards. Collapsing gives a bare neck without needing a separate mode. */}
        {showProgression ? <ProgressionPanel /> : <CollapsedProgressionBar />}
      </main>

      <ShortcutsOverlay />
    </div>
  )
}

export default App
