import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'

const segmentSpring = { type: 'spring', stiffness: 120, damping: 18, mass: 0.8 }

export function StanceBar({
  distribution,
  commentCount = null,
  className = '',
  showTooltip = true,
}) {
  const { for: forPct, against: againstPct, neutral: neutralPct } = distribution
  const [hovered, setHovered] = useState(null)

  const counts = useMemo(() => {
    const n = commentCount && commentCount > 0 ? commentCount : null
    if (!n) return null
    return {
      for: Math.round((forPct / 100) * n),
      against: Math.round((againstPct / 100) * n),
      neutral: Math.max(0, n - Math.round((forPct / 100) * n) - Math.round((againstPct / 100) * n)),
    }
  }, [commentCount, forPct, againstPct])

  const segments = [
    { key: 'for',     label: 'For',     pct: forPct,     color: 'bg-[var(--for)]' },
    { key: 'against', label: 'Against', pct: againstPct, color: 'bg-[var(--signal)]' },
    { key: 'neutral', label: 'Neutral', pct: neutralPct, color: 'bg-[var(--neutral)]' },
  ]

  return (
    <div className={`relative ${className}`}>
      {showTooltip && hovered && (
        <div
          className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-none border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text)] shadow-[var(--shadow-card)]"
          role="tooltip"
        >
          {segments.find((s) => s.key === hovered)?.label}:{' '}
          {segments.find((s) => s.key === hovered)?.pct}%
          {counts && (
            <span className="text-[var(--muted)]">
              {' '}
              (~{counts[hovered]} comments)
            </span>
          )}
        </div>
      )}
      <div className="flex h-2.5 w-full overflow-hidden rounded-none bg-[var(--surface-hi)] ring-1 ring-[var(--border)]">
        {segments.map((s, i) => (
          <motion.div
            key={s.key}
            className={`min-w-0 ${s.color} h-full shrink-0 cursor-default opacity-95`}
            initial={{ width: 0 }}
            animate={{ width: `${s.pct}%` }}
            transition={{ ...segmentSpring, delay: i * 0.06 }}
            onMouseEnter={() => setHovered(s.key)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </div>
    </div>
  )
}
