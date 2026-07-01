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
    <div className={`relative w-full ${className}`}>
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
      <div className="stance-slot w-full">
        <div className="relative flex h-full w-full overflow-hidden rounded-full">
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, var(--spectrum-start) 0%, var(--spectrum-mid) 50%, var(--spectrum-end) 100%)',
            }}
            aria-hidden
          />
          {segments.map((s, i) => (
            <motion.div
              key={s.key}
              className="relative z-[1] h-full shrink-0 cursor-default"
              initial={{ width: 0 }}
              animate={{ width: `${s.pct}%` }}
              transition={{ ...segmentSpring, delay: i * 0.06 }}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className="h-full w-full transition-opacity"
                style={{
                  background: hovered === s.key ? 'rgba(255,255,255,.12)' : 'transparent',
                  boxShadow: i > 0 ? 'inset 1px 0 0 rgba(255,255,255,.15)' : 'none',
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
