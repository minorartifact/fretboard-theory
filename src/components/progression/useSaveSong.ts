import { useState, useRef } from 'react'
import { useSongsStore } from '../../store/songs'

/**
 * Save-progression-as-song form state. The panel renders a different layout in
 * fullscreen, and the two are never mounted together, so each owns an instance.
 */
export function useSaveSong() {
  const saveSong = useSongsStore(s => s.saveSong)
  const [saving,   setSaving]   = useState(false)
  const [saveName, setSaveName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const open = () => {
    setSaving(s => !s)
    setSaveName('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const cancel = () => { setSaving(false); setSaveName('') }

  const commit = () => {
    if (!saveName.trim()) return
    saveSong(saveName)
    cancel()
  }

  return { saving, saveName, setSaveName, inputRef, open, cancel, commit }
}

export type SaveSongControl = ReturnType<typeof useSaveSong>
