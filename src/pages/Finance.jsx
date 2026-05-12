import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  Plus, Trash2, TrendingUp, TrendingDown, Wallet,
  ShoppingCart, Coffee, Gamepad2, Zap, Car, X, CreditCard, BarChart2,
} from 'lucide-react'
import { BarChart, TC } from '../components/charts/Charts'

const CATEGORIES = [
  { value: 'food',          label: 'Food',          Icon: Coffee,       badge: 'badge-success', color: '#10b981' },
  { value: 'games',         label: 'Games',          Icon: Gamepad2,     badge: 'badge-purple',  color: '#a78bfa' },
  { value: 'transport',     label: 'Transport',      Icon: Car,          badge: 'badge-muted',   color: '#4a5578' },
  { value: 'subscriptions', label: 'Subscriptions',  Icon: CreditCard,   badge: 'badge-warning', color: '#f59e0b' },
  { value: 'gym',           label: 'Gym',            Icon: Zap,          badge: 'badge-accent',  color: '#00c8ff' },
  { value: 'shopping',      label: 'Shopping',       Icon: ShoppingCart, badge: 'badge-danger',  color: '#ef4444' },
  { value: 'other',         label: 'Other',          Icon: Wallet,       badge: 'badge-muted',   color: '#4a5578' },
]

function getCat(value) {
  return CATEGORIES.find(c => c.value === value) || CATEGORIES[CATEGORIES.length - 1]
}

function fmt(n) {
  return Number(n).toFixed(2) + ' JOD'
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function remainingColor(amount) {
  if (amount < 30) return 'var(--danger)'
  if (amount < 70) return 'var(--warning)'
  return 'var(--success)'
}

function budgetBarGradient(spent, allowance) {
  const pct = (spent / allowance) * 100
  if (pct > 90) return 'linear-gradient(90deg, #ef4444, #f87171)'
  if (pct > 60) return 'linear-gradient(90deg, #d97706, #f59e0b)'
  return 'linear-gradient(90deg, var(--accent-dim), var(--accent))'
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, iconColor, valueColor }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: `${iconColor}18`,
          border: `1px solid ${iconColor}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={14} color={iconColor} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: valueColor || 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────
function AddExpenseModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'food',
    date: today(),
    note: '',
  })
  const [error, setError] = useState('')

  function set(field, val) {
    setForm(prev => ({ ...prev, [field]: val }))
    setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return setError('Title is required.')
    const amt = parseFloat(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) return setError('Enter a valid amount.')
    onAdd({
      id: Date.now(),
      title: form.title.trim(),
      amount: amt,
      category: form.category,
      date: form.date,
      note: form.note.trim(),
    })
    onClose()
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Add Expense</h2>
          <button className="btn-icon" onClick={onClose}><X size={14} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="label">Title</label>
            <input
              className="input"
              placeholder="e.g. Lunch at campus"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              autoFocus
            />
          </div>

          {/* Amount + Category row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="label">Amount (JOD)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="label">Category</label>
              <select
                className="select"
                value={form.category}
                onChange={e => set('category', e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
            />
          </div>

          {/* Note */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="label">Note (optional)</label>
            <textarea
              className="input"
              placeholder="Any extra details…"
              value={form.note}
              onChange={e => set('note', e.target.value)}
              style={{ minHeight: 64, resize: 'vertical' }}
            />
          </div>

          {error && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--danger)', padding: '6px 10px', background: 'rgba(239,68,68,0.08)', borderRadius: 5 }}>
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Plus size={13} /> Add Expense</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Category Breakdown ───────────────────────────────────────────────────────
function CategoryBreakdown({ expenses }) {
  const totals = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.value).reduce((s, e) => s + Number(e.amount || 0), 0),
    count: expenses.filter(e => e.category === cat.value).length,
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const max = totals.length > 0 ? totals[0].total : 1

  if (totals.length === 0) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
        No spending data yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {totals.map(cat => {
        const pct = (cat.total / max) * 100
        return (
          <div key={cat.value} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Icon */}
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: `${cat.color}18`,
              border: `1px solid ${cat.color}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <cat.Icon size={13} color={cat.color} />
            </div>

            {/* Label */}
            <div style={{ width: 100, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{cat.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{cat.count} expense{cat.count !== 1 ? 's' : ''}</div>
            </div>

            {/* Bar */}
            <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: cat.color,
                borderRadius: 3,
                transition: 'width 0.4s ease',
                opacity: 0.8,
              }} />
            </div>

            {/* Amount */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0, minWidth: 80, textAlign: 'right' }}>
              {fmt(cat.total)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Expense List ─────────────────────────────────────────────────────────────
function ExpenseList({ expenses, onDelete }) {
  if (expenses.length === 0) {
    return (
      <div className="empty-state">
        <Wallet size={36} />
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)' }}>No expenses yet</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>Add your first expense to start tracking.</div>
      </div>
    )
  }

  // Group by date, newest first
  const grouped = {}
  const sorted = [...expenses].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0))
  sorted.forEach(e => {
    const d = e.date || 'Unknown'
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(e)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {Object.entries(grouped).map(([date, items]) => {
        const label = (() => {
          try {
            const d = new Date(date + 'T12:00:00')
            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          } catch {
            return date
          }
        })()

        const dayTotal = items.reduce((s, e) => s + Number(e.amount || 0), 0)

        return (
          <div key={date}>
            {/* Date group header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0 6px',
              borderBottom: '1px solid var(--border)',
              marginBottom: 2,
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {label}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                {fmt(dayTotal)}
              </span>
            </div>

            {/* Expense rows */}
            {items.map(expense => {
              const cat = getCat(expense.category)
              return (
                <div
                  key={expense.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 8px',
                    borderRadius: 6,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Category icon */}
                  <div style={{
                    width: 26, height: 26, borderRadius: 5,
                    background: `${cat.color}18`,
                    border: `1px solid ${cat.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <cat.Icon size={12} color={cat.color} />
                  </div>

                  {/* Title + note */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {expense.title}
                    </div>
                    {expense.note && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {expense.note}
                      </div>
                    )}
                  </div>

                  {/* Category badge */}
                  <span className={`badge ${cat.badge}`} style={{ flexShrink: 0 }}>{cat.label}</span>

                  {/* Amount */}
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0, minWidth: 72, textAlign: 'right' }}>
                    {fmt(expense.amount)}
                  </div>

                  {/* Delete */}
                  <button
                    className="btn-icon"
                    style={{ flexShrink: 0, borderColor: 'transparent' }}
                    onClick={() => {
                      if (window.confirm(`Delete "${expense.title}"?`)) onDelete(expense.id)
                    }}
                    title="Delete"
                  >
                    <Trash2 size={12} color="var(--danger)" />
                  </button>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Finance Page ────────────────────────────────────────────────────────
export default function Finance() {
  const [expenses, setExpenses] = useLocalStorage('mk-expenses', [])
  const [subs] = useLocalStorage('mk-subscriptions', [])
  const [settings, setSettings] = useLocalStorage('mk-settings', { allowance: 150, currency: 'JOD' })
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetDraft, setBudgetDraft] = useState('')

  const ALLOWANCE = Number(settings.allowance) || 150

  const thisMonth = currentMonth()

  const monthlyExpenses = expenses.filter(e => e.date?.startsWith(thisMonth))
  const spentThisMonth = monthlyExpenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const remaining = ALLOWANCE - spentThisMonth
  const totalSpentAllTime = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const monthlySubTotal = subs.reduce((s, sub) => s + Number(sub.amount || 0), 0)

  const budgetPct = Math.min(100, (spentThisMonth / ALLOWANCE) * 100)

  // Daily spending bars for current month
  const todayDay  = new Date().getDate()
  const dailyBars = Array.from({ length: todayDay }, (_, i) => {
    const d       = String(i + 1).padStart(2, '0')
    const dateStr = `${thisMonth}-${d}`
    const val     = expenses
      .filter(e => e.date === dateStr)
      .reduce((s, e) => s + Number(e.amount || 0), 0)
    return { value: val, label: String(i + 1), highlight: i === todayDay - 1 }
  })
  const peakDay = Math.max(...dailyBars.map(b => b.value), 0)
  const activeDays = dailyBars.filter(b => b.value > 0).length

  function addExpense(expense) {
    setExpenses(prev => [expense, ...prev])
  }

  function deleteExpense(id) {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="page">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <div className="label" style={{ marginBottom: 4 }}>{monthLabel()}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            Finance
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 5, fontSize: 13 }}>
            Track your allowance and spending.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add Expense
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard
          icon={Wallet}
          label="Remaining"
          value={fmt(remaining)}
          sub={`of ${ALLOWANCE} JOD allowance`}
          iconColor={remaining < 30 ? '#ef4444' : remaining < 70 ? '#f59e0b' : '#10b981'}
          valueColor={remainingColor(remaining)}
        />
        <StatCard
          icon={TrendingDown}
          label="Spent This Month"
          value={fmt(spentThisMonth)}
          sub={`${monthlyExpenses.length} expense${monthlyExpenses.length !== 1 ? 's' : ''}`}
          iconColor="#00c8ff"
        />
        <StatCard
          icon={CreditCard}
          label="Monthly Subs"
          value={fmt(monthlySubTotal)}
          sub={`${subs.length} subscription${subs.length !== 1 ? 's' : ''}`}
          iconColor="#f59e0b"
        />
        <StatCard
          icon={TrendingUp}
          label="All Time Spent"
          value={fmt(totalSpentAllTime)}
          sub={`${expenses.length} total expense${expenses.length !== 1 ? 's' : ''}`}
          iconColor="#a78bfa"
        />
      </div>

      {/* ── Budget Progress ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingDown size={13} color="var(--accent)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
              Monthly Budget
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              {fmt(spentThisMonth)} /
            </span>
            {editingBudget ? (
              <form
                onSubmit={e => {
                  e.preventDefault()
                  const v = parseFloat(budgetDraft)
                  if (!isNaN(v) && v > 0) setSettings(s => ({ ...s, allowance: v }))
                  setEditingBudget(false)
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <input
                  autoFocus
                  className="input"
                  type="number"
                  min="1"
                  step="0.01"
                  value={budgetDraft}
                  onChange={e => setBudgetDraft(e.target.value)}
                  onBlur={() => setEditingBudget(false)}
                  style={{ width: 80, padding: '3px 7px', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>JOD</span>
              </form>
            ) : (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setBudgetDraft(String(ALLOWANCE)); setEditingBudget(true) }}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                title="Edit monthly budget"
              >
                {ALLOWANCE} JOD ✎
              </button>
            )}
          </div>
        </div>

        <div className="progress-bar" style={{ height: 8, marginBottom: 8 }}>
          <div
            className="progress-fill"
            style={{ width: `${budgetPct}%`, background: budgetBarGradient(spentThisMonth, ALLOWANCE) }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
            {budgetPct.toFixed(1)}% spent this month
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
            color: remainingColor(remaining),
          }}>
            {fmt(remaining)} left
          </span>
        </div>
      </div>

      {/* ── Daily Spending Chart ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={13} color="var(--accent)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
              Daily Spending
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
            {monthLabel()} · day 1 – {todayDay}
          </span>
        </div>

        {activeDays === 0 ? (
          <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              No expenses logged this month yet.
            </span>
          </div>
        ) : (
          <>
            <BarChart
              bars={dailyBars}
              height={72}
              color={budgetPct > 90 ? TC.danger : budgetPct > 60 ? TC.warning : TC.accent}
              showLabels
            />
            <div style={{ marginTop: 8, display: 'flex', gap: 20 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                {activeDays} day{activeDays !== 1 ? 's' : ''} with expenses
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                Peak: {peakDay.toFixed(2)} JOD
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                Avg / expense: {monthlyExpenses.length > 0 ? (spentThisMonth / monthlyExpenses.length).toFixed(2) : '0.00'} JOD
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Bottom Grid: Category Breakdown + Expense List ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'start' }}>

        {/* Category Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ShoppingCart size={13} color="var(--accent)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
              By Category
            </span>
            <span className="badge badge-muted" style={{ marginLeft: 'auto' }}>{monthLabel()}</span>
          </div>
          <CategoryBreakdown expenses={monthlyExpenses} />
        </div>

        {/* Expense List */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Wallet size={13} color="var(--accent)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
              All Expenses
            </span>
            <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
              {expenses.length} total
            </span>
          </div>
          <ExpenseList expenses={expenses} onDelete={deleteExpense} />
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <AddExpenseModal
          onClose={() => setShowModal(false)}
          onAdd={addExpense}
        />
      )}
    </div>
  )
}
