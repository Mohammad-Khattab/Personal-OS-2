import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  Lock, Unlock, Eye, EyeOff, Copy, Plus, Trash2,
  Shield, Key, X, Search, Check, RefreshCw, Link,
} from 'lucide-react'

// ── Password Generator ────────────────────────────────────────────────────────

function generatePassword(length = 20) {
  const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower   = 'abcdefghijklmnopqrstuvwxyz'
  const digits  = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const all = upper + lower + digits + symbols
  // Guarantee at least one of each character class
  const required = [
    upper[crypto.getRandomValues(new Uint32Array(1))[0] % upper.length],
    lower[crypto.getRandomValues(new Uint32Array(1))[0] % lower.length],
    digits[crypto.getRandomValues(new Uint32Array(1))[0] % digits.length],
    symbols[crypto.getRandomValues(new Uint32Array(1))[0] % symbols.length],
  ]
  const rest = Array.from(
    crypto.getRandomValues(new Uint32Array(length - 4)),
    x => all[x % all.length]
  )
  // Shuffle the combined array
  const combined = [...required, ...rest]
  for (let i = combined.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]]
  }
  return combined.join('')
}

// ── Crypto Helpers ────────────────────────────────────────────────────────────

async function deriveKey(password, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function encrypt(text, key) {
  const enc = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text))
  return { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }
}

async function decrypt(encrypted, key) {
  const dec = new TextDecoder()
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(encrypted.iv) },
    key,
    new Uint8Array(encrypted.data)
  )
  return dec.decode(decrypted)
}

// ── Constants ─────────────────────────────────────────────────────────────────

const VERIFIER_STRING = 'MKHUB_VERIFIED'

const CATEGORIES = [
  { value: 'all',     label: 'All',     badge: 'badge-muted' },
  { value: 'social',  label: 'Social',  badge: 'badge-accent' },
  { value: 'email',   label: 'Email',   badge: 'badge-warning' },
  { value: 'gaming',  label: 'Gaming',  badge: 'badge-purple' },
  { value: 'banking', label: 'Banking', badge: 'badge-success' },
  { value: 'work',    label: 'Work',    badge: 'badge-accent' },
  { value: 'other',   label: 'Other',   badge: 'badge-muted' },
]

function getCategoryBadge(value) {
  const cat = CATEGORIES.find(c => c.value === value)
  return cat ? cat.badge : 'badge-muted'
}

function getCategoryLabel(value) {
  const cat = CATEGORIES.find(c => c.value === value)
  return cat ? cat.label : 'Other'
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return ''
  }
}

// ── Setup Screen ──────────────────────────────────────────────────────────────

function SetupVault({ onSetup }) {
  const [master, setMaster] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showMaster, setShowMaster] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (master.length < 8) return setError('Master password must be at least 8 characters.')
    if (master !== confirm) return setError('Passwords do not match.')
    setLoading(true)
    try {
      const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      const key = await deriveKey(master, new Uint8Array(salt))
      const verifier = await encrypt(VERIFIER_STRING, key)
      onSetup({ salt, verifier, entries: [] }, key)
    } catch {
      setError('Failed to create vault. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      gap: 0,
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-bright)',
        borderRadius: 12,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        animation: 'fadeUp 0.25s ease',
      }}>
        {/* Icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: 'rgba(0, 200, 255, 0.08)',
          border: '1px solid rgba(0, 200, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Shield size={28} color="var(--accent)" />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: 8,
          textAlign: 'center',
        }}>
          Set up your vault
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginBottom: 28,
          lineHeight: 1.6,
        }}>
          Choose a master password. It encrypts everything locally in your browser — no data ever leaves your device.
        </p>

        <form onSubmit={handleCreate} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="label">Master Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showMaster ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={master}
                onChange={e => { setMaster(e.target.value); setError('') }}
                autoFocus
                style={{ paddingRight: 38, fontFamily: 'var(--font-mono)' }}
              />
              <button
                type="button"
                onClick={() => setShowMaster(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
              >
                {showMaster ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat master password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError('') }}
                style={{ paddingRight: 38, fontFamily: 'var(--font-mono)' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--danger)',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 5,
              padding: '7px 10px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !master || !confirm}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {loading ? (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Creating vault...</span>
            ) : (
              <><Shield size={14} /> Create Vault</>
            )}
          </button>
        </form>

        <div style={{
          marginTop: 20,
          padding: '10px 14px',
          background: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 7,
          width: '100%',
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--warning)', lineHeight: 1.6, textAlign: 'center' }}>
            There is no recovery option. If you forget your master password, all stored passwords will be permanently lost.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Unlock Screen ─────────────────────────────────────────────────────────────

function UnlockVault({ vault, onUnlock }) {
  const [master, setMaster] = useState('')
  const [showMaster, setShowMaster] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleUnlock(e) {
    e.preventDefault()
    if (!master) return
    setError('')
    setLoading(true)
    try {
      const key = await deriveKey(master, new Uint8Array(vault.salt))
      const verified = await decrypt(vault.verifier, key)
      if (verified !== VERIFIER_STRING) throw new Error('wrong password')
      onUnlock(key)
    } catch {
      setError('Incorrect master password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-bright)',
        borderRadius: 12,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 380,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: 'fadeUp 0.25s ease',
      }}>
        {/* Icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: 'rgba(0, 200, 255, 0.06)',
          border: '1px solid rgba(0, 200, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Lock size={28} color="var(--accent)" />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: 6,
        }}>
          Vault Locked
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginBottom: 28,
          textAlign: 'center',
        }}>
          Enter your master password to unlock.
        </p>

        <form onSubmit={handleUnlock} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="label">Master Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showMaster ? 'text' : 'password'}
                placeholder="Enter master password"
                value={master}
                onChange={e => { setMaster(e.target.value); setError('') }}
                autoFocus
                style={{ paddingRight: 38, fontFamily: 'var(--font-mono)' }}
              />
              <button
                type="button"
                onClick={() => setShowMaster(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
              >
                {showMaster ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--danger)',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 5,
              padding: '7px 10px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !master}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Unlocking...</span>
            ) : (
              <><Unlock size={14} /> Unlock</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Add Password Modal ────────────────────────────────────────────────────────

function AddPasswordModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    site: '',
    url: '',
    username: '',
    password: '',
    category: 'other',
    note: '',
  })
  const [showPassword, setShowPassword] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [genCopied, setGenCopied] = useState(false)

  function set(field, val) {
    setForm(prev => ({ ...prev, [field]: val }))
    setError('')
  }

  function handleGenerate() {
    const pw = generatePassword(20)
    setForm(prev => ({ ...prev, password: pw }))
    setShowPassword(true)
    setGenCopied(true)
    navigator.clipboard.writeText(pw).catch(() => {})
    setTimeout(() => setGenCopied(false), 2000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.site.trim()) return setError('Site name is required.')
    if (!form.username.trim()) return setError('Username is required.')
    if (!form.password) return setError('Password is required.')
    setLoading(true)
    try {
      await onAdd({
        site: form.site.trim(),
        url: form.url.trim(),
        username: form.username.trim(),
        rawPassword: form.password,
        category: form.category,
        note: form.note.trim(),
      })
      onClose()
    } catch {
      setError('Encryption failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Add Password</h2>
          <button className="btn-icon" onClick={onClose}><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="label">Site / App *</label>
            <input
              className="input"
              placeholder="e.g. GitHub, Gmail"
              value={form.site}
              onChange={e => set('site', e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Link size={10} /> URL <span style={{ opacity: 0.5 }}>(optional)</span>
            </label>
            <input
              className="input"
              placeholder="https://github.com"
              value={form.url}
              onChange={e => set('url', e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="label">Username / Email *</label>
            <input
              className="input"
              placeholder="your@email.com"
              value={form.username}
              onChange={e => set('username', e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="label">Password *</label>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleGenerate}
                style={{ gap: 4, fontSize: 11, color: genCopied ? 'var(--success)' : undefined }}
              >
                {genCopied
                  ? <><Check size={10} /> Copied!</>
                  : <><RefreshCw size={10} /> Generate</>
                }
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter or generate a password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                style={{ paddingRight: 38, fontFamily: 'var(--font-mono)', fontSize: 12 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="label">Category</label>
            <select
              className="select"
              value={form.category}
              onChange={e => set('category', e.target.value)}
            >
              {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="label">Note (optional)</label>
            <textarea
              className="input"
              placeholder="Any extra details..."
              value={form.note}
              onChange={e => set('note', e.target.value)}
              style={{ minHeight: 64, resize: 'vertical' }}
            />
          </div>

          {error && (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--danger)',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 5,
              padding: '7px 10px',
            }}>
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Encrypting...</span>
              ) : (
                <><Plus size={14} /> Save Password</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Entry Card ────────────────────────────────────────────────────────────────

function EntryCard({ entry, cryptoKey, onDelete }) {
  const [revealed, setRevealed] = useState(false)
  const [plainPassword, setPlainPassword] = useState(null)
  const [revealLoading, setRevealLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleReveal = useCallback(async () => {
    if (revealed) {
      setRevealed(false)
      setPlainPassword(null)
      return
    }
    setRevealLoading(true)
    try {
      const plain = await decrypt(entry.password, cryptoKey)
      setPlainPassword(plain)
      setRevealed(true)
    } catch {
      // silently fail — key mismatch shouldn't happen in normal use
    } finally {
      setRevealLoading(false)
    }
  }, [revealed, entry.password, cryptoKey])

  const handleCopy = useCallback(async () => {
    try {
      const plain = plainPassword ?? await decrypt(entry.password, cryptoKey)
      await navigator.clipboard.writeText(plain)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      // Clear clipboard after 30s
      setTimeout(async () => {
        try {
          const current = await navigator.clipboard.readText()
          if (current === plain) await navigator.clipboard.writeText('')
        } catch {
          // clipboard permission may not be available, ignore
        }
      }, 30000)
    } catch {
      // ignore clipboard errors
    }
  }, [plainPassword, entry.password, cryptoKey])

  const catBadge = getCategoryBadge(entry.category)
  const catLabel = getCategoryLabel(entry.category)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${hovered ? 'var(--border-bright)' : 'var(--border)'}`,
        borderRadius: 8,
        padding: '14px 16px',
        transition: 'border-color 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Top row: site + category + delete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Site icon */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(0, 200, 255, 0.07)',
          border: '1px solid rgba(0, 200, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 13,
          color: 'var(--accent)',
          textTransform: 'uppercase',
        }}>
          {entry.site.charAt(0)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {entry.site}
            </div>
            {entry.url && (
              <a
                href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ color: 'var(--text-muted)', flexShrink: 0, display: 'flex' }}
                title={entry.url}
              >
                <Link size={10} />
              </a>
            )}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {entry.username}
          </div>
        </div>

        <span className={`badge ${catBadge}`} style={{ flexShrink: 0 }}>{catLabel}</span>

        <button
          className="btn-icon"
          onClick={() => onDelete(entry.id)}
          style={{
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s',
            color: 'var(--danger)',
            border: '1px solid rgba(239,68,68,0.2)',
            flexShrink: 0,
          }}
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Password row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          flex: 1,
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '6px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: revealed ? 'var(--text-primary)' : 'var(--text-muted)',
          letterSpacing: revealed ? 'normal' : '0.1em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          userSelect: revealed ? 'text' : 'none',
        }}>
          {revealed ? (plainPassword ?? '••••••••') : '••••••••'}
        </div>

        <button
          className="btn-icon"
          onClick={handleReveal}
          disabled={revealLoading}
          title={revealed ? 'Hide' : 'Reveal'}
          style={{ flexShrink: 0 }}
        >
          {revealLoading
            ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9 }}>...</span>
            : revealed
              ? <EyeOff size={13} />
              : <Eye size={13} />
          }
        </button>

        <button
          className="btn btn-ghost btn-sm"
          onClick={handleCopy}
          style={{
            flexShrink: 0,
            gap: 5,
            color: copied ? 'var(--success)' : undefined,
            borderColor: copied ? 'rgba(16,185,129,0.3)' : undefined,
            transition: 'color 0.2s, border-color 0.2s',
          }}
          title="Copy password"
        >
          {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>

      {/* Note + date footer */}
      {(entry.note || entry.addedAt) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {entry.note ? (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {entry.note}
            </span>
          ) : <span />}
          {entry.addedAt && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-muted)',
              flexShrink: 0,
            }}>
              {formatDate(entry.addedAt)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Unlocked Vault View ───────────────────────────────────────────────────────

function VaultView({ vault, cryptoKey, onLock, onUpdate }) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)

  const entries = vault.entries ?? []

  const filtered = entries.filter(e => {
    const matchesCat = catFilter === 'all' || e.category === catFilter
    const q = search.toLowerCase()
    const matchesSearch = !q || e.site.toLowerCase().includes(q) || e.username.toLowerCase().includes(q)
    return matchesCat && matchesSearch
  })

  async function handleAdd({ site, url, username, rawPassword, category, note }) {
    const encrypted = await encrypt(rawPassword, cryptoKey)
    const newEntry = {
      id: Date.now(),
      site,
      url,
      username,
      password: encrypted,
      note,
      category,
      addedAt: new Date().toISOString(),
    }
    onUpdate(prev => ({ ...prev, entries: [newEntry, ...(prev.entries ?? [])] }))
  }

  function handleDelete(id) {
    if (!window.confirm('Delete this password entry? This cannot be undone.')) return
    onUpdate(prev => ({ ...prev, entries: (prev.entries ?? []).filter(e => e.id !== id) }))
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="label" style={{ marginBottom: 4 }}>Security</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 800,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <Key size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
            Password Vault
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-accent">{entries.length} saved</span>
          <button className="btn btn-ghost" onClick={onLock} title="Lock vault">
            <Lock size={13} /> Lock
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Password
          </button>
        </div>
      </div>

      {/* Search + Category filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {/* Search bar */}
        <div style={{ position: 'relative', maxWidth: 380 }}>
          <Search size={13} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
          <input
            className="input"
            placeholder="Search by site or username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              className={`chip${catFilter === cat.value ? ' active' : ''}`}
              onClick={() => setCatFilter(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entry list */}
      {entries.length === 0 ? (
        <div className="empty-state">
          <Key size={40} />
          <p style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 16,
            color: 'var(--text-secondary)',
          }}>
            Vault is empty
          </p>
          <p style={{ fontSize: 13 }}>Add your first password to get started.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 8 }}
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} /> Add your first password
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Search size={36} />
          <p style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 15,
            color: 'var(--text-secondary)',
          }}>
            No results
          </p>
          <p style={{ fontSize: 13 }}>Try a different search or category.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
          {filtered.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              cryptoKey={cryptoKey}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <AddPasswordModal
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function Passwords() {
  const [vault, setVault] = useLocalStorage('mk-vault', null)
  const [cryptoKey, setCryptoKey] = useState(null)

  // Clear key on page unload (refresh/close)
  useEffect(() => {
    const clear = () => setCryptoKey(null)
    window.addEventListener('beforeunload', clear)
    return () => window.removeEventListener('beforeunload', clear)
  }, [])

  function handleSetup(newVault, key) {
    setVault(newVault)
    setCryptoKey(key)
  }

  function handleUnlock(key) {
    setCryptoKey(key)
  }

  function handleLock() {
    setCryptoKey(null)
  }

  function handleUpdate(updater) {
    setVault(updater)
  }

  // State 1: vault not set up
  if (!vault) {
    return <SetupVault onSetup={handleSetup} />
  }

  // State 2: vault exists but locked
  if (!cryptoKey) {
    return <UnlockVault vault={vault} onUnlock={handleUnlock} />
  }

  // State 3: unlocked
  return (
    <VaultView
      vault={vault}
      cryptoKey={cryptoKey}
      onLock={handleLock}
      onUpdate={handleUpdate}
    />
  )
}
