import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  async function pullFromSupabase(userId) {
    setSyncing(true)
    try {
      const { data } = await supabase
        .from('user_data')
        .select('key, value')
        .eq('user_id', userId)

      for (const row of data || []) {
        localStorage.setItem(row.key, row.value)
      }
    } catch {
      // offline or error — use whatever is already in localStorage
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        await pullFromSupabase(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await pullFromSupabase(session.user.id)
        }
        if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, syncing, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
