import { useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'

const TITLES = {
  '/dashboard': { label: 'Dashboard', sub: 'Your command center' },
  '/finance': { label: 'Finance', sub: 'Allowance & spending tracker' },
  '/tasks': { label: 'Tasks', sub: 'Get things done' },
  '/notes': { label: 'Notes', sub: 'Thoughts & ideas' },
  '/lists': { label: 'Lists', sub: 'Games · Anime · Movies' },
  '/certs': { label: 'Certifications', sub: 'Your learning roadmap' },
  '/subscriptions': { label: 'Subscriptions', sub: 'Monthly expenses' },
  '/passwords': { label: 'Password Vault', sub: 'Encrypted & secure' },
  '/places': { label: 'Places', sub: 'Places to visit' },
}

export default function TopBar() {
  const { pathname } = useLocation()
  const info = TITLES[pathname] || { label: 'MKHUB', sub: '' }
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <header className="topbar">
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
          {info.label}
        </span>
        {info.sub && (
          <span style={{ marginLeft: 10, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            / {info.sub}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-overlay)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '5px 10px',
        }}>
          <Search size={12} color="var(--text-muted)" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            Search...
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 3, padding: '1px 5px', color: 'var(--text-muted)'
          }}>
            /
          </span>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {timeStr}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            {dateStr}
          </div>
        </div>
      </div>
    </header>
  )
}
