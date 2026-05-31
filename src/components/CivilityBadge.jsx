import { motion } from 'framer-motion'

function tone(score) {
  if (score <= 50) return 'text-[var(--signal)] ring-[var(--signal)]/40 bg-[var(--signal-muted)]'
  return 'text-[var(--muted)] ring-[var(--border)] bg-[var(--surface-hi)]'
}

export function CivilityBadge({ value, className = '' }) {
  const v = Math.min(100, Math.max(0, Math.round(value)))
  return (
    <motion.span
      className={`inline-flex items-center rounded-none px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wide ring-1 ${tone(v)} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      Civility {v}
    </motion.span>
  )
}
