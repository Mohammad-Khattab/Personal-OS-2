import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, CheckSquare, FileText,
  Gamepad2, GraduationCap, CreditCard, Lock, MapPin, Zap,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage'

const NAV = [
  {
    section: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    section: 'Life',
    items: [
      { to: '/finance',   icon: Wallet,      label: 'Finance' },
      { to: '/tasks',     icon: CheckSquare, label: 'Tasks'   },
      { to: '/notes',     icon: FileText,    label: 'Notes'   },
      { to: '/places',    icon: MapPin,      label: 'Places'  },
    ],
  },
  {
    section: 'Collections',
    items: [
      { to: '/lists',         icon: Gamepad2,      label: 'Lists'          },
      { to: '/certs',         icon: GraduationCap, label: 'Certifications' },
      { to: '/subscriptions', icon: CreditCard,    label: 'Subscriptions'  },
    ],
  },
  {
    section: 'Security',
    items: [
      { to: '/passwords', icon: Lock, label: 'Passwords' },
    ],
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useLocalStorage('mk-sidebar-collapsed', false)

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div
        className="sidebar-logo"
        style={{
          padding: collapsed ? '16px 0' : '20px 20px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(2,132,199,0.4)',
          }}>
            <Zap size={16} color="#fff" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16,
                letterSpacing: '0.02em', color: 'var(--text-primary)', lineHeight: 1,
              }}>
                MKHUB
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 9,
                color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 2,
              }}>
                PERSONAL OS
              </div>
            </div>
          )}
        </div>

        {/* Collapse arrow — only shown when expanded */}
        {!collapsed && (
          <button
            className="btn-icon"
            style={{ width: 26, height: 26, padding: 0, flexShrink: 0 }}
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
          >
            <ChevronLeft size={13} />
          </button>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="sidebar-nav" style={{ padding: collapsed ? '10px 6px' : '12px 10px' }}>
        {NAV.map(({ section, items }, sectionIdx) => (
          <div key={section}>
            {/* Section heading — hidden when collapsed */}
            {!collapsed && <div className="nav-section-label">{section}</div>}

            {items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon size={15} className="nav-icon" strokeWidth={1.8} />
                {!collapsed && label}
                {/* Tooltip rendered as fixed element — escapes sidebar overflow */}
                {collapsed && <span className="nav-tooltip">{label}</span>}
              </NavLink>
            ))}

            {/* Thin divider between sections in collapsed mode */}
            {collapsed && sectionIdx < NAV.length - 1 && (
              <div style={{
                height: 1, background: 'var(--border)',
                margin: '6px 10px', opacity: 0.7,
              }} />
            )}
          </div>
        ))}
      </nav>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div style={{
        padding: collapsed ? '10px 0 12px' : '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: collapsed ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 8,
      }}>
        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--success)',
            boxShadow: '0 0 6px var(--success)',
            flexShrink: 0,
          }} className="animate-pulse-glow" />
          {!collapsed && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
              All systems online
            </span>
          )}
        </div>

        {/* Toggle button — always visible */}
        <button
          className="btn-icon"
          style={{ width: 26, height: 26, padding: 0 }}
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>
    </aside>
  )
}
