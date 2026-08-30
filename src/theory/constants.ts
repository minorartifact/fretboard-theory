export const SHARP_NAMES: string[] = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
export const FLAT_NAMES: string[]  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

// For each root pitch class, whether the major key built on that root prefers sharps.
// C is neutral — sharps chosen as default for clean enharmonic rendering.
export const ROOT_PREFERS_SHARPS: boolean[] = [
  true,   // 0:  C  — neutral; sharps
  false,  // 1:  Db — 5 flats
  true,   // 2:  D  — 2 sharps
  false,  // 3:  Eb — 3 flats
  true,   // 4:  E  — 4 sharps
  false,  // 5:  F  — 1 flat (Bb)
  true,   // 6:  F# — 6 sharps (guitar context prefers F#)
  true,   // 7:  G  — 1 sharp
  false,  // 8:  Ab — 4 flats
  true,   // 9:  A  — 3 sharps
  false,  // 10: Bb — 2 flats
  true,   // 11: B  — 5 sharps
]

// Generic semitone-from-root → degree label; used for chromatic notes outside the active scale.
export const SEMITONE_TO_DEGREE: string[] = [
  '1','b2','2','b3','3','4','b5','5','b6','6','b7','7',
]

export const SEMITONE_TO_INTERVAL: string[] = [
  'P1','m2','M2','m3','M3','P4','TT','P5','m6','M6','m7','M7',
]
