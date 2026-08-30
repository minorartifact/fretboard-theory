/**
 * Chord synthesizer using the Web Audio API.
 *
 * Uses the Karplus-Strong algorithm to produce a plucked-string sound:
 * 1. Fill a short delay buffer with white noise (one period of the target frequency).
 * 2. Run the KS feedback loop (average adjacent samples × decay) to generate
 *    the full waveform offline into an AudioBuffer.
 * 3. Play the result via a BufferSourceNode — no feedback graph needed.
 *
 * Pre-generating the buffer avoids Web Audio's DAG restrictions (no cycles allowed),
 * which caused screaming artifacts in a live delay-feedback approach.
 */

const C4_FREQ = 261.6256

function noteFreq(pitchClass: number, octave: number): number {
  return C4_FREQ * Math.pow(2, pitchClass / 12 + (octave - 4))
}

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

const DURATION_S = 2.6
const ATTACK_S = 0.009
const RELEASE_S = 0.38

/** Generate a Karplus-Strong plucked-string waveform into an AudioBuffer. */
function generateKS(ac: AudioContext, freq: number): AudioBuffer {
  const sr         = ac.sampleRate
  const totalSamps = Math.ceil(sr * DURATION_S)
  const delayLen   = Math.round(sr / freq)

  const noise = new Float32Array(delayLen)
  const delay = new Float32Array(delayLen)
  for (let i = 0; i < delayLen; i++) noise[i] = Math.random() * 2 - 1

  // A guitar string is displaced over an area, not hit with a one-sample burst.
  // Smooth the noise and add a pick-position notch so the attack has less fizz
  // and each pitch does not have the same synthetic, full-spectrum transient.
  const pickOffset = Math.max(1, Math.round(delayLen * 0.18))
  let smoothed = 0
  let peak = 0
  for (let i = 0; i < delayLen; i++) {
    smoothed += (noise[i] - smoothed) * 0.42
    const picked = smoothed - noise[(i + pickOffset) % delayLen] * 0.32
    delay[i] = picked
    peak = Math.max(peak, Math.abs(picked))
  }
  if (peak > 0) {
    for (let i = 0; i < delayLen; i++) delay[i] /= peak
  }

  // Higher strings lose energy faster and are damped more heavily.
  const normalizedPitch = Math.min(1, Math.max(0, (freq - 82) / 800))
  const decay = 0.9986 - normalizedPitch * 0.00045
  const blend = 0.525 - normalizedPitch * 0.02

  const buf  = ac.createBuffer(1, totalSamps, sr)
  const data = buf.getChannelData(0)
  let pos    = 0
  for (let i = 0; i < totalSamps; i++) {
    const next = (pos + 1) % delayLen
    data[i]    = delay[pos]
    delay[pos] = (delay[pos] * blend + delay[next] * (1 - blend)) * decay
    pos        = next
  }
  return buf
}

function playBuffer(
  ac: AudioContext,
  buf: AudioBuffer,
  freq: number,
  startTime: number,
  gain: number,
): void {
  const src      = ac.createBufferSource()
  const gainNode = ac.createGain()
  const warmth   = ac.createBiquadFilter()
  const body     = ac.createBiquadFilter()

  src.buffer = buf

  // Avoid exposing the discontinuity at the beginning of the noise buffer.
  gainNode.gain.setValueAtTime(0.0001, startTime)
  gainNode.gain.linearRampToValueAtTime(gain, startTime + ATTACK_S)
  gainNode.gain.exponentialRampToValueAtTime(gain * 0.68, startTime + 0.24)
  gainNode.gain.setValueAtTime(gain * 0.68, startTime + DURATION_S - RELEASE_S)
  gainNode.gain.linearRampToValueAtTime(0, startTime + DURATION_S)

  warmth.type = 'lowpass'
  warmth.frequency.setValueAtTime(Math.min(7200, Math.max(2600, freq * 13)), startTime)
  warmth.Q.value = 0.45
  body.type = 'peaking'
  body.frequency.value = 215
  body.Q.value = 0.8
  body.gain.value = 1.8

  src.connect(gainNode)
  gainNode.connect(warmth)
  warmth.connect(body)
  body.connect(ac.destination)
  src.start(startTime)
  src.stop(startTime + DURATION_S)
}

export function playNote(midi: number): void {
  try {
    const ac   = getCtx()
    const freq = 440 * Math.pow(2, (midi - 69) / 12)
    playBuffer(ac, generateKS(ac, freq), freq, ac.currentTime, 0.42)
  } catch { /* blocked by autoplay policy */ }
}

export function playChord(rootPc: number, pattern: number[]): void {
  try {
    const ac  = getCtx()
    const now = ac.currentTime

    const octaveFor = (i: number) => {
      if (i === 0) return 2   // bass
      if (i <= 2)  return 3
      return 4
    }

    pattern.forEach((offset, i) => {
      const pc   = (rootPc + offset) % 12
      const freq = noteFreq(pc, octaveFor(i))
      // A little timing and velocity variation keeps repeated chords from
      // sounding like the exact same sample being retriggered.
      const t0 = now + i * 0.034 + Math.random() * 0.009
      const baseVol = i === 0 ? 0.38 : Math.max(0.19, 0.33 - i * 0.025)
      const vol = baseVol * (0.92 + Math.random() * 0.12)
      playBuffer(ac, generateKS(ac, freq), freq, t0, vol)
    })
  } catch { /* blocked by autoplay policy */ }
}
