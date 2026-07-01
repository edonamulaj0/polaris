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
    { key: 'for', label: 'For', pct: forPct },
    { key: 'against', label: 'Against', pct: againstPct },
    { key: 'neutral', label: 'Neutral', pct: neutralPct },
  ]

  return (
    <div className={`relative ${className}`}>
      {showTooltip && hovered && (
        <div
          className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] shadow-[var(--shadow-card)]"
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
      <div className="spectrum-track relative flex h-3 w-full">
        {segments.map((s, i) => (
          <motion.div
            key={s.key}
            className="relative min-w-0 h-full shrink-0 cursor-default"
            initial={{ width: 0 }}
            animate={{ width: `${s.pct}%` }}
            transition={{ ...segmentSpring, delay: i * 0.06 }}
            onMouseEnter={() => setHovered(s.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className="absolute inset-0 bg-black/10 transition-opacity"
              style={{ opacity: hovered === s.key ? 0.5 : 1 }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
