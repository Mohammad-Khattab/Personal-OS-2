import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  CreditCard, Plus, X, Pencil, Trash2, ToggleLeft, ToggleRight,
  TrendingUp, Layers, ChevronDown, ChevronUp,
} from 'lucide-react'
import { DonutChart, TC } from '../components/charts/Charts'

// hex values for SVG strokes (CSS vars don't work inside SVG attributes)
const CAT_HEX = {
  streaming:    '#a78bfa',
  gaming:       '#059669',
  productivity: '#0284c7',
  cloud:        '#d97706',
  other:        '#7898c4',
}

const EMPTY_FORM = {
  name: '', amount: '', currency: 'JOD', billingDay: '', category: 'other', active: true, note: '',
}

const CATEGORY_CONFIG = {
  streaming:    { label: 'Streaming',    badgeClass: 'badge badge-purple', color: '#a78bfa' },
  gaming:       { label: 'Gaming',       badgeClass: 'badge badge-success', color: 'var(--success)' },
  productivity: { label: 'Productivity', badgeClass: 'badge badge-accent',  color: 'var(--accent)' },
  cloud:        { label: 'Cloud',        badgeClass: 'badge badge-warning',  color: 'var(--warning)' },
  other:        { label: 'Other',        badgeClass: 'badge badge-muted',   color: 'var(--text-muted)' },
}

const ORDINAL = n => {
  const s = ['th','st','nd','rd'], v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function FormField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span className="label">{label}</span>
      {children}
    </div>
  )
}

function SubModal({ sub, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(sub ? { ...sub, amount: String(sub.amount), billingDay: String(sub.billingDay) } : { ...EMPTY_FORM })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim() || !form.amount) return
    onSave({
      ...form,
      id: form.id || Date.now(),
      amount: Number(form.amount),
      billingDay: Number(form.billingDay) || 1,
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="modal-title" style={{ margin: 0 }}>{sub ? 'Edit Subscription' : 'Add Subscription'}</div>
          <button className="btn-icon" onClick={onClose}><X size={15} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Service Name">
            <input className="input" placeholder="e.g. Netflix, Spotify" value={form.name} onChange={e => set('name', e.target.value)} />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Monthly Amount">
              <input className="input" type="number" min={0} step={0.01} placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
            </FormField>
            <FormField label="Currency">
              <select className="select" value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option value="JOD">JOD</option>
                <option value="USD">USD</option>
              </select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Billing Day (1–31)">
              <input className="input" type="number" min={1} max={31} placeholder="e.g. 15" value={form.billingDay} onChange={e => set('billingDay', e.target.value)} />
            </FormField>
            <FormField label="Category">
              <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
                {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Status">
            <div style={{ display: 'flex', gap: 8 }}>
              {[true, false].map(val => (
                <button
                  key={String(val)}
                  onClick={() => set('active', val)}
                  className={`btn ${form.active === val ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {val ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Note">
            <textarea className="input" placeholder="Optional notes..." value={form.note} onChange={e => set('note', e.target.value)} style={{ minHeight: 64 }} />
          </FormField>
        </div>

        <div className="modal-actions">
          {sub && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(sub.id)} style={{ marginRight: 'auto' }}>
              <Trash2 size={12} /> Delete
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {sub ? 'Save Changes' : 'Add Subscription'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SubRow({ sub, onEdit, onToggle, onDelete }) {
  const catCfg = CATEGORY_CONFIG[sub.category] || CATEGORY_CONFIG.other
  const isInactive = !sub.active

  return (
    <div
      className="card"
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
        opacity: isInactive ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontWeight: 700, fontSize: 14, color: 'var(--text-primary)',
            textDecoration: isInactive ? 'line-through' : 'none',
            textDecorationColor: 'var(--text-muted)',
          }}>
            {sub.name}
          </span>
          <span className={catCfg.badgeClass}>{catCfg.label}</span>
          {!sub.active && <span className="badge badge-danger">Inactive</span>}
        </div>
        <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {sub.billingDay ? (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
              Bills on the {ORDINAL(sub.billingDay)}
            </span>
          ) : null}
          {sub.note && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{sub.note}</span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
          {Number(sub.amount).toFixed(2)}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          {sub.currency}/mo
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button
          className="btn-icon"
          onClick={() => onToggle(sub.id)}
          title={sub.active ? 'Deactivate' : 'Activate'}
          style={{ color: sub.active ? 'var(--success)' : 'var(--text-muted)' }}
        >
          {sub.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
        </button>
        <button className="btn-icon" onClick={() => onEdit(sub)} title="Edit">
          <Pencil size={13} />
        </button>
        <button
          className="btn-icon"
          onClick={() => onDelete(sub.id)}
          title="Delete"
          style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export default function Subscriptions() {
  const [subs, setSubs] = useLocalStorage('mk-subscriptions', [])
  const [modal, setModal] = useState(null)
  const [sortAsc, setSortAsc] = useState(false)

  const activeSubs = subs.filter(s => s.active)
  const totalMonthly = activeSubs.reduce((acc, s) => acc + Number(s.amount || 0), 0)
  const activeCount = activeSubs.length

  // Category breakdown
  const byCategory = Object.keys(CATEGORY_CONFIG).reduce((acc, cat) => {
    const total = activeSubs
      .filter(s => s.category === cat)
      .reduce((s, sub) => s + Number(sub.amount || 0), 0)
    if (total > 0) acc[cat] = total
    return acc
  }, {})

  const mostExpensiveCat = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]

  // Sorted list
  const sorted = [...subs].sort((a, b) =>
    sortAsc ? Number(a.amount) - Number(b.amount) : Number(b.amount) - Number(a.amount)
  )

  const openAdd = () => setModal('add')
  const openEdit = (sub) => setModal(sub)
  const closeModal = () => setModal(null)

  const handleSave = (data) => {
    if (data.id && modal !== 'add') {
      setSubs(prev => prev.map(s => s.id === data.id ? data : s))
    } else {
      setSubs(prev => [...prev, { ...data, id: Date.now() }])
    }
    closeModal()
  }

  const handleDelete = (id) => {
    setSubs(prev => prev.filter(s => s.id !== id))
    if (modal && modal.id === id) closeModal()
  }

  const handleToggle = (id) => {
    setSubs(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="label" style={{ marginBottom: 5 }}>Monthly Costs</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            Subscriptions
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 5, fontSize: 13 }}>
            Track recurring services and costs
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={14} />
          Add Subscription
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          {
            label: 'Total / Month',
            value: `${totalMonthly.toFixed(2)} JOD`,
            sub: `${subs.filter(s => !s.active).length} inactive not counted`,
            color: 'var(--accent)',
            icon: CreditCard,
          },
          {
            label: 'Active Services',
            value: activeCount,
            sub: `${subs.length} total tracked`,
            color: 'var(--success)',
            icon: Layers,
          },
          {
            label: 'Biggest Category',
            value: mostExpensiveCat ? CATEGORY_CONFIG[mostExpensiveCat[0]].label : '—',
            sub: mostExpensiveCat ? `${mostExpensiveCat[1].toFixed(2)} JOD/mo` : 'No data yet',
            color: 'var(--warning)',
            icon: TrendingUp,
          },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <Icon size={13} color={color} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                {label}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Layers size={13} color="var(--text-muted)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
              Breakdown by Category
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 148px', gap: 20, alignItems: 'center' }}>
            {/* Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {Object.entries(byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, total]) => {
                  const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other
                  const pct = totalMonthly > 0 ? (total / totalMonthly) * 100 : 0
                  return (
                    <div key={cat} className="info-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <span className={cfg.badgeClass}>{cfg.label}</span>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${cfg.color}99, ${cfg.color})` }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', width: 36, textAlign: 'right' }}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginLeft: 16 }}>
                        {total.toFixed(2)} JOD
                      </span>
                    </div>
                  )
                })}
            </div>

            {/* Donut */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative', width: 110, height: 110 }}>
                <DonutChart
                  segments={Object.entries(byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, total]) => ({
                      value: total,
                      color: CAT_HEX[cat] || TC.muted,
                    }))}
                  size={110}
                  thickness={14}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {totalMonthly.toFixed(0)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                    JOD / mo
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                {Object.entries(byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat]) => (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: CAT_HEX[cat] || TC.muted, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                        {CATEGORY_CONFIG[cat]?.label || cat}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription list */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="section-title" style={{ fontSize: 15 }}>All Subscriptions</span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setSortAsc(p => !p)}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
        >
          {sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {sortAsc ? 'Low → High' : 'High → Low'}
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <CreditCard size={36} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>No subscriptions yet</div>
          <div style={{ fontSize: 12 }}>Add Netflix, Spotify, or any recurring cost</div>
          <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 4 }}>
            <Plus size={13} /> Add Subscription
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(sub => (
            <SubRow
              key={sub.id}
              sub={sub}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <SubModal
          sub={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={closeModal}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
