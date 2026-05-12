import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  GraduationCap, Plus, CheckCircle, Circle, Loader, X, Pencil, ChevronRight,
  Calendar, DollarSign, StickyNote, Target,
} from 'lucide-react'
import { RadialRing, TC } from '../components/charts/Charts'

const DEFAULT_CERTS = [
  { id: 1, name: 'GitHub Foundations', provider: 'GitHub', status: 'not-started', progress: 0, startDate: '', targetDate: '', cost: 0, note: 'Phase 1' },
  { id: 2, name: 'AZ-900 Azure Fundamentals', provider: 'Microsoft', status: 'not-started', progress: 0, startDate: '', targetDate: '', cost: 0, note: 'Phase 2' },
  { id: 3, name: 'CompTIA Network+', provider: 'CompTIA', status: 'not-started', progress: 0, startDate: '', targetDate: '', cost: 0, note: 'Phase 3' },
  { id: 4, name: 'AWS Cloud Practitioner', provider: 'AWS', status: 'not-started', progress: 0, startDate: '', targetDate: '', cost: 0, note: 'Phase 4' },
  { id: 5, name: 'PCEP Python', provider: 'Python Institute', status: 'not-started', progress: 0, startDate: '', targetDate: '', cost: 0, note: 'Phase 5' },
]

const EMPTY_FORM = {
  name: '', provider: '', status: 'not-started', progress: 0,
  startDate: '', targetDate: '', cost: 0, note: '',
}

const STATUS_CONFIG = {
  'not-started': { label: 'Not Started', badgeClass: 'badge badge-muted', Icon: Circle },
  'in-progress':  { label: 'In Progress',  badgeClass: 'badge badge-accent', Icon: Loader },
  'done':         { label: 'Done',          badgeClass: 'badge badge-success', Icon: CheckCircle },
}

const PROVIDER_COLORS = {
  GitHub:           { bg: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: 'var(--border)' },
  Microsoft:        { bg: 'rgba(0,120,212,0.12)',   color: '#60a5fa',               border: 'rgba(0,120,212,0.3)' },
  CompTIA:          { bg: 'rgba(245,158,11,0.12)',  color: 'var(--warning)',         border: 'rgba(245,158,11,0.3)' },
  AWS:              { bg: 'rgba(255,153,0,0.12)',   color: '#fb923c',               border: 'rgba(255,153,0,0.3)' },
  'Python Institute': { bg: 'rgba(59,130,246,0.12)', color: '#93c5fd',             border: 'rgba(59,130,246,0.3)' },
}

function ProviderBadge({ provider }) {
  const c = PROVIDER_COLORS[provider] || { bg: 'var(--bg-overlay)', color: 'var(--text-secondary)', border: 'var(--border)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 999,
      fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {provider}
    </span>
  )
}

function FormField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span className="label">{label}</span>
      {children}
    </div>
  )
}

function CertModal({ cert, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(cert ? { ...cert } : { ...EMPTY_FORM })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim() || !form.provider.trim()) return
    onSave({
      ...form,
      id: form.id || Date.now(),
      progress: Number(form.progress),
      cost: Number(form.cost),
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="modal-title" style={{ margin: 0 }}>
            {cert ? 'Edit Certification' : 'Add Certification'}
          </div>
          <button className="btn-icon" onClick={onClose}><X size={15} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Cert Name">
              <input className="input" placeholder="e.g. AZ-900 Azure Fundamentals" value={form.name} onChange={e => set('name', e.target.value)} />
            </FormField>
            <FormField label="Provider">
              <input className="input" placeholder="e.g. Microsoft" value={form.provider} onChange={e => set('provider', e.target.value)} />
            </FormField>
          </div>

          <FormField label="Status">
            <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </FormField>

          <FormField label={`Progress — ${form.progress}%`}>
            <input
              type="range" min={0} max={100} step={5}
              value={form.progress}
              onChange={e => set('progress', e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Start Date">
              <input className="input" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </FormField>
            <FormField label="Target Date">
              <input className="input" type="date" value={form.targetDate} onChange={e => set('targetDate', e.target.value)} />
            </FormField>
          </div>

          <FormField label="Exam Cost (JOD)">
            <input className="input" type="number" min={0} placeholder="0" value={form.cost} onChange={e => set('cost', e.target.value)} />
          </FormField>

          <FormField label="Note">
            <textarea className="input" placeholder="Phase, resources, study plan..." value={form.note} onChange={e => set('note', e.target.value)} style={{ minHeight: 68 }} />
          </FormField>
        </div>

        <div className="modal-actions">
          {cert && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(cert.id)} style={{ marginRight: 'auto' }}>
              Delete
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {cert ? 'Save Changes' : 'Add Cert'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CertCard({ cert, onEdit, index, isLast }) {
  const cfg = STATUS_CONFIG[cert.status] || STATUS_CONFIG['not-started']
  const StatusIcon = cfg.Icon
  const isDone = cert.status === 'done'
  const isActive = cert.status === 'in-progress'

  const progressColor = isDone
    ? 'linear-gradient(90deg, #059669, var(--success))'
    : isActive
    ? 'linear-gradient(90deg, var(--accent-dim), var(--accent))'
    : 'linear-gradient(90deg, #1e2540, #2a3356)'

  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {/* Timeline column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0, marginTop: 2 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: isDone ? 'rgba(16,185,129,0.15)' : isActive ? 'rgba(0,200,255,0.12)' : 'var(--bg-elevated)',
          border: `2px solid ${isDone ? 'var(--success)' : isActive ? 'var(--accent)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, position: 'relative', zIndex: 1,
          ...(isActive ? { boxShadow: '0 0 10px rgba(0,200,255,0.35)' } : {}),
        }}>
          <StatusIcon
            size={13}
            color={isDone ? 'var(--success)' : isActive ? 'var(--accent)' : 'var(--text-muted)'}
            style={isActive ? { animation: 'pulseGlow 2s ease-in-out infinite' } : {}}
          />
        </div>
        {!isLast && (
          <div style={{
            width: 2, flex: 1, minHeight: 20, marginTop: 4, marginBottom: 4,
            background: isDone ? 'var(--success)' : 'var(--border)',
            opacity: isDone ? 0.4 : 0.5,
          }} />
        )}
      </div>

      {/* Card */}
      <div
        onClick={() => onEdit(cert)}
        className="card"
        style={{
          flex: 1, marginLeft: 14, marginBottom: isLast ? 0 : 12,
          cursor: 'pointer', position: 'relative',
          opacity: isDone ? 0.85 : 1,
          borderColor: isActive ? 'rgba(0,200,255,0.25)' : undefined,
          background: isActive ? 'rgba(0,200,255,0.03)' : undefined,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, flex: 1 }}>
            <ProviderBadge provider={cert.provider} />
            <span className={cfg.badgeClass} style={isActive ? { animation: 'pulseGlow 2s ease-in-out infinite' } : {}}>
              {cfg.label}
            </span>
            {cert.note && (
              <span className="badge badge-muted">{cert.note}</span>
            )}
          </div>
          {isDone && <CheckCircle size={15} color="var(--success)" style={{ flexShrink: 0 }} />}
          {!isDone && <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
        </div>

        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
          color: 'var(--text-primary)', marginBottom: 10,
        }}>
          {cert.name}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>Progress</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: isDone ? 'var(--success)' : isActive ? 'var(--accent)' : 'var(--text-muted)' }}>
              {cert.progress}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${cert.progress}%`, background: progressColor }} />
          </div>
        </div>

        {/* Footer meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {cert.targetDate && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
              <Target size={10} />
              {new Date(cert.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })}
            </span>
          )}
          {cert.startDate && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
              <Calendar size={10} />
              Started {new Date(cert.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {cert.cost > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
              <DollarSign size={10} />
              {cert.cost} JOD
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Certs() {
  const [certs, setCerts] = useLocalStorage('mk-certs', DEFAULT_CERTS)
  const [modal, setModal] = useState(null) // null | 'add' | cert object

  const done = certs.filter(c => c.status === 'done').length
  const inProgress = certs.filter(c => c.status === 'in-progress').length
  const pct = certs.length ? Math.round((done / certs.length) * 100) : 0

  const openAdd = () => setModal('add')
  const openEdit = (cert) => setModal(cert)
  const closeModal = () => setModal(null)

  const handleSave = (data) => {
    if (data.id && modal !== 'add') {
      setCerts(prev => prev.map(c => c.id === data.id ? data : c))
    } else {
      setCerts(prev => [...prev, { ...data, id: Date.now() }])
    }
    closeModal()
  }

  const handleDelete = (id) => {
    setCerts(prev => prev.filter(c => c.id !== id))
    closeModal()
  }

  const progressColor = pct === 100
    ? 'linear-gradient(90deg, #059669, var(--success))'
    : pct > 50
    ? 'linear-gradient(90deg, var(--accent-dim), var(--accent))'
    : 'linear-gradient(90deg, var(--accent-dim), var(--accent))'

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="label" style={{ marginBottom: 5 }}>Learning Path</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            Certifications
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 5, fontSize: 13 }}>
            {done} of {certs.length} complete
            {inProgress > 0 && <span style={{ color: 'var(--accent)', marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: 11 }}>· {inProgress} in progress</span>}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={14} />
          Add Cert
        </button>
      </div>

      {/* Overall progress */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Radial ring */}
          <div style={{ position: 'relative', flexShrink: 0, width: 96, height: 96 }}>
            <RadialRing
              pct={pct}
              size={96}
              thickness={11}
              color={pct === 100 ? TC.success : TC.accent}
            />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 20, color: 'var(--text-primary)', lineHeight: 1 }}>
                {pct}%
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>done</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <GraduationCap size={14} color="var(--accent)" />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                Overall Roadmap Progress
              </span>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { label: 'Total',       value: certs.length,                                          color: 'var(--text-secondary)' },
                { label: 'Done',        value: done,                                                  color: 'var(--success)'        },
                { label: 'In Progress', value: inProgress,                                            color: 'var(--accent)'         },
                { label: 'Not Started', value: certs.filter(c => c.status === 'not-started').length,  color: 'var(--text-muted)'     },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline list */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {certs.length === 0 ? (
          <div className="empty-state">
            <GraduationCap size={36} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>No certifications yet</div>
            <div style={{ fontSize: 12 }}>Add your first cert to start tracking your roadmap</div>
            <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 4 }}>
              <Plus size={13} /> Add Cert
            </button>
          </div>
        ) : (
          certs.map((cert, i) => (
            <CertCard
              key={cert.id}
              cert={cert}
              onEdit={openEdit}
              index={i}
              isLast={i === certs.length - 1}
            />
          ))
        )}
      </div>

      {/* Modal */}
      {modal && (
        <CertModal
          cert={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={closeModal}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
