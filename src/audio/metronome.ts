let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** A short, dry click with a brighter pitch on beat one. */
export function playMetronomeClick(accent: boolean): void {
  try {
    const ac = getCtx()
    const now = ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(accent ? 1480 : 980, now)
    osc.frequency.exponentialRampToValueAtTime(accent ? 1100 : 760, now + 0.025)

    gain.gain.setValueAtTime(accent ? 0.16 : 0.10, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045)

    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.05)
  } catch { /* blocked by autoplay policy */ }
}
