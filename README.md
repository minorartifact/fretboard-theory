# Neckwise

Explore harmony across the fretboard.

An interactive music theory visualization tool for guitarists — built to make scale and chord relationships tangible directly on the fretboard.

**[Live demo → minorartifact.github.io/fretboard-theory](https://minorartifact.github.io/fretboard-theory)**

---

## Features

**Fretboard**
- SVG fretboard — 6 strings × 15 frets with wood gradient, realistic string widths, nut, and inlay markers
- Degree color system: consistent 7-color palette (1=red, 2=orange, 3=yellow, 4=green, 5=blue, 6=violet, 7=purple) across every view
- Label modes: note names, interval names (P5, m3…), or scale degree labels (b3, #4…)
- Non-chord scale degrees fade to 16% opacity when a chord is active; chord root gets a white halo ring
- Hover tooltips on each note dot (pitch name + degree label)

**Theory panel (sidebar)**
- 30+ scales across major modes, melodic minor, harmonic minor, pentatonic, blues, and symmetric categories
- Click active scale to deselect (return to chromatic view)
- Chord quality selector: triads, seventh chords (maj7, dom7, m7, ø7, °7…), extended (9th chords)
- Circle of Fifths / Thirds: interactive SVG; click any note to change root; scale arc polygon; golden rings for chord tones; 5ths ↔ 3rds toggle; key facts (dominant, subdominant, relative minor)

**Chord progression player**
- Diatonic chord palette (7 chords for any 7-tone scale), tap to add bars
- Edit cursor model: click a bar to select it, then tap a diatonic chord to replace it; "+" placeholder to append
- Transport: play/pause (Space), step back/forward, restart, loop toggle, BPM control
- Preset progressions: I–IV–V–I, I–V–vi–IV, ii–V–I, vi–IV–I–V, 12-Bar Blues
- Web Audio API chord synth: guitar-like pluck envelope, strum arpeggiation

**Song Match (Hooktheory integration)**
- Searches [Hooktheory's](https://www.hooktheory.com) song database for real songs using the current chord progression
- Degree-based search — key-independent (I–IV–V–I in C and G return the same songs)
- Sign in once with your Hooktheory account; bearer token persisted in `localStorage`
- Results auto-refresh when the progression changes; panel collapsed by default, expands on demand
- Paginated results linking directly to Hooktheory's analysis for each song

**Extras**
- Multiple tunings: Standard, Drop D, Eb Standard, Open G, Open E, DADGAD
- URL state: share a specific root/scale/label combination via the URL hash
- Local persistence: progression steps, BPM, and loop preference survive page reload

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| State | Zustand 5 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Fonts | Hanken Grotesk + JetBrains Mono |
| Testing | Vitest — 87 unit tests |
| CI/CD | GitHub Actions → GitHub Pages |

---

## Architecture

The theory engine (`src/theory/`) is a pure TypeScript module with no React dependency, making it fully unit-testable in isolation:

```
src/theory/
├── types.ts              PitchClass (0–11), ScaleDef, ChordQuality, NoteAnnotation, …
├── constants.ts          Note names, ROOT_PREFERS_SHARPS, SEMITONE_TO_DEGREE/INTERVAL
├── pitch.ts              getPitchName, intervalBetween, transpose, parsePitchName
├── scales.ts             30 scale definitions + isInScale, getScaleDegreeLabel
├── chords.ts             20 chord qualities + getDiatonicChords, getChordToneRole
├── fretboard.ts          buildFretboardGrid, 6 tuning definitions
├── annotation.ts         annotateNote / annotateGrid — core composition function
├── progression.ts        resolveProgression, COMMON_PROGRESSIONS
└── progressionSearch.ts  hooktheoryBasicDegreesFromSteps, hooktheoryBasicChildPathFromSteps
```

External integrations live in `src/api/`:

```
src/api/
└── hooktheory.ts   fetchHooktheoryToken, fetchHooktheorySongMatches, resolveHooktheoryBasicChildPath
```

All fretboard rendering is driven by `annotateGrid`, which composes a `FretboardNote[][]` grid with an `AnnotationContext` (root, scale, chord, labelMode, fretRange) into a flat `NoteAnnotation[][]` that React SVG components render.

---

## Development

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm test          # watch mode unit tests
npm run build     # production build
```

---

## Roadmap

- **Serverless API proxy** — a single Vercel/Cloudflare Worker function acting as a unified gateway for all external music APIs:
  - Hides `SPOTIFY_CLIENT_SECRET` from the frontend bundle
  - Provides stable CORS for Hooktheory (avoids long-term browser policy issues)
  - Caches Hooktheory results per chord path (they rarely change, saves rate-limit quota)
  - Routes: `/api/spotify/token`, `/api/spotify/recommendations`, `/api/hooktheory/auth`, `/api/hooktheory/songs`, `/api/hooktheory/nodes`

- **Songs by key** — find songs recorded in the same key (root + mode). Spotify's `/recommendations?target_key=&target_mode=` endpoint returns songs in a given key. Blocked on the proxy above (Spotify client credentials can't live in the browser). Once the proxy is up, this is a second tab alongside the existing "Songs by progression" panel.

---

## License

MIT © 2025 minorartifact
