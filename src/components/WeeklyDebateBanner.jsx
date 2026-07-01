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
      className={`relative overflow-hidden rounded-3xl bg-[var(--surface)] shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(244,208,104,.08)] via-transparent to-[rgba(13,115,119,.06)]" />
      <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="min-w-0 flex-1">
          <p className="font-body text-[10px] font-semibold uppercase tracking-[.18em] text-[var(--gold)]">
            {headline} · {weekLabel}
          </p>
          <h2 className="font-heading mt-2 text-xl font-semibold leading-snug text-[var(--text-hi)] sm:text-2xl">
            {debate.title}
          </h2>
          <p className="font-body mt-3 line-clamp-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            {debate.explainer || debate.article?.lede}
          </p>
          <p className="font-body mt-3 text-[10px] uppercase tracking-wide text-[var(--muted)]">
            {debate.topicArea} · moderated discussion
          </p>
        </div>
        <Link
          to={`/discussion/${debate.id}`}
          className="signal-glow-hover inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--gold)] px-8 py-3 text-xs font-semibold text-[var(--signal-on)] shadow-[0_4px_16px_-4px_rgba(244,208,104,.45)]"
        >
          Join the debate →
        </Link>
      </div>
    </motion.section>
  )
}
