import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { Gamepad2, Tv, Film, Plus, Trash2, Star, Search, X } from 'lucide-react'
import { StatBar } from '../components/charts/Charts'

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'games',  label: 'Games',          Icon: Gamepad2, noun: 'Game',  color: '0,200,255' },
  { id: 'anime',  label: 'Anime',           Icon: Tv,       noun: 'Anime', color: '124,58,237' },
  { id: 'movies', label: 'Movies & Series', Icon: Film,     noun: 'Movie', color: '245,158,11' },
]

const STATUSES = [
  { value: 'all',       label: 'All' },
  { value: 'want',      label: 'Want' },
  { value: 'active',    label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped',   label: 'Dropped' },
]

const STATUS_META = {
  want:      { badge: 'badge-muted',    dot: '#4a5578', label: 'Want' },
  active:    { badge: 'badge-accent',   dot: 'var(--accent)', label: 'In Progress', pulse: true },
  completed: { badge: 'badge-success',  dot: 'var(--success)', label: 'Completed' },
  dropped:   { badge: 'badge-danger',   dot: 'var(--danger)', label: 'Dropped' },
}

const EMPTY_MESSAGES = {
  games:  { title: 'No games here yet', sub: 'Add games you want to play, are grinding, or have conquered.' },
  anime:  { title: 'Your watchlist is empty', sub: 'Start tracking anime you want to binge or have already finished.' },
  movies: { title: 'No movies or series logged', sub: 'Add films and shows you want to watch or have already seen.' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusKey(raw) {
  if (raw === 'playing' || raw === 'watching' || raw === 'playing/watching') return 'active'
  return raw
}

function normalizeItem(item) {
  return { ...item, _status: getStatusKey(item.status) }
}

function avgRating(items) {
  const rated = items.filter(i => i.rating > 0)
  if (!rated.length) return null
  return (rated.reduce((s, i) => s + i.rating, 0) / rated.length).toFixed(1)
}

function StarRating({ rating }) {
  if (!rating || rating === 0) {
    return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>Unrated</span>
  }
  const full  = Math.round(rating / 2)   // out of 5 visual stars → represent /10
  const empty = 5 - full
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: full  }).map((_, i) => <Star key={`f${i}`} size={10} fill="var(--warning)" color="var(--warning)" />)}
      {Array.from({ length: empty }).map((_, i) => <Star key={`e${i}`} size={10} fill="transparent" color="var(--text-muted)" />)}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginLeft: 3 }}>{rating}/10</span>
    </span>
  )
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function ItemCard({ item, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const norm    = normalizeItem(item)
  const meta    = STATUS_META[norm._status] || STATUS_META.want
  const preview = item.note?.trim()?.slice(0, 60) + (item.note?.length > 60 ? '…' : '')

  return (
    <div
      className="card"
      style={{ position: 'relative', cursor: 'pointer', padding: '16px 18px' }}
      onClick={() => onEdit(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Delete button */}
      <button
        className="btn-icon"
        style={{
          position: 'absolute', top: 10, right: 10,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s ease',
          border: '1px solid rgba(239,68,68,0.3)',
          color: 'var(--danger)',
          padding: '4px',
        }}
        onClick={e => { e.stopPropagation(); onDelete(item.id) }}
        title="Remove"
      >
        <Trash2 size={12} />
      </button>

      {/* Title */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 14,
        color: 'var(--text-primary)',
        marginBottom: 8,
        paddingRight: 24,
        lineHeight: 1.3,
      }}>
        {item.title}
      </div>

      {/* Status badge */}
      <div style={{ marginBottom: 8 }}>
        <span className={`badge ${meta.badge}`}>
          <span style={{
            display: 'inline-block',
            width: 5, height: 5,
            borderRadius: '50%',
            background: meta.dot,
            marginRight: 5,
            flexShrink: 0,
            ...(meta.pulse ? { animation: 'pulseGlow 2s ease-in-out infinite' } : {}),
          }} />
          {meta.label}
        </span>
      </div>

      {/* Rating */}
      <div style={{ marginBottom: item.note ? 6 : 0 }}>
        <StarRating rating={item.rating} />
      </div>

      {/* Note preview */}
      {preview && (
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          marginTop: 4,
        }}>
          {preview}
        </div>
      )}
    </div>
  )
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

function StatsRow({ items }) {
  const total     = items.length
  const completed = items.filter(i => getStatusKey(i.status) === 'completed').length
  const want      = items.filter(i => getStatusKey(i.status) === 'want').length
  const avg       = avgRating(items)

  const stat = (label, value, accent) => (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 2,
      padding: '10px 16px',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      minWidth: 80,
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 18,
        fontWeight: 700,
        color: accent || 'var(--text-primary)',
        lineHeight: 1,
      }}>{value}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
      {stat('Total', total)}
      {stat('Completed', completed, 'var(--success)')}
      {stat('Want', want, 'var(--text-secondary)')}
      {stat('Avg Rating', avg !== null ? `${avg}/10` : '—', 'var(--warning)')}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

const EMPTY_FORM = { title: '', status: 'want', rating: 0, note: '' }

function ItemModal({ open, onClose, onSave, onDelete, editing, tabNoun, tabId }) {
  const [form, setForm] = useState(EMPTY_FORM)

  // Sync form when modal opens
  useState(() => {
    if (open) {
      setForm(editing
        ? { title: editing.title, status: editing.status, rating: editing.rating, note: editing.note || '' }
        : EMPTY_FORM
      )
    }
  })

  if (!open) return null

  // Re-init on open (controlled via key in parent)
  const statusOptions = tabId === 'games'
    ? [
        { value: 'want',           label: 'Want to Play' },
        { value: 'playing/watching', label: 'Playing' },
        { value: 'completed',      label: 'Completed' },
        { value: 'dropped',        label: 'Dropped' },
      ]
    : [
        { value: 'want',           label: 'Want to Watch' },
        { value: 'playing/watching', label: 'Watching' },
        { value: 'completed',      label: 'Completed' },
        { value: 'dropped',        label: 'Dropped' },
      ]

  const handleSave = () => {
    if (!form.title.trim()) return
    onSave({ ...form, title: form.title.trim(), rating: Number(form.rating) })
  }

  const field = (label, children) => (
    <div style={{ marginBottom: 14 }}>
      <div className="label" style={{ marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="modal-title" style={{ margin: 0 }}>
            {editing ? `Edit ${tabNoun}` : `Add ${tabNoun}`}
          </h2>
          <button className="btn-icon" onClick={onClose}><X size={14} /></button>
        </div>

        {field('Title',
          <input
            className="input"
            placeholder={`${tabNoun} title…`}
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        )}

        {field('Status',
          <select
            className="select"
            value={form.status}
            onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
          >
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}

        {field('Rating (0 = unrated)',
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range"
              min={0} max={10} step={1}
              value={form.rating}
              onChange={e => setForm(p => ({ ...p, rating: Number(e.target.value) }))}
              style={{ flex: 1, accentColor: 'var(--accent)' }}
            />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600,
              color: form.rating > 0 ? 'var(--warning)' : 'var(--text-muted)',
              minWidth: 32, textAlign: 'right',
            }}>
              {form.rating > 0 ? `${form.rating}/10` : '—'}
            </span>
          </div>
        )}

        {field('Note (optional)',
          <textarea
            className="input"
            placeholder="Any thoughts, where you left off, etc."
            value={form.note}
            onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
            style={{ minHeight: 72 }}
          />
        )}

        <div className="modal-actions">
          {editing && (
            <button
              className="btn btn-danger btn-sm"
              style={{ marginRight: 'auto' }}
              onClick={() => onDelete(editing.id)}
            >
              <Trash2 size={12} /> Remove
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!form.title.trim()}>
            {editing ? 'Save Changes' : `Add ${tabNoun}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Lists() {
  const [lists, setLists] = useLocalStorage('mk-lists', { games: [], anime: [], movies: [] })

  const [activeTab,    setActiveTab]    = useState('games')
  const [searchQuery,  setSearchQuery]  = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen,    setModalOpen]    = useState(false)
  const [modalKey,     setModalKey]     = useState(0)
  const [editing,      setEditing]      = useState(null)  // item being edited, or null for add

  const tab     = TABS.find(t => t.id === activeTab)
  const rawList = lists[activeTab] || []

  // ── Filtering ──
  const filtered = rawList.filter(item => {
    const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase())
    const norm          = getStatusKey(item.status)
    const matchesStatus = statusFilter === 'all' || norm === statusFilter
    return matchesSearch && matchesStatus
  })

  // ── CRUD helpers ──
  const updateList = (tabId, updater) =>
    setLists(prev => ({ ...prev, [tabId]: updater(prev[tabId] || []) }))

  const openAdd = () => {
    setEditing(null)
    setModalKey(k => k + 1)
    setModalOpen(true)
  }

  const openEdit = item => {
    setEditing(item)
    setModalKey(k => k + 1)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const handleSave = (formData) => {
    if (editing) {
      updateList(activeTab, prev =>
        prev.map(i => i.id === editing.id ? { ...i, ...formData } : i)
      )
    } else {
      const newItem = {
        id:      Date.now(),
        addedAt: new Date().toISOString(),
        ...formData,
      }
      updateList(activeTab, prev => [newItem, ...prev])
    }
    closeModal()
  }

  const handleDelete = (id) => {
    updateList(activeTab, prev => prev.filter(i => i.id !== id))
    closeModal()
  }

  const switchTab = (tabId) => {
    setActiveTab(tabId)
    setSearchQuery('')
    setStatusFilter('all')
  }

  const empty = EMPTY_MESSAGES[activeTab]

  return (
    <div className="page">
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <div className="label" style={{ marginBottom: 4 }}>Entertainment</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26, fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}>
            My Lists
          </h1>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={14} />
          Add {tab.noun}
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex', gap: 4,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 8, padding: 4,
        marginBottom: 20,
        width: 'fit-content',
      }}>
        {TABS.map(t => {
          const count   = (lists[t.id] || []).length
          const isActive = t.id === activeTab
          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '7px 14px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: 13, fontWeight: 600,
                transition: 'all 0.15s ease',
                background: isActive ? `rgba(${t.color}, 0.12)` : 'transparent',
                color: isActive ? `rgb(${t.color})` : 'var(--text-secondary)',
                boxShadow: isActive ? `inset 0 0 0 1px rgba(${t.color}, 0.25)` : 'none',
              }}
            >
              <t.Icon size={13} />
              {t.label}
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 999,
                background: isActive ? `rgba(${t.color}, 0.18)` : 'var(--bg-elevated)',
                color: isActive ? `rgb(${t.color})` : 'var(--text-muted)',
                border: isActive ? `1px solid rgba(${t.color}, 0.25)` : '1px solid var(--border)',
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Search + filter row ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            placeholder={`Search ${tab.label.toLowerCase()}…`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 30 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <button
              key={s.value}
              className={`chip ${statusFilter === s.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats mini row ── */}
      {rawList.length > 0 && <StatsRow items={rawList} />}

      {/* ── Status distribution ── */}
      {rawList.length > 0 && (() => {
        const statusMap = {
          completed: { label: 'Completed', badgeClass: 'badge-success', color: 'var(--success)' },
          active:    { label: 'In Progress', badgeClass: 'badge-accent',  color: 'var(--accent)'  },
          want:      { label: 'Want',        badgeClass: 'badge-muted',   color: 'var(--text-muted)' },
          dropped:   { label: 'Dropped',     badgeClass: 'badge-danger',  color: 'var(--danger)'  },
        }
        const entries = Object.entries(statusMap).map(([key, cfg]) => ({
          ...cfg,
          count: rawList.filter(i => getStatusKey(i.status) === key).length,
        })).filter(e => e.count > 0)

        if (entries.length === 0) return null
        return (
          <div className="card" style={{ marginBottom: 20 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: 'var(--text-muted)', display: 'block', marginBottom: 12,
            }}>
              Status Distribution · {rawList.length} total
            </span>
            {entries.map(e => (
              <StatBar
                key={e.label}
                label={e.label}
                value={e.count}
                total={rawList.length}
                color={e.color}
                badgeClass={e.badgeClass}
              />
            ))}
          </div>
        )
      })()}

      {/* ── List grid or empty state ── */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <tab.Icon size={40} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {searchQuery || statusFilter !== 'all' ? 'No matches found' : empty.title}
          </div>
          <div style={{ fontSize: 13, maxWidth: 300 }}>
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter.'
              : empty.sub}
          </div>
          {!searchQuery && statusFilter === 'all' && (
            <button className="btn btn-ghost" style={{ marginTop: 4 }} onClick={openAdd}>
              <Plus size={13} /> Add your first {tab.noun.toLowerCase()}
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
        }}>
          {filtered.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      <ItemModal
        key={modalKey}
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
        editing={editing}
        tabNoun={tab.noun}
        tabId={activeTab}
      />
    </div>
  )
}
