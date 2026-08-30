import type { PitchClass, LabelMode } from '../theory/types'
import { SCALES_BY_ID } from '../theory/scales'
import { CHORD_QUALITIES_BY_ID } from '../theory/chords'
import { parsePitchName, getPitchName } from '../theory/pitch'
import type { ProgressionStep } from '../theory/progression'

export interface UrlState {
  root:           PitchClass
  scaleId:        string | null
  chordQualityId: string | null
  labelMode:      LabelMode
  steps:          ProgressionStep[]
}

/**
 * A progression step as one compact token, so a whole sequence stays readable
 * in a shared link: `1,2:min7,5@7.dom7>2,1`
 *
 *   <degree>[:qualityId][@chordRoot.qualityId][>secondaryDominantOfDegree]
 */
function encodeStep(step: ProgressionStep): string {
  let out = String(step.degree)
  if (step.qualityOverride) out += `:${step.qualityOverride.id}`
  if (step.chordOverride)   out += `@${step.chordOverride.root}.${step.chordOverride.quality.id}`
  if (step.secondaryDominantOf != null) out += `>${step.secondaryDominantOf}`
  return out
}

const STEP_RE = /^(\d+)(?::([a-zA-Z0-9-]+))?(?:@(\d+)\.([a-zA-Z0-9-]+))?(?:>(\d+))?$/

function decodeStep(token: string): ProgressionStep | null {
  const m = STEP_RE.exec(token)
  if (!m) return null

  const degree = Number(m[1])
  if (!Number.isInteger(degree) || degree < 1) return null

  const step: ProgressionStep = { degree }

  if (m[2]) {
    const q = CHORD_QUALITIES_BY_ID[m[2]]
    if (!q) return null
    step.qualityOverride = q
  }
  if (m[3] && m[4]) {
    const root = Number(m[3])
    const q    = CHORD_QUALITIES_BY_ID[m[4]]
    if (!q || root < 0 || root > 11) return null
    step.chordOverride = { root: root as PitchClass, quality: q }
  }
  if (m[5]) step.secondaryDominantOf = Number(m[5])

  return step
}

export function encodeSteps(steps: ProgressionStep[]): string {
  return steps.map(encodeStep).join(',')
}

/** Unparseable tokens are dropped rather than failing the whole link. */
export function decodeSteps(raw: string): ProgressionStep[] {
  return raw.split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .map(decodeStep)
    .filter((s): s is ProgressionStep => s !== null)
}

export function encodeUrlState(state: UrlState): string {
  const p = new URLSearchParams()
  p.set('root', getPitchName(state.root, 'auto', state.root))
  if (state.scaleId)        p.set('scale', state.scaleId)
  if (state.chordQualityId) p.set('chord', state.chordQualityId)
  if (state.labelMode !== 'note') p.set('label', state.labelMode)
  if (state.steps.length) p.set('prog', encodeSteps(state.steps))
  return p.toString()
}

export function decodeUrlState(search: string): Partial<UrlState> {
  const p   = new URLSearchParams(search)
  const out: Partial<UrlState> = {}

  const rootName = p.get('root')
  if (rootName !== null) {
    const pc = parsePitchName(rootName)
    if (pc !== null) out.root = pc
  }

  const scaleId = p.get('scale')
  if (scaleId && SCALES_BY_ID[scaleId]) out.scaleId = scaleId

  const chordQualityId = p.get('chord')
  if (chordQualityId && CHORD_QUALITIES_BY_ID[chordQualityId])
    out.chordQualityId = chordQualityId

  const label = p.get('label') as LabelMode | null
  if (label && ['note', 'degree', 'interval'].includes(label)) out.labelMode = label

  const prog = p.get('prog')
  if (prog) out.steps = decodeSteps(prog)

  return out
}
