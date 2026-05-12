import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { Mail, RefreshCw, Settings, AlertCircle } from 'lucide-react'

function relTime(date) {
  const diff = (Date.now() - date) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.round(diff / 60)}m`
  if (diff < 86400) return `${Math.round(diff / 3600)}h`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function parseFrom(raw = '') {
  const match = raw.match(/^"?([^"<]+)"?\s*</)
  return match ? match[1].trim() : raw.split('@')[0]
}

export default function EmailsBox() {
  const [clientId, setClientId] = useLocalStorage('mk-gmail-client-id', '')
  const [token, setToken]       = useLocalStorage('mk-gmail-token', '')
  const [expiry, setExpiry]     = useLocalStorage('mk-gmail-token-expiry', 0)
  const [emails, setEmails]     = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showSetup, setShowSetup] = useState(false)
  const [draft, setDraft]       = useState('')
  const tokenClientRef          = useRef(null)

  const isValid = token && Date.now() < Number(expiry)

  const fetchEmails = useCallback(async (accessToken) => {
    setLoading(true)
    setError('')
    try {
      const listRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&labelIds=INBOX',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (listRes.status === 401) throw new Error('expired')
      const listData = await listRes.json()
      if (!listData.messages?.length) { setEmails([]); return }

      const details = await Promise.all(
        listData.messages.map(m =>
          fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From,Subject,Date`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          ).then(r => r.json())
        )
      )

      const parsed = details.map(msg => {
        const h   = msg.payload?.headers || []
        const get = n => h.find(x => x.name.toLowerCase() === n)?.value || ''
        return {
          id:      msg.id,
          from:    parseFrom(get('from')),
          subject: get('subject') || '(no subject)',
          date:    new Date(get('date')),
          snippet: msg.snippet || '',
          unread:  msg.labelIds?.includes('UNREAD') ?? false,
        }
      }).sort((a, b) => b.date - a.date)

      setEmails(parsed)
    } catch (e) {
      setError(e.message === 'expired' ? 'Session expired — reconnect to refresh' : 'Failed to load inbox')
    } finally {
      setLoading(false)
    }
  }, [])

  const initClient = useCallback(() => {
    if (!window.google?.accounts?.oauth2 || !clientId) return
    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      callback: async (resp) => {
        if (!resp.access_token) return
        setToken(resp.access_token)
        setExpiry(Date.now() + (Number(resp.expires_in) - 60) * 1000)
        await fetchEmails(resp.access_token)
      },
    })
  }, [clientId, fetchEmails, setToken, setExpiry])

  useEffect(() => {
    if (!clientId) return
    if (window.google?.accounts?.oauth2) { initClient(); return }
    if (document.getElementById('gis-script')) return
    const s = document.createElement('script')
    s.id = 'gis-script'
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => initClient()
    document.head.appendChild(s)
  }, [clientId, initClient])

  useEffect(() => {
    if (isValid && emails.length === 0) fetchEmails(token)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const connect = () => {
    if (!tokenClientRef.current) initClient()
    setTimeout(() => tokenClientRef.current?.requestAccessToken(), 50)
  }

  const refresh = () => {
    if (isValid) fetchEmails(token)
    else connect()
  }

  const saveClientId = () => {
    const id = draft.trim()
    if (!id) return
    setClientId(id)
    setDraft('')
    setShowSetup(false)
  }

  const unreadCount = emails.filter(e => e.unread).length

  if (!clientId || showSetup) {
    return (
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Mail size={14} color="var(--accent)" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
            Emails
          </span>
        </div>
        <div style={{ padding: '16px', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.6 }}>
            Connect Gmail to see your inbox here. You need a Google OAuth Client ID.
          </p>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
            lineHeight: 1.8, marginBottom: 14,
            padding: '10px 12px', background: 'var(--bg-elevated)',
            borderRadius: 6, border: '1px solid var(--border)',
          }}>
            1. console.cloud.google.com → New Project<br/>
            2. APIs &amp; Services → Library → Enable "Gmail API"<br/>
            3. APIs &amp; Services → Credentials → Create → OAuth 2.0 Client ID<br/>
            4. Application type: Web application<br/>
            5. Authorized JS origins: add your Vercel URL (and http://localhost:5173)<br/>
            6. Copy the Client ID (ends in .apps.googleusercontent.com)
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              placeholder="xxxxxxxxxxxx.apps.googleusercontent.com"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveClientId()}
              autoFocus
              style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 11 }}
            />
            <button className="btn btn-primary btn-sm" onClick={saveClientId}>Save</button>
            {showSetup && clientId && (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowSetup(false)}>Cancel</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mail size={14} color="var(--accent)" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
            Emails
          </span>
          {unreadCount > 0 && (
            <span className="badge badge-accent">{unreadCount} unread</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={refresh}
            disabled={loading}
            title="Refresh inbox"
          >
            <RefreshCw size={11} style={{ animation: loading ? 'spin 0.9s linear infinite' : 'none' }} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowSetup(true)}
            title="Gmail settings"
          >
            <Settings size={11} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          marginBottom: 12, padding: '8px 12px',
          background: 'rgba(220,38,38,0.07)', borderRadius: 6,
          border: '1px solid rgba(220,38,38,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <AlertCircle size={12} color="var(--danger)" />
            <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={connect} style={{ fontSize: 11, color: 'var(--accent)' }}>
            Reconnect
          </button>
        </div>
      )}

      {/* Connect prompt */}
      {!isValid && !error && emails.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(2,132,199,0.08)', border: '1px solid rgba(2,132,199,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <Mail size={20} color="var(--accent)" strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Authorize to load your inbox
          </div>
          <button className="btn btn-primary btn-sm" onClick={connect}>
            Connect Gmail
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && emails.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '28px 0',
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-muted)', letterSpacing: '0.1em',
        }}>
          LOADING INBOX…
        </div>
      )}

      {/* Email list */}
      {emails.length > 0 && (
        <div className="emails-list">
          {emails.map(email => (
            <a
              key={email.id}
              href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`email-item${email.unread ? ' unread' : ''}`}
            >
              {email.unread && <div className="email-unread-dot" />}
              <div className="email-meta">
                <span className="email-from">{email.from}</span>
                <span className="email-time">{relTime(email.date)}</span>
              </div>
              <div className="email-subject">{email.subject}</div>
              <div className="email-snippet">{email.snippet}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
