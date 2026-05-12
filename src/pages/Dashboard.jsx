import { useState, useRef, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  Wallet, CheckSquare, CreditCard, GraduationCap, MapPin, Gamepad2,
  TrendingDown, ArrowRight, BarChart2, Target, ImageIcon, X, Plus,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { DonutChart, SparkArea, RingCard, TC } from '../components/charts/Charts'

const COLORS = {
  cyan:   { icon: '0,200,255',   var: 'var(--accent)' },
  green:  { icon: '16,185,129',  var: 'var(--success)' },
  yellow: { icon: '245,158,11',  var: 'var(--warning)' },
  red:    { icon: '239,68,68',   var: 'var(--danger)' },
  purple: { icon: '124,58,237',  var: '#a78bfa' },
  blue:   { icon: '99,102,241',  var: 'var(--info)' },
}

function StatCard({ icon: Icon, label, value, sub, color = 'cyan', to, badge }) {
  const c = COLORS[color] || COLORS.cyan
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div className="stat-card" style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: `rgba(${c.icon}, 0.12)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid rgba(${c.icon}, 0.2)`,
          }}>
            <Icon size={16} color={c.var} />
          </div>
          {badge !== undefined && (
            <span className="badge badge-muted">{badge}</span>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</div>
            {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
          </div>
          <ArrowRight size={13} color="var(--text-muted)" />
        </div>
      </div>
    </Link>
  )
}

function QuickTask() {
  const [tasks, setTasks] = useLocalStorage('mk-tasks', [])
  const [text, setText] = useState('')

  const add = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    setTasks(prev => [{
      id: Date.now(),
      text: trimmed,
      done: false,
      priority: 'medium',
      createdAt: new Date().toISOString(),
    }, ...prev])
    setText('')
  }

  const open = tasks.filter(t => !t.done)

  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <CheckSquare size={14} color="var(--accent)" />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Quick Add Task</span>
        <span className="badge badge-accent">{open.length} open</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          placeholder="What needs to be done?"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <button className="btn btn-primary" onClick={add} style={{ whiteSpace: 'nowrap' }}>
          Add
        </button>
      </div>
      {open.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {open.slice(0, 4).map(t => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', background: 'var(--bg-elevated)',
              borderRadius: 6, border: '1px solid var(--border)',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{t.text}</span>
            </div>
          ))}
          {open.length > 4 && (
            <Link to="/tasks" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textDecoration: 'none', paddingLeft: 4 }}>
              +{open.length - 4} more → go to Tasks
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Today's Focus card ─────────────────────────────────────────────────── */
function FocusCard() {
  const [focus, setFocus] = useLocalStorage('mk-daily-focus', '')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const textareaRef = useRef(null)

  const startEdit = () => {
    setDraft(focus)
    setEditing(true)
  }

  const save = () => {
    setFocus(draft.trim())
    setEditing(false)
  }

  useEffect(() => {
    if (editing) textareaRef.current?.focus()
  }, [editing])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div
      className="card focus-card"
      onClick={!editing ? startEdit : undefined}
      style={{
        cursor: editing ? 'default' : 'pointer',
        display: 'flex', flexDirection: 'column',
        minHeight: 170, position: 'relative', overflow: 'hidden',
      }}
    >
      {/* gradient top border */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Target size={13} color="var(--accent)" strokeWidth={2} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase',
        }}>
          Today's Focus
        </span>
      </div>

      {editing ? (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save() }
            if (e.key === 'Escape') setEditing(false)
          }}
          onBlur={save}
          placeholder="What's your main focus today?"
          rows={3}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
            fontStyle: 'italic', color: 'var(--text-primary)', resize: 'none',
            lineHeight: 1.45, padding: 0, width: '100%',
          }}
        />
      ) : (
        <div style={{
          flex: 1,
          fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
          fontStyle: 'italic', lineHeight: 1.45,
          color: focus ? 'var(--text-primary)' : 'var(--text-muted)',
        }}>
          {focus || 'Set your intention for today...'}
        </div>
      )}

      <div style={{
        marginTop: 'auto', paddingTop: 14,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid var(--border)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{today}</span>
        {!editing && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--text-muted)', opacity: 0.5,
          }}>
            click to edit
          </span>
        )}
      </div>
    </div>
  )
}

/* ── Vibe Board ─────────────────────────────────────────────────────────── */
function VibeBoard() {
  const [images, setImages] = useLocalStorage('mk-vibe-board', [])
  const [showAdd, setShowAdd] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')
  const [captionDraft, setCaptionDraft] = useState('')
  const urlRef = useRef(null)

  useEffect(() => {
    if (showAdd) urlRef.current?.focus()
  }, [showAdd])

  const addImage = () => {
    const url = urlDraft.trim()
    if (!url) return
    setImages(prev => [...prev, { id: Date.now(), url, caption: captionDraft.trim() }])
    setUrlDraft('')
    setCaptionDraft('')
    setShowAdd(false)
  }

  const removeImage = (id, e) => {
    e.stopPropagation()
    setImages(prev => prev.filter(img => img.id !== id))
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ImageIcon size={14} color="var(--accent)" strokeWidth={1.8} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
            Vibe Board
          </span>
          {images.length > 0 && (
            <span className="badge badge-muted">{images.length}</span>
          )}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowAdd(s => !s)}
        >
          {showAdd ? 'Cancel' : <><Plus size={11} style={{ display: 'inline', marginRight: 4 }} />Add</>}
        </button>
      </div>

      {showAdd && (
        <div style={{
          marginBottom: 12, padding: '10px 12px',
          background: 'var(--bg-elevated)', borderRadius: 8,
          border: '1px solid var(--border)',
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          <input
            ref={urlRef}
            className="input"
            placeholder="Paste image URL..."
            value={urlDraft}
            onChange={e => setUrlDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addImage()}
            style={{ flex: 2, minWidth: 180 }}
          />
          <input
            className="input"
            placeholder="Caption (optional)"
            value={captionDraft}
            onChange={e => setCaptionDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addImage()}
            style={{ flex: 1, minWidth: 120 }}
          />
          <button className="btn btn-primary btn-sm" onClick={addImage}>
            Add
          </button>
        </div>
      )}

      {images.length === 0 ? (
        <div
          className="vibe-empty"
          onClick={() => setShowAdd(true)}
        >
          <ImageIcon size={26} strokeWidth={1.2} style={{ opacity: 0.35 }} />
          <span>Add images to build your vibe board</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', opacity: 0.6 }}>
            paste any image URL
          </span>
        </div>
      ) : (
        <div className="vibe-grid">
          {images.map(img => (
            <div key={img.id} className="vibe-tile">
              <img
                src={img.url}
                alt={img.caption || ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
              />
              <div className="vibe-error-fallback" style={{ display: 'none', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', flexDirection: 'column', gap: 4 }}>
                <ImageIcon size={18} style={{ opacity: 0.3 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', opacity: 0.5 }}>failed</span>
              </div>
              <div className="vibe-overlay">
                {img.caption && (
                  <span className="vibe-caption">{img.caption}</span>
                )}
                <button
                  className="vibe-remove"
                  onClick={e => removeImage(img.id, e)}
                  title="Remove"
                >
                  <X size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Dashboard ──────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [tasks] = useLocalStorage('mk-tasks', [])
  const [expenses] = useLocalStorage('mk-expenses', [])
  const [subs] = useLocalStorage('mk-subscriptions', [])
  const [certs] = useLocalStorage('mk-certs', [])
  const [places] = useLocalStorage('mk-places', [])
  const [lists] = useLocalStorage('mk-lists', { games: [], anime: [], movies: [] })
  const [settings] = useLocalStorage('mk-settings', { allowance: 150, currency: 'JOD' })
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const ALLOWANCE = Number(settings.allowance) || 150
  const now = time
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const spent = expenses
    .filter(e => e.date?.startsWith(thisMonth))
    .reduce((s, e) => s + Number(e.amount || 0), 0)
  const remaining = ALLOWANCE - spent

  const openTasks = tasks.filter(t => !t.done).length
  const totalSubs = subs.reduce((s, sub) => s + Number(sub.amount || 0), 0)
  const inProgressCerts = certs.filter(c => c.status === 'in-progress').length
  const wantToVisit = places.filter(p => !p.visited).length
  const totalMedia = (lists.games?.length || 0) + (lists.anime?.length || 0) + (lists.movies?.length || 0)

  const budgetColor = remaining < 30 ? 'red' : remaining < 70 ? 'yellow' : 'green'
  const budgetBarColor = remaining < 30
    ? 'linear-gradient(90deg, #ef4444, #f87171)'
    : remaining < 70
    ? 'linear-gradient(90deg, #d97706, #f59e0b)'
    : 'linear-gradient(90deg, var(--accent-dim), var(--accent))'
  const budgetHex = remaining < 30 ? TC.danger : remaining < 70 ? TC.warning : TC.accent

  const todayDay = now.getDate()
  const dailySpending = Array.from({ length: todayDay }, (_, i) => {
    const d = String(i + 1).padStart(2, '0')
    return expenses
      .filter(e => e.date === `${thisMonth}-${d}`)
      .reduce((s, e) => s + Number(e.amount || 0), 0)
  })

  const doneTasks  = tasks.filter(t => t.done).length
  const certsDone  = certs.filter(c => c.status === 'done').length
  const certsPct   = certs.length ? Math.round((certsDone / certs.length) * 100) : 0
  const budgetPctUsed = Math.min(100, spent > 0 ? (spent / ALLOWANCE) * 100 : 0)

  const greet = () => {
    const h = now.getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })

  return (
    <div className="page">
      {/* ── Header ── */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            {greet()},{' '}
            <em style={{ color: 'var(--accent)', fontStyle: 'italic', textShadow: '0 2px 20px rgba(2,132,199,0.25)' }}>Mohammad</em>
            <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 28 }}>👋</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
            Here's your system status for today.
          </p>
        </div>

        {/* Live clock */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600,
          color: 'var(--text-primary)', letterSpacing: '0.04em',
          lineHeight: 1, textAlign: 'right', flexShrink: 0,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 16px',
          boxShadow: '0 0 0 1px rgba(2,132,199,0.06)',
        }}>
          {timeStr}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 4, textAlign: 'center' }}>
            LOCAL TIME
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <StatCard icon={Wallet} to="/finance" label="Remaining Budget"
          value={`${remaining.toFixed(0)} JOD`} sub={`${spent.toFixed(2)} JOD spent this month`} color={budgetColor} />
        <StatCard icon={CheckSquare} to="/tasks" label="Open Tasks"
          value={openTasks} sub={`${tasks.filter(t => t.done).length} completed`} color="cyan" />
        <StatCard icon={CreditCard} to="/subscriptions" label="Monthly Subs"
          value={`${totalSubs.toFixed(2)} JOD`} sub={`${subs.length} active subscriptions`} color="yellow" />
        <StatCard icon={GraduationCap} to="/certs" label="Certifications"
          value={inProgressCerts} sub="in progress" badge={`${certs.filter(c => c.status === 'done').length} done`} color="blue" />
        <StatCard icon={MapPin} to="/places" label="Places to Visit"
          value={wantToVisit} sub={`${places.filter(p => p.visited).length} already visited`} color="purple" />
        <StatCard icon={Gamepad2} to="/lists" label="In My Lists"
          value={totalMedia} sub="games + anime + movies" color="green" />
      </div>

      {/* ── Insights row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 188px 188px', gap: 12, marginBottom: 16 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <BarChart2 size={13} color="var(--accent)" />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                Spending Trend
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
              {now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>
          <SparkArea data={dailySpending} color={budgetHex} height={60} />
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
              {dailySpending.filter(v => v > 0).length} days with expenses
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
              {spent.toFixed(2)} JOD
            </span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>Budget</span>
          <RingCard
            segments={[
              { value: spent,                  color: budgetHex },
              { value: Math.max(0, remaining), color: TC.track  },
            ]}
            size={92}
            thickness={12}
            value={`${budgetPctUsed.toFixed(0)}%`}
            sublabel="used"
          />
          <div style={{ textAlign: 'center', lineHeight: 1.5 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: budgetHex }}>
              {remaining.toFixed(0)} JOD left
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
              of {ALLOWANCE} JOD allowance
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>Goals</span>
          <div style={{ display: 'flex', justifyContent: 'space-around', flex: 1, alignItems: 'center' }}>
            <RingCard
              segments={[
                { value: doneTasks, color: TC.success },
                { value: openTasks, color: TC.accent  },
              ]}
              size={70}
              thickness={8}
              value={tasks.length ? `${Math.round((doneTasks / tasks.length) * 100)}%` : '—'}
              label="Tasks"
            />
            <RingCard
              segments={[
                { value: certsDone,                                             color: TC.success },
                { value: certs.filter(c => c.status === 'in-progress').length, color: TC.accent  },
                { value: certs.filter(c => c.status === 'not-started').length, color: TC.track   },
              ]}
              size={70}
              thickness={8}
              value={`${certsPct}%`}
              label="Certs"
            />
          </div>
        </div>
      </div>

      {/* ── Personal row: Focus + Vibe Board ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12, marginBottom: 16 }}>
        <FocusCard />
        <VibeBoard />
      </div>

      {/* ── Bottom row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <QuickTask />

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingDown size={14} color="var(--warning)" />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                Budget
              </span>
            </div>
            <Link to="/finance" style={{ textDecoration: 'none' }}>
              <button className="btn btn-ghost btn-sm">Details</button>
            </Link>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>
              {remaining.toFixed(0)} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>JOD left</span>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', alignSelf: 'flex-end' }}>
              of {ALLOWANCE} JOD
            </span>
          </div>

          <div className="progress-bar" style={{ marginBottom: 10 }}>
            <div className="progress-fill" style={{ width: `${Math.min(100, (spent / ALLOWANCE) * 100)}%`, background: budgetBarColor }} />
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
            {((spent / ALLOWANCE) * 100).toFixed(0)}% spent this month · subs cost {totalSubs.toFixed(2)} JOD/mo
          </div>
        </div>
      </div>
    </div>
  )
}
