import { motion } from 'framer-motion'

const PORTAL_META = {
  Technology: {
    imageUrl: 'https://picsum.photos/seed/polaris-tech/1200/600',
    tagline: 'AI, software, computing, and the systems that shape our world.',
  },
  Science: {
    imageUrl: 'https://picsum.photos/seed/polaris-sci/1200/600',
    tagline: 'Discoveries, research, and the questions that define our era.',
  },
  Nature: {
    imageUrl: 'https://picsum.photos/seed/polaris-nat/1200/600',
    tagline: 'Ecology, conservation, wildlife, and the living planet.',
  },
}

/**
 * [EXP-1] Large topic portal card — entry point to a category feed.
 * @param {{ category: 'Technology' | 'Science' | 'Nature', onClick: () => void }} props
 */
export function TopicPortalCard({ category, onClick }) {
  const meta = PORTAL_META[category] // [EXP-1]

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
          src={meta.imageUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--page)] via-[var(--page)]/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--signal)]">
            {category}
          </p>
          <h2 className="font-display mt-2 text-5xl uppercase leading-none text-[var(--text-hi)] sm:text-6xl">
            {category}
          </h2>
          <p className="font-body mt-3 max-w-md text-base leading-relaxed text-[var(--muted)]">
            {meta.tagline}
          </p>
          <span className="signal-glow-hover mt-5 inline-block bg-[var(--signal)] px-8 py-3 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--signal-on)]">
            Explore →
          </span>
        </div>
      </div>
    </motion.button>
  )
}
