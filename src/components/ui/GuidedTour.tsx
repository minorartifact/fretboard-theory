import { useCallback, useEffect, useState } from 'react'
import { useViewStore } from '../../store/view'

/**
 * A guided tour over the real UI: each step spotlights a region marked with
 * `data-tour` and explains it. The spotlight is a box-shadow cutout, so the
 * highlighted element is genuinely the live one rather than a screenshot.
 *
 * Steps whose target is missing — a collapsed sidebar section, or the drawer on
 * a narrow screen — fall back to a centred card with no spotlight rather than
 * pointing at nothing.
 */

interface TourStep {
  /** `data-tour` value of the element to spotlight. Omitted for the intro. */
  target?: string
  pad?: number
  title: string
  body: string
  /** Something to try once the tour is over; the overlay blocks clicks. */
  tip?: string
  next?: string
}

const STEPS: TourStep[] = [
  {
    title: 'Find your way around Neckwise',
    body: 'Eight quick stops: where your key lives, how to change how it sounds, and how to hear it on the neck. About a minute.',
    next: 'Start tour',
  },
  {
    target: 'key', pad: 12,
    title: 'You are here',
    body: 'Every note, chord and dot on screen is spelled from this key and scale. Change either one and the whole page follows — nothing else to re-set. The strip underneath sets the key directly.',
  },
  {
    target: 'circle', pad: 14,
    title: 'Change key by relationship, not by list',
    body: 'Neighbours on the wheel share almost all their notes. One click sideways gives you a key that still sounds close; across the wheel is a bigger move.',
    tip: 'Click a lit note to move the whole board to that key.',
  },
  {
    target: 'scales', pad: 8,
    title: 'Same notes, different mood',
    body: 'Modes are the seven places you can start the same set of notes. Dorian for minor with lift, Mixolydian for bluesy dominant, Lydian for bright and floating.',
    tip: 'Filter the list, pick a mode, and watch which fretboard dots change colour — that is the character shift.',
  },
  {
    target: 'chips', pad: 10,
    title: 'One colour per scale degree',
    body: 'These seven colours mean the same thing everywhere — chips, fretboard dots, chord buttons. Red is always the root, blue is always the 5th.',
    tip: 'Click a chip, or press its number, to light every place that degree lands.',
  },
  {
    target: 'modes', pad: 8,
    title: 'Four ways to work',
    body: 'Explore learns the shape, Identify names notes you play, Chords shows voicings, Intervals measures distance. Position crops the neck to one hand shape so you practise where you actually are.',
  },
  {
    target: 'board', pad: 12,
    title: 'Hear it before you read it',
    body: 'Tap any fret for its real pitch. Faint dots are notes outside the scale — still playable, just not part of this key.',
    tip: 'Hover a note to light up every octave of it across the neck.',
  },
  {
    target: 'chords', pad: 12,
    title: 'The chords this key hands you',
    body: 'All seven are built from the notes above, so any of them will sit inside the scale. Secondary dominants below are the borrowed ones that pull somewhere new.',
    tip: 'Tap a chord to send it straight to the progression.',
  },
  {
    target: 'prog', pad: 12,
    title: 'Build it, loop it, play along',
    body: 'Stack chords, set the tempo, and loop while you practise. The fretboard follows whichever chord is sounding, so you can see the shape as you hear it.',
    next: 'Finish',
  },
]

interface Rect { left: number; top: number; w: number; h: number }

const CARD_W = 376
const GAP    = 22
const MARGIN = 20

function cardPosition(spot: Rect | null, cardH: number): { left: number; top: number } {
  const W = window.innerWidth, H = window.innerHeight
  const ch = Math.max(cardH, 200)
  const clampTop = (t: number) => Math.min(Math.max(t, MARGIN), Math.max(MARGIN, H - ch - MARGIN))

  // Centred with no target: let the transform do it, so the card does not jump
  // when its measured height replaces the initial guess.
  if (!spot) return { left: Math.round((W - CARD_W) / 2), top: Math.round(clampTop((H - ch) / 2)) }

  let left: number
  let sideways = true
  if (spot.left + spot.w + GAP + CARD_W <= W - MARGIN) left = spot.left + spot.w + GAP
  else if (spot.left - GAP - CARD_W >= MARGIN)         left = spot.left - GAP - CARD_W
  else {
    sideways = false
    left = Math.min(Math.max(spot.left + spot.w / 2 - CARD_W / 2, MARGIN), W - CARD_W - MARGIN)
  }

  let top: number
  if (sideways)                                          top = spot.top + spot.h / 2 - ch / 2
  else if (spot.top + spot.h + GAP + ch <= H - MARGIN)   top = spot.top + spot.h + GAP
  else                                                   top = spot.top - GAP - ch

  return { left: Math.round(left), top: Math.round(clampTop(top)) }
}

/** Starts the tour. Lives in the header beside the label toggle. */
export function GuidedTourButton() {
  const openTour = useViewStore(s => s.openTour)
  return (
    <button
      onClick={openTour}
      title="Walk through the app in about a minute"
      className="h-chip"
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        height: '41px', padding: '0 15px', borderRadius: '11px',
        border: '1px solid rgba(224,168,90,.45)', background: 'rgba(224,168,90,.13)',
        color: '#eec282', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700,
        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        transition: 'background .12s, color .12s',
      }}
    >
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '18px', height: '18px', borderRadius: '50%',
        border: '1.5px solid currentColor', fontSize: '11px', fontWeight: 800, lineHeight: 1,
      }}>
        ?
      </span>
      <span>Guided tour</span>
    </button>
  )
}

export function GuidedTour() {
  const closeTour = useViewStore(s => s.closeTour)

  // App mounts this only while the tour is open, so state starts fresh each
  // time and no effect is needed to reset it.
  const [step, setStep] = useState(0)
  const [spot, setSpot] = useState<Rect | null>(null)
  const [cardH, setCardH] = useState(320)
  const [animate, setAnimate] = useState(false)

  const current = STEPS[step] ?? STEPS[0]

  /**
   * The spotlit elements are the app's own and are already laid out, so this is
   * a plain read that can run inside an event handler — no measure-in-effect
   * round trip, and no flash of a card in the wrong place.
   */
  const measure = useCallback((index: number): Rect | null => {
    const s = STEPS[index]
    if (!s?.target) return null
    const el = document.querySelector(`[data-tour="${s.target}"]`)
    if (!el) return null              // collapsed section, or drawer closed
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    const r    = el.getBoundingClientRect()
    const pad  = s.pad ?? 10
    const left = Math.max(2, Math.round(r.left - pad))
    const top  = Math.max(2, Math.round(r.top - pad))
    return {
      left, top,
      w: Math.min(Math.round(r.width + pad * 2), window.innerWidth - left - 2),
      h: Math.min(Math.round(r.height + pad * 2), window.innerHeight - top - 2),
    }
  }, [])

  const jump = useCallback((index: number) => {
    const next     = Math.max(0, Math.min(STEPS.length - 1, index))
    const nextSpot = measure(next)
    // A spotlight that has just mounted has no previous position to travel
    // from, so animating unconditionally slides it in from the corner of the
    // screen. Only glide when moving between two targets.
    setAnimate(spot !== null && nextSpot !== null)
    setStep(next)
    setSpot(nextSpot)
  }, [measure, spot])

  const end = useCallback(() => closeTour(), [closeTour])

  const go = useCallback((delta: number) => {
    if (step + delta >= STEPS.length) { end(); return }
    if (step + delta < 0) return
    jump(step + delta)
  }, [step, end, jump])

  // Keep the cutout on its target as the window changes shape. Measuring from
  // a listener rather than the effect body keeps this a reaction to an event.
  useEffect(() => {
    const remeasure = () => { setAnimate(false); setSpot(measure(step)) }
    window.addEventListener('resize', remeasure)
    window.addEventListener('scroll', remeasure, true)
    return () => {
      window.removeEventListener('resize', remeasure)
      window.removeEventListener('scroll', remeasure, true)
    }
  }, [step, measure])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')                               { e.preventDefault(); end() }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); go(1) }
      else if (e.key === 'ArrowLeft')                       { e.preventDefault(); go(-1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [end, go])

  /**
   * The card's height decides where it sits, and it changes with the step (some
   * steps carry a Try box). A ref callback with an observer keeps that out of
   * an effect.
   */
  const cardRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    setCardH(el.offsetHeight)
    const ro = new ResizeObserver(() => setCardH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const card = cardPosition(spot, cardH)

  return (
    <div role="dialog" aria-modal="true" aria-label="Guided tour" style={{ position: 'fixed', inset: 0, zIndex: 70 }}>
      {spot ? (
        <div style={{
          position: 'absolute', pointerEvents: 'none',
          left: spot.left, top: spot.top, width: spot.w, height: spot.h,
          borderRadius: '14px', boxSizing: 'border-box',
          border: '2px solid rgba(224,168,90,.85)',
          boxShadow: '0 0 0 9999px rgba(6,5,4,.82), 0 0 30px rgba(224,168,90,.3)',
          transition: animate
            ? 'left .34s cubic-bezier(.4,0,.2,1), top .34s cubic-bezier(.4,0,.2,1), width .34s cubic-bezier(.4,0,.2,1), height .34s cubic-bezier(.4,0,.2,1)'
            : 'none',
        }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,5,4,.82)' }} />
      )}

      <div
        ref={cardRef}
        style={{
          position: 'absolute', left: card.left, top: card.top,
          width: `${CARD_W}px`, boxSizing: 'border-box',
          background: '#1c1610', border: '1px solid #3d3125', borderRadius: '16px',
          boxShadow: '0 26px 64px rgba(0,0,0,.62)', padding: '20px 22px 15px',
          transition: animate ? 'left .34s cubic-bezier(.4,0,.2,1), top .34s cubic-bezier(.4,0,.2,1)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '11px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#e0a85a', fontFamily: "'JetBrains Mono', monospace" }}>
            {step === 0 ? 'Guided tour' : `Step ${step} of ${STEPS.length - 1}`}
          </span>
          <button onClick={end} className="h-ghost" style={{ border: 'none', background: 'none', padding: '2px 0', fontFamily: 'inherit', fontSize: '11.5px', fontWeight: 600, color: '#8a7f72', cursor: 'pointer' }}>
            Skip tour · Esc
          </button>
        </div>

        <div style={{ fontSize: '19.5px', fontWeight: 800, letterSpacing: '-.015em', color: '#f5efe5', lineHeight: 1.25, marginBottom: '9px' }}>
          {current.title}
        </div>
        <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.58, color: '#bdb2a4' }}>
          {current.body}
        </p>

        {current.tip && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '14px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(224,168,90,.09)', border: '1px solid rgba(224,168,90,.22)' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#e0a85a', flexShrink: 0, paddingTop: '3px' }}>Try</span>
            <span style={{ fontSize: '12.5px', lineHeight: 1.5, color: '#dcc6a2' }}>{current.tip}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginTop: '17px', paddingTop: '14px', borderTop: '1px solid #2c241c' }}>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => jump(i)}
                aria-label={`Go to step ${i}: ${s.title}`}
                style={{
                  height: '7px', borderRadius: '99px', border: 'none', padding: 0, cursor: 'pointer',
                  width: i === step ? '20px' : '7px',
                  background: i === step ? '#e0a85a' : (i < step ? 'rgba(224,168,90,.4)' : '#3d3125'),
                  transition: 'width .25s ease, background .25s ease',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            {step > 0 && (
              <button onClick={() => go(-1)} style={{ height: '34px', padding: '0 14px', borderRadius: '9px', border: '1px solid #3d3125', background: 'none', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: '#b3a89a', cursor: 'pointer' }}>
                Back
              </button>
            )}
            <button onClick={() => go(1)} style={{ height: '34px', padding: '0 17px', borderRadius: '9px', border: 'none', background: '#e0a85a', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 800, color: '#2a1c0c', cursor: 'pointer' }}>
              {current.next ?? 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
