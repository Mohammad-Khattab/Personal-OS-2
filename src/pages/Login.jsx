import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Zap, Eye, EyeOff, LogIn } from 'lucide-react'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handle = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-bright)',
        borderRadius: 14,
        padding: '40px 36px',
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeUp 0.25s ease',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(2,132,199,0.4)',
          }}>
            <Zap size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--text-primary)', lineHeight: 1 }}>
              MKHUB
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 2 }}>
              PERSONAL OS
            </div>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>
          Sign in to sync your data across devices.
        </p>

        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                style={{ paddingRight: 38, fontFamily: 'var(--font-mono)' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--danger)',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 5, padding: '7px 10px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !email || !password}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {loading
              ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Signing in…</span>
              : <><LogIn size={14} /> Sign In</>
            }
          </button>
        </form>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 24, textAlign: 'center', lineHeight: 1.6 }}>
          Create your account in Supabase Dashboard →<br />Authentication → Users → Add user
        </p>
      </div>
    </div>
  )
}
