// ── Theme palette — matches index.css CSS vars ───────────────────────────────
export const TC = {
  accent:  '#0284c7',
  accentL: '#38bdf8',
  violet:  '#6d28d9',
  success: '#059669',
  warning: '#d97706',
  danger:  '#dc2626',
  muted:   '#7898c4',
  border:  '#c2d3ee',
  track:   '#dce6f6',
}

// ── Donut Chart ──────────────────────────────────────────────────────────────
// segments: [{ value: number, color: string }]
export function DonutChart({ segments = [], size = 120, thickness = 14 }) {
  const cx    = size / 2
  const cy    = size / 2
  const r     = Math.max(2, (size - thickness) / 2 - 1)
  const circ  = 2 * Math.PI * r
  const total = segments.reduce((s, g) => s + Math.max(0, g.value), 0)
  const nonEmpty = segments.filter(s => s.value > 0).length

  let cumDeg = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={TC.track} strokeWidth={thickness} />

      {total > 0 && segments.map((seg, i) => {
        const v = Math.max(0, seg.value)
        if (!v) return null
        const deg    = (v / total) * 360
        const gapDeg = nonEmpty > 1 ? 2.5 : 0
        const arcLen = Math.max(0, ((deg - gapDeg) / 360) * circ)
        const rot    = cumDeg - 90
        cumDeg += deg
        if (arcLen <= 0) return null
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={`${arcLen} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(${rot} ${cx} ${cy})`}
          />
        )
      })}
    </svg>
  )
}

// ── Radial Ring (single progress arc) ────────────────────────────────────────
export function RadialRing({ pct = 0, size = 100, thickness = 10, color = TC.accent }) {
  const cx   = size / 2
  const cy   = size / 2
  const r    = Math.max(2, (size - thickness) / 2 - 1)
  const circ = 2 * Math.PI * r
  const fill = (Math.max(0, Math.min(100, pct)) / 100) * circ

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={TC.track} strokeWidth={thickness} />
      {pct > 0 && (
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}
    </svg>
  )
}

// ── Spark Area Chart ─────────────────────────────────────────────────────────
// data: number[]  —  fills container width, fixed height
export function SparkArea({ data = [], color = TC.accent, height = 56 }) {
  const nonZero = data.some(v => v > 0)

  if (!nonZero) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: TC.muted }}>
          No data yet
        </span>
      </div>
    )
  }

  const n    = data.length
  const max  = Math.max(...data, 0.01)
  const vbW  = 400
  const vbH  = height
  const padY = 5

  const pts = data.map((v, i) => ({
    x: (i / Math.max(n - 1, 1)) * vbW,
    y: vbH - padY - ((v / max) * (vbH - padY * 2)),
  }))

  let linePath = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const cpx = ((pts[i - 1].x + pts[i].x) / 2).toFixed(1)
    linePath += ` C ${cpx} ${pts[i - 1].y.toFixed(1)}, ${cpx} ${pts[i].y.toFixed(1)}, ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`
  }

  const areaPath = `${linePath} L ${vbW} ${vbH} L 0 ${vbH} Z`
  const gradId   = `sa${color.replace(/[^a-z0-9]/gi, '')}`

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${vbW} ${vbH}`}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0.01} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Highlight last data point */}
      <circle
        cx={pts[pts.length - 1].x}
        cy={pts[pts.length - 1].y}
        r="5"
        fill={color}
        stroke="white"
        strokeWidth="2"
      />
    </svg>
  )
}

// ── Vertical Bar Chart ────────────────────────────────────────────────────────
// bars: [{ value, label?, color?, highlight? }]
export function BarChart({ bars = [], height = 64, color = TC.accent, showLabels = false }) {
  if (!bars.length) return null
  const max     = Math.max(...bars.map(b => b.value), 0.01)
  const barArea = height - (showLabels ? 18 : 0)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}>
      {bars.map((b, i) => {
        const bh  = b.value > 0 ? Math.max(2, (b.value / max) * (barArea - 2)) : 0
        const clr = b.color || (b.highlight ? color : `${color}77`)
        return (
          <div
            key={i}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height }}
          >
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
              <div style={{
                width: '100%',
                height: bh,
                background: clr,
                borderRadius: '3px 3px 0 0',
                transition: 'height 0.4s ease',
              }} />
            </div>
            {showLabels && b.label !== undefined && (
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 7,
                color: b.highlight ? color : TC.muted,
                marginTop: 2,
                textAlign: 'center',
                lineHeight: 1,
              }}>
                {b.label}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Horizontal Stat Bar ───────────────────────────────────────────────────────
// Compact labeled bar for breakdowns (priority, status, category)
export function StatBar({ label, value, total, color, badgeClass }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
      {badgeClass
        ? <span className={`badge ${badgeClass}`} style={{ width: 80, justifyContent: 'center', flexShrink: 0 }}>{label}</span>
        : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, width: 54, flexShrink: 0 }}>{label}</span>
      }
      <div style={{ flex: 1, height: 5, background: TC.track, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: TC.muted, width: 18, textAlign: 'right', flexShrink: 0 }}>
        {value}
      </span>
    </div>
  )
}

// ── Ring with centered label (layout helper) ──────────────────────────────────
export function RingCard({ value, label, sublabel, segments, size = 80, thickness = 9, radial = false, pct, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        {radial
          ? <RadialRing pct={pct} size={size} thickness={thickness} color={color} />
          : <DonutChart segments={segments} size={size} thickness={thickness} />
        }
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontWeight: 700,
            fontSize: size > 70 ? 16 : 13,
            color: 'var(--text-primary)', lineHeight: 1,
          }}>
            {value}
          </span>
          {sublabel && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: TC.muted, marginTop: 2 }}>
              {sublabel}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: TC.muted, letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
      )}
    </div>
  )
}
