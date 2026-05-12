import { useState, useEffect, useRef } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  StickyNote, Pin, PinOff, Trash2, Plus, Tag, FileText,
} from 'lucide-react'

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function blankNote() {
  const now = new Date().toISOString()
  return {
    id: Date.now(),
    title: '',
    content: '',
    tag: null,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  }
}

// ── Note List Item ──────────────────────────────────────────────────────────
function NoteListItem({ note, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: selected ? 'rgba(0,200,255,0.07)' : 'transparent',
        border: `1px solid ${selected ? 'rgba(0,200,255,0.25)' : 'transparent'}`,
        borderRadius: 6,
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = 'var(--bg-elevated)'
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = 'transparent'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 13,
          color: selected ? 'var(--accent)' : 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {note.title || 'Untitled'}
        </span>
        {note.pinned && <Pin size={10} color="var(--accent)" style={{ flexShrink: 0 }} />}
      </div>
      <span style={{
        fontSize: 11,
        color: 'var(--text-muted)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
      }}>
        {note.content.slice(0, 60) || 'No content'}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
        {timeAgo(note.updatedAt)}
      </span>
    </button>
  )
}

// ── Note Editor ─────────────────────────────────────────────────────────────
function NoteEditor({ note, onChange, onDelete }) {
  const [saved, setSaved] = useState(false)
  const saveTimer = useRef(null)
  const textareaRef = useRef(null)

  // Reset saved indicator on note switch
  useEffect(() => {
    setSaved(false)
  }, [note.id])

  const handleChange = (field, value) => {
    onChange({ ...note, [field]: value, updatedAt: new Date().toISOString() })
    clearTimeout(saveTimer.current)
    setSaved(false)
    saveTimer.current = setTimeout(() => setSaved(true), 600)
  }

  // Grow textarea to fill remaining height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [note.content])

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-surface)',
      borderRadius: 8,
      border: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      {/* Editor toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
        flexShrink: 0,
      }}>
        {/* Tag */}
        <Tag size={11} color="var(--text-muted)" />
        <input
          className="input"
          placeholder="tag (optional)"
          value={note.tag || ''}
          onChange={(e) => handleChange('tag', e.target.value || null)}
          style={{
            width: 120,
            padding: '4px 8px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            background: 'var(--bg-overlay)',
          }}
        />

        <div style={{ flex: 1 }} />

        {/* Saved indicator */}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--success)',
          opacity: saved ? 1 : 0,
          transition: 'opacity 0.4s',
        }}>
          Saved
        </span>

        {/* Pin toggle */}
        <button
          className="btn-icon"
          onClick={() => handleChange('pinned', !note.pinned)}
          title={note.pinned ? 'Unpin' : 'Pin'}
          style={{
            color: note.pinned ? 'var(--accent)' : 'var(--text-muted)',
            borderColor: note.pinned ? 'rgba(0,200,255,0.3)' : 'var(--border)',
          }}
        >
          {note.pinned ? <PinOff size={13} /> : <Pin size={13} />}
        </button>

        {/* Delete */}
        <button
          className="btn btn-danger btn-sm"
          onClick={onDelete}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>

      {/* Title */}
      <input
        className="input"
        placeholder="Note title…"
        value={note.title}
        onChange={(e) => handleChange('title', e.target.value)}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-primary)',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--border)',
          borderRadius: 0,
          padding: '16px 20px',
          boxShadow: 'none',
          width: '100%',
        }}
      />

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        <textarea
          ref={textareaRef}
          placeholder="Start writing…"
          value={note.content}
          onChange={(e) => handleChange('content', e.target.value)}
          style={{
            width: '100%',
            minHeight: 300,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: 1.75,
            resize: 'none',
            caretColor: 'var(--accent)',
          }}
        />
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function Notes() {
  const [notes, setNotes] = useLocalStorage('mk-notes', [])
  const [selectedId, setSelectedId] = useState(null)

  // Auto-select first note on load
  const sorted = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.updatedAt) - new Date(a.updatedAt)
  })

  const activeId = selectedId ?? sorted[0]?.id ?? null
  const activeNote = notes.find((n) => n.id === activeId) ?? null

  const createNote = () => {
    const note = blankNote()
    setNotes((prev) => [note, ...prev])
    setSelectedId(note.id)
  }

  const updateNote = (updated) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
  }

  const deleteNote = (id) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id)
      // Select adjacent note
      const idx = sorted.findIndex((n) => n.id === id)
      const nextNote = sorted[idx + 1] ?? sorted[idx - 1] ?? null
      setSelectedId(nextNote?.id ?? null)
      return next
    })
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 28px 16px',
        flexShrink: 0,
      }}>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>Personal OS</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 800,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <StickyNote size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
            Notes
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-muted">{notes.length} notes</span>
          <button className="btn btn-primary" onClick={createNote}>
            <Plus size={14} /> New Note
          </button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={{
        display: 'flex',
        flex: 1,
        gap: 0,
        overflow: 'hidden',
        padding: '0 28px 28px',
        minHeight: 0,
      }}>
        {/* Left panel — note list */}
        <div style={{
          width: 260,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRight: 'none',
          borderRadius: '8px 0 0 8px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 10px 8px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}>
            <span className="label">All Notes</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {sorted.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 8,
                color: 'var(--text-muted)',
                padding: 20,
                textAlign: 'center',
              }}>
                <FileText size={28} style={{ opacity: 0.25 }} />
                <span style={{ fontSize: 12 }}>No notes yet</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sorted.map((note) => (
                  <NoteListItem
                    key={note.id}
                    note={note}
                    selected={note.id === activeId}
                    onClick={() => setSelectedId(note.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel — editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {activeNote ? (
            <NoteEditor
              key={activeNote.id}
              note={activeNote}
              onChange={updateNote}
              onDelete={() => deleteNote(activeNote.id)}
            />
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '0 8px 8px 0',
              gap: 14,
            }}>
              <StickyNote size={44} style={{ opacity: 0.15 }} />
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}>
                Create your first note
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 260 }}>
                Notes live here. Use them for anything — ideas, plans, reference material.
              </p>
              <button className="btn btn-primary" onClick={createNote}>
                <Plus size={14} /> New Note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
