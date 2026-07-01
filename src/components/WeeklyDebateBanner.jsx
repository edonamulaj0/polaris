import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { getWeeklyDebateLabel } from '../lib/weeklyDebate'

export function WeeklyDebateBanner({ className = '' }) {
  const info = getWeeklyDebateLabel()
  if (!info) return null

  const { debate, weekLabel, headline } = info

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`relative overflow-hidden border border-[var(--signal)]/40 bg-[var(--surface)] ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--signal)]/8 via-transparent to-transparent" />
      <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[var(--signal)]">
            {headline} · {weekLabel}
          </p>
          <h2 className="font-heading mt-2 text-xl font-semibold leading-snug text-[var(--text-hi)] sm:text-2xl">
            {debate.title}
          </h2>
          <p className="font-body mt-3 line-clamp-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            {debate.explainer || debate.article?.lede}
          </p>
          <p className="font-mono mt-3 text-[10px] uppercase tracking-wide text-[var(--muted)]">
            {debate.topicArea} · moderated discussion
          </p>
        </div>
        <Link
          to={`/discussion/${debate.id}`}
          className="signal-glow-hover inline-flex shrink-0 items-center justify-center bg-[var(--signal)] px-8 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-[var(--signal-on)]"
        >
          Join the debate →
        </Link>
      </div>
    </motion.section>
  )
}
