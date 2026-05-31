import { motion } from 'framer-motion'
import { normaliseSide, getStakeholderSummary } from '../lib/bothSidesUtils'

const cardContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
}

const cardItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

export function SidePanel({ side, data, className = '' }) {
  const normalised = normaliseSide(data) // [UI B-1] coerce legacy string[] into rich shape
  const stakeholderSummary = getStakeholderSummary(data) || normalised.stakeholders
  const isFor = side === 'for'

  const headerLabel = isFor ? 'Arguments For' : 'Arguments Against'
  const borderClass = isFor
    ? 'border-l-[var(--side-for-border)]'
    : 'border-l-[var(--signal)]'
  const headerColorClass = isFor
    ? 'text-[var(--side-for-header)]'
    : 'text-[var(--side-against-header)]'

  return (
    <article
      className={`rounded-none border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 ${className}`}
      aria-labelledby={`side-panel-${side}-heading`}
    >
      {/* Side header bar */}
      <header className={`border-l-4 ${borderClass} pl-5`}>
        <h2
          id={`side-panel-${side}-heading`}
          className={`font-mono text-xs font-bold uppercase tracking-[.12em] ${headerColorClass}`}
        >
          {headerLabel}
        </h2>
        {stakeholderSummary && (
          <p className="mt-2 text-sm italic text-[var(--muted)]">{stakeholderSummary}</p>
        )}
      </header>

      {/* Core values strip */}
      {normalised.core_values && (
        <div className="mt-6 border-t border-[var(--border)] pt-5">
          <p className="font-mono text-[9px] uppercase tracking-[.15em] text-[var(--muted)]">
            Why they believe this
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{normalised.core_values}</p>
        </div>
      )}

      {/* Argument cards */}
      {normalised.arguments?.length > 0 && (
        <motion.div
          className="mt-4 space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0"
          variants={cardContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {normalised.arguments.map((arg, i) => (
            <motion.div
              key={`${side}-arg-${i}`}
              variants={cardItem}
              className="border border-[var(--argument-border)] bg-[var(--argument-bg)] p-5 sm:p-6"
            >
              <div className="flex items-start gap-4">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--signal-muted)] font-mono text-xs font-bold text-[var(--signal)]"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  {arg.heading ? (
                    <h3 className="font-heading text-xl leading-tight text-[var(--text-hi)]">
                      {arg.heading}
                    </h3>
                  ) : null}
                  <p
                    className={`text-sm leading-relaxed text-[var(--muted)] ${arg.heading ? 'mt-2' : ''}`}
                  >
                    {arg.detail}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Notable examples strip */}
      {normalised.notable_examples && (
        <div className="mt-6 border-t border-[var(--border)] pt-5">
          <p className="font-mono text-[9px] uppercase tracking-[.15em] text-[var(--muted)]">
            In practice
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">
            {normalised.notable_examples}
          </p>
        </div>
      )}

      {/* Objection card */}
      {normalised.strongest_objection && (
        <div className="mt-6 rounded-none border border-[var(--objection-border)] bg-[var(--objection-bg)] p-5">
          <p className="font-mono text-[9px] uppercase tracking-[.15em] text-[var(--signal)]">
            Hardest challenge to answer
          </p>
          <p className="mt-2 text-sm italic leading-relaxed text-[var(--muted)]">
            {normalised.strongest_objection}
          </p>
        </div>
      )}
    </article>
  )
}
