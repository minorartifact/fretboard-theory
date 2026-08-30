import { useEffect } from 'react'
import { playMetronomeClick } from '../audio/metronome'
import { useProgressionStore } from '../store/progression'

/** Keeps the audible click on the transport's existing quarter-note clock. */
export function useMetronomeAudio(): void {
  const playing = useProgressionStore(s => s.playing)
  const enabled = useProgressionStore(s => s.metronome)
  const beatIndex = useProgressionStore(s => s.beatIndex)

  useEffect(() => {
    if (playing && enabled) playMetronomeClick(beatIndex === 0)
  }, [playing, enabled, beatIndex])
}
