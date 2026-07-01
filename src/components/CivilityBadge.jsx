import { motion } from 'framer-motion'

function tone(score) {
  if (score <= 50) return 'text-[var(--amber-glow)] bg-[rgba(245,158,11,.12)]'
  return 'text-[var(--muted)] bg-[var(--surface-hi)]'
}

export function CivilityBadge({ value, className = '' }) {
  const v = Math.min(100, Math.max(0, Math.round(value)))
  return (
    <motion.span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-body font-semibold uppercase tracking-wide shadow-[var(--shadow-pill)] ${tone(v)} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      Civility {v}
    </motion.span>
  )
}
