import { useState, useRef } from 'react'
import { useSongsStore } from '../../store/songs'

/**
 * Save-progression-as-song form state. The normal and jam views are never
 * mounted at the same time, so each owns its own instance.
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
