import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  MapPin, Plus, X, Pencil, Trash2, CheckCircle,
  Star, Globe, Coffee, Utensils, Trees, Landmark, Building2, Grid3x3,
} from 'lucide-react'

const EMPTY_FORM = {
  name: '', city: '', country: 'Jordan', type: 'other',
  visited: false, rating: 0, note: '',
}

const TYPE_CONFIG = {
  restaurant: { label: 'Restaurant', icon: Utensils,  badgeClass: 'badge badge-warning',  color: 'var(--warning)' },
  nature:     { label: 'Nature',     icon: Trees,      badgeClass: 'badge badge-success',  color: 'var(--success)' },
  attraction: { label: 'Attraction', icon: Landmark,   badgeClass: 'badge badge-purple',   color: '#a78bfa' },
  cafe:       { label: 'Cafe',       icon: Coffee,     badgeClass: 'badge badge-accent',   color: 'var(--accent)' },
  city:       { label: 'City',       icon: Building2,  badgeClass: 'badge badge-muted',    color: 'var(--text-secondary)' },
  other:      { label: 'Other',      icon: Globe,      badgeClass: 'badge badge-muted',    color: 'var(--text-muted)' },
}

const ALL_TYPES = ['all', ...Object.keys(TYPE_CONFIG)]

function FormField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span className="label">{label}</span>
      {children}
    </div>
  )
}

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 1,
            color: n <= (hover || value) ? 'var(--warning)' : 'var(--border-bright)',
            transition: 'color 0.1s',
          }}
        >
          <Star size={14} fill={n <= (hover || value) ? 'var(--warning)' : 'none'} />
        </button>
      ))}
      {value > 0 && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--warning)', marginLeft: 4 }}>
          {value}/10
        </span>
      )}
    </div>
  )
}

function PlaceModal({ place, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(place ? { ...place } : { ...EMPTY_FORM, addedAt: new Date().toISOString() })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim() || !form.city.trim()) return
    onSave({
      ...form,
      id: form.id || Date.now(),
      rating: form.visited ? Number(form.rating) : 0,
      addedAt: form.addedAt || new Date().toISOString(),
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="modal-title" style={{ margin: 0 }}>{place ? 'Edit Place' : 'Add Place'}</div>
          <button className="btn-icon" onClick={onClose}><X size={15} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Place Name">
            <input className="input" placeholder="e.g. Petra, Dead Sea, Books@Cafe" value={form.name} onChange={e => set('name', e.target.value)} />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="City">
              <input className="input" placeholder="e.g. Amman" value={form.city} onChange={e => set('city', e.target.value)} />
            </FormField>
            <FormField label="Country">
              <input className="input" placeholder="e.g. Jordan" value={form.country} onChange={e => set('country', e.target.value)} />
            </FormField>
          </div>

          <FormField label="Type">
            <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Status">
            <div style={{ display: 'flex', gap: 8 }}>
              {[false, true].map(val => (
                <button
                  key={String(val)}
                  onClick={() => set('visited', val)}
                  className={`btn ${form.visited === val ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {val ? <><CheckCircle size={13} /> Visited</> : <><MapPin size={13} /> Want to Visit</>}
                </button>
              ))}
            </div>
          </FormField>

          {form.visited && (
            <FormField label="Rating (0–10)">
              <StarRating value={form.rating} onChange={v => set('rating', v)} />
            </FormField>
          )}

          <FormField label="Note">
            <textarea className="input" placeholder="Recommendations, memories, tips..." value={form.note} onChange={e => set('note', e.target.value)} style={{ minHeight: 68 }} />
          </FormField>
        </div>

        <div className="modal-actions">
          {place && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(place.id)} style={{ marginRight: 'auto' }}>
              <Trash2 size={12} /> Delete
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {place ? 'Save Changes' : 'Add Place'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PlaceCard({ place, onEdit, onMarkVisited }) {
  const typeCfg = TYPE_CONFIG[place.type] || TYPE_CONFIG.other
  const TypeIcon = typeCfg.icon

  return (
    <div
      className="card"
      style={{ display: 'flex', flexDirection: 'column', gap: 0, cursor: 'pointer', position: 'relative' }}
      onClick={() => onEdit(place)}
    >
      {/* Type icon background */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        opacity: 0.07,
      }}>
        <TypeIcon size={48} color={typeCfg.color} />
      </div>

      {/* Badges row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        <span className={typeCfg.badgeClass}>{typeCfg.label}</span>
        {place.visited && place.rating > 0 && (
          <span className="badge badge-warning" style={{ gap: 3 }}>
            <Star size={8} fill="var(--warning)" /> {place.rating}/10
          </span>
        )}
        {place.visited && (
          <span className="badge badge-success" style={{ gap: 3 }}>
            <CheckCircle size={8} /> Visited
          </span>
        )}
      </div>

      {/* Name */}
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
        color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 5,
      }}>
        {place.name}
      </div>

      {/* Location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: place.note ? 10 : 14 }}>
        <MapPin size={11} color="var(--text-muted)" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          {place.city}{place.country && place.country !== place.city ? `, ${place.country}` : ''}
        </span>
      </div>

      {/* Note */}
      {place.note && (
        <div style={{
          fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic',
          lineHeight: 1.5, marginBottom: 14,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {place.note}
        </div>
      )}

      {/* Actions */}
      <div
        style={{ display: 'flex', gap: 6, marginTop: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {!place.visited && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ flex: 1, justifyContent: 'center', gap: 5 }}
            onClick={() => onMarkVisited(place.id)}
          >
            <CheckCircle size={12} /> Mark Visited
          </button>
        )}
        <button className="btn-icon" onClick={() => onEdit(place)}>
          <Pencil size={12} />
        </button>
      </div>
    </div>
  )
}

export default function Places() {
  const [places, setPlaces] = useLocalStorage('mk-places', [])
  const [modal, setModal] = useState(null)
  const [tab, setTab] = useState('want') // 'want' | 'visited'
  const [typeFilter, setTypeFilter] = useState('all')

  const wantCount = places.filter(p => !p.visited).length
  const visitedCount = places.filter(p => p.visited).length

  const filtered = places
    .filter(p => tab === 'want' ? !p.visited : p.visited)
    .filter(p => typeFilter === 'all' ? true : p.type === typeFilter)

  const openAdd = () => setModal('add')
  const openEdit = (place) => setModal(place)
  const closeModal = () => setModal(null)

  const handleSave = (data) => {
    if (data.id && modal !== 'add') {
      setPlaces(prev => prev.map(p => p.id === data.id ? data : p))
    } else {
      setPlaces(prev => [...prev, { ...data, id: Date.now() }])
    }
    closeModal()
  }

  const handleDelete = (id) => {
    setPlaces(prev => prev.filter(p => p.id !== id))
    closeModal()
  }

  const handleMarkVisited = (id) => {
    setPlaces(prev => prev.map(p => p.id === id ? { ...p, visited: true } : p))
  }

  // Types that actually appear in the current tab
  const usedTypes = [...new Set(
    places
      .filter(p => tab === 'want' ? !p.visited : p.visited)
      .map(p => p.type)
  )]

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="label" style={{ marginBottom: 5 }}>Travel & Discovery</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            Places
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 5, fontSize: 13 }}>
            <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{wantCount}</span> to visit
            <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>·</span>
            <span style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>{visitedCount}</span> visited
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={14} />
          Add Place
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-elevated)', padding: 4, borderRadius: 8, width: 'fit-content' }}>
        {[
          { key: 'want', label: 'Want to Visit', count: wantCount },
          { key: 'visited', label: 'Visited', count: visitedCount },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setTypeFilter('all') }}
            style={{
              padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 7,
              background: tab === t.key ? 'var(--bg-overlay)' : 'transparent',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              borderColor: tab === t.key ? 'var(--border)' : 'transparent',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              padding: '1px 6px', borderRadius: 999,
              background: tab === t.key ? (t.key === 'visited' ? 'rgba(16,185,129,0.15)' : 'rgba(0,200,255,0.12)') : 'var(--bg-elevated)',
              color: tab === t.key ? (t.key === 'visited' ? 'var(--success)' : 'var(--accent)') : 'var(--text-muted)',
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Type filter chips */}
      {usedTypes.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          <button
            className={`chip ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            <Grid3x3 size={10} /> All
          </button>
          {usedTypes.map(type => {
            const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.other
            const Ic = cfg.icon
            return (
              <button
                key={type}
                className={`chip ${typeFilter === type ? 'active' : ''}`}
                onClick={() => setTypeFilter(type)}
              >
                <Ic size={10} /> {cfg.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <MapPin size={36} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {places.filter(p => tab === 'want' ? !p.visited : p.visited).length === 0
              ? (tab === 'want' ? 'No places on your wish list yet' : 'No visited places recorded yet')
              : `No ${TYPE_CONFIG[typeFilter]?.label ?? ''} places in this tab`}
          </div>
          <div style={{ fontSize: 12 }}>
            {tab === 'want'
              ? 'Add somewhere you want to go — restaurants, nature spots, cities'
              : 'Mark places as visited or add past travels'}
          </div>
          {places.filter(p => tab === 'want' ? !p.visited : p.visited).length === 0 && (
            <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 4 }}>
              <Plus size={13} /> Add Place
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
        }}>
          {filtered.map(place => (
            <PlaceCard
              key={place.id}
              place={place}
              onEdit={openEdit}
              onMarkVisited={handleMarkVisited}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <PlaceModal
          place={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={closeModal}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
