import { motion } from 'framer-motion'

/**
 * Large topic portal card — entry point to a subject-area feed.
 * @param {{ topic: { id: string, label: string, tagline: string, imageSeed: string }, onClick: () => void }} props
 */
export function TopicPortalCard({ topic, onClick }) {
  const imageUrl = `https://picsum.photos/seed/${topic.imageSeed}/1200/600`

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-none border border-[var(--border)] border-t-2 border-t-[var(--border)] bg-[var(--surface)] text-left shadow-[var(--shadow-card)] transition-[border-color] duration-300 hover:border-t-[var(--signal)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--signal)]"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      <div className="relative aspect-[3/2] overflow-hidden sm:aspect-[2/1]">
        <motion.img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--page)] via-[var(--page)]/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--signal)]">
            Subject area
          </p>
          <h2 className="font-display mt-2 text-3xl uppercase leading-tight text-[var(--text-hi)] sm:text-4xl lg:text-5xl">
            {topic.label}
          </h2>
          <p className="font-body mt-3 max-w-md text-base leading-relaxed text-[var(--muted)]">
            {topic.tagline}
          </p>
          <span className="signal-glow-hover mt-5 inline-block bg-[var(--signal)] px-8 py-3 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--signal-on)]">
            Browse debates →
          </span>
        </div>
      </div>
    </motion.button>
  )
}
