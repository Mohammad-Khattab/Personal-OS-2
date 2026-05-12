import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  // Keep localStorage in sync
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  }, [key, value])

  // Debounced Supabase sync — fire-and-forget, never blocks the UI
  const timer = useRef(null)
  const syncUp = (next) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        await supabase.from('user_data').upsert(
          { user_id: user.id, key, value: JSON.stringify(next), updated_at: new Date().toISOString() },
          { onConflict: 'user_id,key' }
        )
      } catch { /* offline — ignore */ }
    }, 1500)
  }

  const set = (updater) => {
    setValue(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      syncUp(next)
      return next
    })
  }

  return [value, set]
}
