import type { ChordQuality } from '../../theory/types'

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

export function romanNumeral(degIdx: number, quality: ChordQuality): string {
  const base  = ROMAN[degIdx] ?? `${degIdx + 1}`
  const lower = base.toLowerCase()
  const { id } = quality
  if (id === 'dim' || id === 'dim7')                       return lower + '°'
  if (id === 'm7b5')                                       return lower + 'ø'
  if (id === 'aug' || id === 'aug7' || id === 'aug-maj7') return base + '+'
  if (id.startsWith('min'))                                return lower
  return base
}
