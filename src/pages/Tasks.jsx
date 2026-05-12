import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useResponsive } from '../hooks/useResponsive'
import {
  CheckSquare, Square, Trash2, Plus, X, Calendar, Tag, Flag,
  ClipboardList,
} from 'lucide-react'
import { RingCard, StatBar, TC } from '../components/charts/Charts'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

const PRIORITY_BADGE = {
  high:   { cls: 'badge badge-danger',   label: 'High' },
  medium: { cls: 'badge badge-warning',  label: 'Med' },
  low:    { cls: 'badge badge-muted',    label: 'Low' },
}

function isOverdue(dueDate) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Add Task Modal ──────────────────────────────────────────────────────────
function AddTaskModal({ onClose, onAdd }) {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('medium')
  const [tag, setTag] = useState('')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd({
      id: Date.now(),
      text: trimmed,
      done: false,
      priority,
      tag: tag.trim() || null,
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="modal-title" style={{ margin: 0 }}>New Task</h2>
          <button className="btn-icon" onClick={onClose}><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>Task *</label>
            <input
              className="input"
              placeholder="What needs to be done?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Priority</label>
              <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Due Date</label>
              <input
                className="input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>Tag (optional)</label>
            <input
              className="input"
              placeholder="e.g. study, gym, work"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!text.trim()}>
              <Plus size={14} /> Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Task Row ────────────────────────────────────────────────────────────────
function TaskRow({ task, onToggle, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const overdue = isOverdue(task.dueDate) && !task.done
  const pb = PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.medium

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        transition: 'border-color 0.15s, opacity 0.2s',
        opacity: task.done ? 0.45 : 1,
        borderColor: hovered ? 'var(--border-bright)' : 'var(--border)',
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: task.done ? 'var(--success)' : 'var(--text-muted)',
          flexShrink: 0,
          display: 'flex',
        }}
      >
        {task.done ? <CheckSquare size={16} /> : <Square size={16} />}
      </button>

      {/* Text */}
      <span style={{
        flex: 1,
        fontSize: 13,
        color: task.done ? 'var(--text-muted)' : 'var(--text-primary)',
        textDecoration: task.done ? 'line-through' : 'none',
        wordBreak: 'break-word',
      }}>
        {task.text}
      </span>

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span className={pb.cls}>{pb.label}</span>

        {task.tag && (
          <span className="chip" style={{ cursor: 'default', fontSize: 10 }}>
            <Tag size={9} />{task.tag}
          </span>
        )}

        {task.dueDate && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: overdue ? 'var(--danger)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}>
            <Calendar size={9} />{formatDate(task.dueDate)}
          </span>
        )}

        <button
          className="btn-icon"
          onClick={() => onDelete(task.id)}
          style={{
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s',
            padding: 4,
            color: 'var(--danger)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
const FILTERS = ['All', 'Active', 'Completed', 'High', 'Medium', 'Low']

export default function Tasks() {
  const { isMobile } = useResponsive()
  const [tasks, setTasks] = useLocalStorage('mk-tasks', [])
  const [filter, setFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)

  const addTask = (task) => setTasks((prev) => [task, ...prev])

  const toggleTask = (id) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const deleteTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id))

  const openCount = tasks.filter((t) => !t.done).length
  const doneCount = tasks.filter((t) => t.done).length

  const filtered = tasks.filter((t) => {
    if (filter === 'Active') return !t.done
    if (filter === 'Completed') return t.done
    if (filter === 'High') return t.priority === 'high' && !t.done
    if (filter === 'Medium') return t.priority === 'medium' && !t.done
    if (filter === 'Low') return t.priority === 'low' && !t.done
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
  })

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
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
            <Flag size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
            Tasks
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-accent">{openCount} open</span>
          <span className="badge badge-muted">{doneCount} done</span>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {/* ── Insights ── */}
      {tasks.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '148px 1fr', gap: 12, marginBottom: 20 }}>
          {/* Completion ring */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Completion
            </span>
            <RingCard
              segments={[
                { value: doneCount, color: TC.success },
                { value: openCount, color: TC.accent  },
              ]}
              size={76}
              thickness={9}
              value={tasks.length ? `${Math.round((doneCount / tasks.length) * 100)}%` : '—'}
              sublabel="done"
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: TC.success }}>{doneCount} done</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: TC.accent  }}>{openCount} open</span>
            </div>
          </div>

          {/* Priority breakdown */}
          <div className="card">
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
              color: 'var(--text-primary)', display: 'block', marginBottom: 14,
            }}>
              Open Tasks by Priority
            </span>
            {openCount === 0 ? (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                All tasks complete 🎉
              </span>
            ) : (
              <>
                <StatBar label="High"   value={tasks.filter(t => !t.done && t.priority === 'high'  ).length} total={openCount} color={TC.danger}  />
                <StatBar label="Medium" value={tasks.filter(t => !t.done && t.priority === 'medium').length} total={openCount} color={TC.warning} />
                <StatBar label="Low"    value={tasks.filter(t => !t.done && t.priority === 'low'   ).length} total={openCount} color={TC.muted}   />
              </>
            )}
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`chip${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task list */}
      {sorted.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={40} />
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--text-secondary)' }}>
            No tasks here
          </p>
          <p style={{ fontSize: 13 }}>
            {filter === 'All'
              ? 'Add your first task to get started.'
              : `No ${filter.toLowerCase()} tasks found.`}
          </p>
          {filter === 'All' && (
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setShowModal(true)}>
              <Plus size={14} /> Add Task
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sorted.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddTaskModal onClose={() => setShowModal(false)} onAdd={addTask} />
      )}
    </div>
  )
}
