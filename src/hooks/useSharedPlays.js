import { useState, useCallback } from 'react'

const KEY = 'gridiron_plays_v1'

function readLocal() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

/**
 * useSharedPlays — localStorage version
 * Plays persist across sessions in the browser.
 * No backend, no credentials, no network required.
 */
export function useSharedPlays() {
  const [plays,      setPlays]      = useState(() => readLocal())
  const [syncStatus, setSyncStatus] = useState('idle')
  const lastSync  = null
  const storageOk = true

  const load = useCallback(() => {
    setPlays(readLocal())
  }, [])

  const addPlay = useCallback((play) => {
    const current = readLocal()
    const next = [...current.filter(p => p.id !== play.id), play]
    localStorage.setItem(KEY, JSON.stringify(next))
    setPlays(next)
    setSyncStatus('saved')
    setTimeout(() => setSyncStatus('idle'), 1500)
    return true
  }, [])

  const deletePlay = useCallback((id) => {
    const current = readLocal()
    const next = current.filter(p => p.id !== id)
    localStorage.setItem(KEY, JSON.stringify(next))
    setPlays(next)
    return true
  }, [])

  return { plays, syncStatus, lastSync, storageOk, load, addPlay, deletePlay }
}
