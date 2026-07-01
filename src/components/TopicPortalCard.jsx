import { motion } from 'framer-motion'

/**
 * Large topic portal card — entry point to a subject-area feed.
 * Text sits on a solid surface panel (not over the photo) for title visibility and WCAG contrast.
 * @param {{ topic: { id: string, label: string, tagline: string, imageSeed: string }, onClick: () => void }} props
 */
export function TopicPortalCard({ topic, onClick }) {
  const imageUrl = `https://picsum.photos/seed/${topic.imageSeed}/1200/600`

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`Browse ${topic.label} debates`}
      className="group flex h-full w-full flex-col overflow-hidden rounded-none border border-[var(--border)] border-t-2 border-t-[var(--border)] bg-[var(--surface)] text-left shadow-[var(--shadow-card)] transition-[border-color,box-shadow] duration-300 hover:border-t-[var(--signal)] hover:shadow-[var(--shadow-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--signal)]"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-[var(--surface-hi)]">
        <motion.img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[var(--overlay)]"
          aria-hidden
        />
      </div>

      <div className="flex flex-1 flex-col border-t border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[var(--signal)]">
          Subject area
        </p>
        <h2 className="font-display mt-2 text-3xl uppercase leading-none tracking-wide text-[var(--text-hi)] sm:text-4xl">
          {topic.label}
        </h2>
        <p className="font-body mt-3 flex-1 text-sm leading-relaxed text-[var(--text)] sm:text-base">
          {topic.tagline}
        </p>
        <span className="signal-glow-hover mt-5 inline-flex w-fit items-center bg-[var(--signal)] px-6 py-2.5 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--signal-on)]">
          Browse debates →
        </span>
      </div>
    </motion.button>
  )
}
