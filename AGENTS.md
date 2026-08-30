# AGENTS.md — Fretboard Theory

Agent-facing guide for this codebase. Read this before making any changes.

## What this is

A pure-frontend guitar music theory app. Users pick a root note and scale to highlight matching positions on an SVG fretboard. Beyond the basic visualizer, the app has a **progression builder**: users assemble chord sequences by scale degree and play them back with BPM control (Web Audio, Space bar). A **circle of fifths/thirds** SVG shows the current scale and active chord in context, and is also how the root is chosen — clicking a node calls `setRoot`. There is no separate root selector.

No backend, no auth, no external APIs — everything runs client-side.

## Commands

```bash
npm run dev        # dev server at localhost:5173
npm run test:run   # run all 141 unit tests once (fast, use this before committing)
npm test           # watch mode
npm run build      # tsc type-check + vite bundle (must pass before shipping)
npm run lint       # eslint
```

Always run `npm run test:run` and `npm run build` after any change to `src/theory/` or `src/store/`. Both must succeed with zero errors before you're done. `npm run lint` should report zero problems.


## Architecture

```
src/
  theory/          # Pure TypeScript — zero React. The domain model.
  store/           # Zustand slices (theory, fretboard, view, progression)
  hooks/           # React hooks that bridge store → theory engine
  audio/           # Web Audio chord synthesizer
  components/
    fretboard/     # SVG rendering (FretboardView, FretboardCell, NoteChips, …)
    circle/        # CircleOfFifths SVG (fifths and thirds modes)
    theory/        # Selector UI (ScaleSelector, ChordQualitySelector, SavedSongsPanel)
    progression/   # Progression builder, JamView, save-song form
    panels/        # TheoryPanel (sidebar wrapper)
    ui/            # Generic controls (LabelModeToggle)
  utils/           # URL encode/decode
```

### The theory engine (`src/theory/`)

The only place music math happens. All functions are pure — no side effects, no React.

- **`types.ts`** — canonical type definitions. `PitchClass = 0–11` is the core primitive.
- **`pitch.ts`** — `transpose`, `intervalBetween`, `getPitchName`, `parsePitchName`
- **`scales.ts`** — 28 scale definitions; `getScaleNotes`, `isInScale`, `getScaleDegreeLabel`
- **`chords.ts`** — 17 chord qualities; `getChordNotes`, `getChordToneRole`, `getDiatonicChords`
- **`fretboard.ts`** — `buildFretboardGrid(tuning, fretCount)` → `FretboardNote[][]`
- **`annotation.ts`** — `annotateGrid(grid, ctx)` → `NoteAnnotation[][]`. This is the composition point: every note on the neck gets a `role` and a display `label` based on the current root/scale/chord context.
- **`progression.ts`** — `ProgressionStep`, `Progression`, `resolveProgression`, `COMMON_PROGRESSIONS`.
- **`identify.ts`** — `detectInterval(midiA, midiB)` → interval name; `detectChord(pcs[])` → chord root/symbol/word. Used by the identify-mode readout.
- **`constants.ts`** — `SHARP_NAMES`, `FLAT_NAMES`, `ROOT_PREFERS_SHARPS`, `SEMITONE_TO_DEGREE`

When you add a scale or chord quality, add it here and add a test. Never import React in this folder.

### Stores (`src/store/`)

Four independent Zustand slices:

| Store | Key state |
|---|---|
| `theory.ts` | `root: PitchClass`, `scale: ScaleDef \| null`, `chordQualityId: string \| null` |
| `fretboard.ts` | `tuning: Tuning`, `fretCount: number` (default 15), `startFret: number` |
| `view.ts` | `labelMode`, `fullscreen`, `showProgression`, `sidebarOpen`, `shortcutsOpen` |
| `progression.ts` | `steps: ProgressionStep[]`, `activeStep`, `playing`, `bpm`, `loop` |
| `interactive.ts` | `hoverPc: PitchClass \| null`, `posIdx: number \| null`, `mode: FretboardMode`, `pinned: PinnedNote[]`, `selectedIntervals: number[]`, `anchor: PinnedNote \| null` |

`chordQualityId` stores only the quality ID (not the full chord). The chord root always follows `root` — the `Chord` object is derived inside `useFretboardAnnotations` so they stay in sync automatically.

`progression.ts` auto-persists to `localStorage` (key `ftp.v1`) and keeps `lastCleared` so `clear()` can be
undone — the transport swaps Clear for "Undo clear" while a cleared sequence is recoverable. The fretboard, circle, note chips and header all follow `activeStep` during playback; the fretboard resolves its chord as `hoveredStep ?? activeStep`, so hovering a step previews it and otherwise the neck tracks the playhead. The store exposes `resolved()` and `activeChord()` as derived getters (not persisted state).

### Responsive layout

There is no CSS breakpoint file — the UI is inline-styled, so breakpoints are read from JS via
`useMediaQuery(NARROW)` (`hooks/useMediaQuery.ts`, `max-width: 900px`). Below that the sidebar becomes an
overlay drawer opened from a ☰ button in the header. The neck always sizes at `width/height: 100%` with
`preserveAspectRatio`, so it scales to its container instead of clipping; `MIN_NECK_WIDTH` (640px) makes the
container scroll rather than shrink the neck past legibility.

### Audio (`src/audio/`)

- **`chordSynth.ts`** — `playChord(rootPc, pattern)`. Uses the Web Audio API (triangle oscillators, pluck envelope, ~28ms strum spread). Lazy-initializes an `AudioContext` on first call.

### The rendering pipeline

```
stores → useFretboardAnnotations (useMemo) → annotateGrid → NoteAnnotation[][]
                                                                     ↓
                                              FretboardView (toolbar + SVG + readout)
                                                                     ↓
                                                     FretboardCell (per note, ALL notes)
```

`NoteAnnotation` carries everything a cell needs: `role`, `label`, `highlighted`, `semitones`, `degreeLabel`, `pitchName`.

`FretboardView` now owns all interactive state (via `useInteractiveStore`) and renders three zones: a `FretboardToolbar` (position/identify/hear-scale controls), the SVG with note dots and overlays, and a `FretboardReadout` that shows hover and identify-mode results. Every note position — including chromatic (non-scale) notes — renders as a clickable dot; non-scale notes are faint and become more visible in identify mode.

### SVG coordinate system (`src/components/fretboard/layout.ts`)

- Origin: top-left of SVG
- High E (string index 5) is at the top; low E (string index 0) is at the bottom
- String 0 = low E = `stringY(0)` = largest Y value
- Fret 0 = open string, rendered in the open column left of the nut

Key layout constants (all in px):
```
paddingTop: 34, stringSpacing: 41, openColWidth: 58
nutWidth: 9, fretColWidth: 73, dotRadius: 15.5, neckPad: 20
```

Helper functions: `stringY(i)`, `cellX(fret)`, `fretWireX(n)`, `neckTop()`, `neckBottom()`, `neckMidY()`, `fretNumY()`, `svgWidth(fretCount)`, `svgHeight()`.

## Visual design

**Dark warm palette** — not neutral grey. Key values:

| Token | Value | Use |
|---|---|---|
| `--bg-app` | `#100d0b` | App background |
| `--bg-panel` | `#16120e` | Sidebar |
| `--border-subtle` | `#2a221b` | All dividers |
| `--text-primary` | `#ede6dd` | Main text |
| `--text-muted` | `#8a7f72` | Secondary text |
| `--text-dimmer` | `#6b6258` | Labels, counts |

**Fonts**: `Hanken Grotesk` for all UI text, `JetBrains Mono` for note names, fret numbers, and degree labels on dots.

**Degree color system** — `colors.ts` is the single source of truth. Use `degreeFill(label)` / `degreeTextColor(label)` for a degree label like `b3`, or `degreeFillFor(n)` when you already have the number. Don't index `DEGREE_FILLS` or re-parse degree labels at the call site:

| Degree | Color |
|---|---|
| 1 (root) | `#e0564f` |
| 2 | `#e07c30` |
| 3 | `#cbb02e` |
| 4 | `#54a64f` |
| 5 | `#3897d6` |
| 6 | `#7a57d6` |
| 7 | `#c23bb6` |

Root notes render with a white ring halo (`r = dotRadius + 3.5`, `stroke rgba(255,255,255,.92)`).

**Chord mode**: when `chordQualityId` is set, dots keep their degree colour and non-chord scale tones are dimmed instead — full-size dots at `opacity 0.16`, or `0.07` in voicing mode. `isChordTone(role)` in `colors.ts` decides which notes dim.

## URL state

`useShareUrl` (mounted in `App.tsx`) encodes `?root=G&scale=dorian&chord=min7&label=degree&prog=1,4,5,1`.
Progression steps ride in `prog` as compact tokens — `<degree>[:qualityId][@root.qualityId][>secondaryDominantOf]` —
and a link's steps win over whatever `localStorage` held. Unparseable tokens are dropped rather than
failing the whole link. On mount it hydrates stores from the URL. On store change it calls `history.replaceState`. See `src/utils/url.ts` for encode/decode.

## Fretboard interactions

Every fret position is clickable — tap to hear its true pitch (Web Audio, `playNote(midi)`). A ripple animation plays on tap.

**Octave highlighting** — hover any dot to pulse a glow ring on every other instance of that pitch class across the neck. The readout shows the note name and count.

**Position window** — the toolbar's segmented control (Whole neck / 0–4 / 2–6 / 4–8 / 7–11 / 9–13 / 12–15) dims dots outside the selected range to ~14% opacity and draws a gold highlight rect over the active window. The `POSITIONS` constant lives in `src/store/interactive.ts`.

**Fretboard modes** — `mode: 'explore' | 'identify' | 'chords' | 'intervals'` in `interactive.ts`, picked from the toolbar's segmented Mode control. They are mutually exclusive because each one owns the fret click and the dot treatment; `setMode` clears `pinned` on every switch. Components derive their booleans from it (`useInteractiveStore(s => s.mode === 'chords')`) rather than storing separate flags.

**Identify mode** — pin notes by tapping. 2 pinned notes → interval name + semitone count. 3+ → chord detection via `detectChord` (15 shapes). Pinned notes show an amber ring and their pitch name. "Clear notes" resets the pins.

**Degree spotlight** — the `NoteChips` row above the neck is interactive: clicking a chip, or pressing `1`–`9`, toggles that scale degree into `selectedIntervals` (the same state interval mode uses, so there is one highlight pipeline rather than two). In `explore` mode the selection lights the neck with the anchor pinned to the root and dots keep their note names; in `intervals` mode the anchor can move and dots relabel to interval names. Selected chips get a white outline.

**Interval mode** — pick any of the 12 chromatic intervals (`ALL_INTERVALS` / `SEMITONE_TO_INTERVAL`); every note at those intervals from the anchor lights up and everything else dims to ~10%. The anchor is `anchor?.pc ?? root`, so it follows the root until you tap a fret to move it; tapping the anchor again releases it. Lit dots relabel to the interval measured from the anchor (`intervalLabelFrom`), and a lit note renders as a full dot even when it falls outside the active scale. The anchor wears a violet double ring. The tonic is never dimmed by a selection — it stays at full opacity as the reference the intervals are
heard against. A live interval selection otherwise owns the dot dimming outright, ahead of chord dimming — otherwise a lit note that is not a tone of the active chord would be dimmed away. Math lives in `src/theory/intervals.ts`.

**Fullscreen and jam** are the two immersive modes, and are mutually exclusive (`view.ts` enforces it). Both strip the chrome; jam keeps the progression cards. `App.tsx` derives `immersive = fullscreen || jamMode` for the chrome, and `FretboardView` uses the same flag to let the neck scale to full width. `Esc` leaves either via `exitImmersive()`.

**Progression panel** — collapsible via the `▾` in its header or the slim restore bar that replaces it (`showProgression` in `view.ts`). Jam mode overrides the preference, since the cards are the point of it.

**Fullscreen** — toggle in the toolbar, or `F` / `Esc`. Hides the sidebar, header, note chips, and footer, leaving `FretboardView`. The progression panel is hidden too **unless jam mode is on** — jamming needs the chord cards, so `App.tsx` renders it when `!fullscreen || jamMode`, and the toolbar carries its own Jam toggle so the mode is reachable without leaving fullscreen; the SVG switches to `width/height: 100%` with `preserveAspectRatio` so the neck scales up into the reclaimed space. State is `fullscreen` in `view.ts` — transient, not persisted and not in the share URL.

**Hear scale** — plays the scale ascending through the current position window (240ms per note), with an amber flash highlight following the playhead.

## Keyboard shortcuts

All handled in `useKeyboardShortcuts`, ignored when focus is in an input/textarea/contenteditable.

| Key | Action |
|---|---|
| `Space` | Play/pause the progression |
| `1`–`9` | Toggle the highlight for the nth note of the current scale (same as clicking its chip) |
| `0` | Clear the highlight selection |
| `?` | Open the shortcut list (`ShortcutsOverlay.tsx`) |
| `←↑↓→` | Move focus across the neck when a fret is focused |
| `Enter` | Play the focused fret |
| `F` | Toggle fullscreen (bare key only — `⌘F`/`Ctrl+F` still reach the browser) |
| `Esc` | Unwinds one layer: shortcut list, then sidebar drawer, then fullscreen |

## Adding features

- **New scale**: add an entry to `SCALES` in `scales.ts` with `id`, `name`, `category`, `pattern` (semitone offsets from root), `degrees` (string labels). Add a test.
- **New chord quality**: add to `CHORD_QUALITIES` in `chords.ts`. Same shape.
- **Chord voicings**: the ~236KB chord DB is *not* bundled. `chordVoicings.ts` exposes `loadChordDb()` /
  `isChordDbLoaded()`, and `useFretboardAnnotations` fetches it the first time Chords mode is entered.
  `getChordVoicings` returns `[]` until it lands, so callers must gate on the ready flag.
- **New UI panel**: the sidebar is `TheoryPanel.tsx` — add sections in order inside the scrollable div. Match existing spacing tokens.
- **Progression UI**: `ProgressionPanel.tsx` is the builder; `JamView.tsx` is the large-card mode and reads the stores itself (its only prop is `handleStepClick`, which depends on the panel's edit cursor). Shared bits live in `romanNumeral.ts`, `NewSlotCard.tsx`, and `useSaveSong.ts` + `SaveSongForm.tsx`.
- **Fretboard visual change**: edit `layout.ts` (geometry) or `colors.ts` (fills). Never put magic numbers in component files.

## What to avoid

- Never import from `src/theory/` inside `src/theory/` across module boundaries except through `index.ts` re-exports.
- Never import React into `src/theory/`.
- Don't store derived data in stores — derive it in hooks or component render.
- Don't add `console.log` or debugging artifacts to committed code.
- No Tailwind. The utility layer was never used, so the dependency was dropped; `index.css` carries a trimmed copy of Preflight. Style with inline `style={{}}` like the rest of the components, and use the `.h-*` classes for hover states.
- Don't re-parse degree labels or hard-code degree colours in components — `colors.ts` owns that.
