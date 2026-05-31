import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useFeedStore } from '../stores/feedStore'
import { DiscussionCard } from '../components/DiscussionCard'
import { FeedSortControls } from '../components/FeedSortControls'
import { SkeletonCard } from '../components/SkeletonCard'
import { EXPLORE_CATEGORIES, orderPostsForDisplay } from '../lib/feedOrdering'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

export function ExplorePage() {
  const posts = useFeedStore((s) => s.posts)
  const loading = useFeedStore((s) => s.loading)
  const [cat, setCat] = useState('All')
  const [sort, setSort] = useState('relevance')

  const categoryCounts = useMemo(() => {
    // [REFACTOR D-5] Exclude hidden posts from all category counts
    const visible = posts.filter((p) => !p.hidden)
    const m = { All: visible.length }
    for (const c of EXPLORE_CATEGORIES) {
      if (c !== 'All') m[c] = 0
    }
    for (const p of visible) {
      const label = p.category || 'Society'
      if (m[label] === undefined) m[label] = 0
      m[label] += 1
    }
    return m
  }, [posts])

  const filtered = useMemo(() => {
    const visible = posts.filter((p) => !p.hidden)
    if (cat === 'All') return visible
    return visible.filter((p) => (p.category || 'Society') === cat)
  }, [posts, cat])

  const displayPosts = useMemo(
    () => orderPostsForDisplay(filtered, sort, posts),
    [filtered, sort, posts],
  )

  return (
    <div className="w-full">
      <header className="mb-10 border-b border-[var(--border)] pb-8 lg:mb-12 lg:pb-10">
        <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-widest text-[var(--text-hi)]">
          Explore
        </h1>
        <hr className="signal mt-4" />
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--muted)]">
          Pick a category, then sort by relevance, recency, or engagement. Same feed as Home—filtered
          here in the browser.
        </p>
      </header>

      {loading && !posts.length ? (
        <div className="flex flex-col gap-10">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] lg:items-start lg:gap-12 xl:gap-16">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <h2 className="font-mono text-[9px] uppercase tracking-[.15em] text-[var(--muted)]">
              Categories
            </h2>
            <ul className="mt-4 flex flex-col gap-1.5 border border-[var(--border)] rounded-none bg-[var(--surface)] p-2 lg:p-2.5">
              {EXPLORE_CATEGORIES.map((label) => {
                const count = categoryCounts[label] ?? 0
                const active = cat === label
                return (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => setCat(label)}
                      className={`flex w-full items-center justify-between gap-4 rounded-none px-4 py-3.5 text-left text-sm font-semibold transition-colors lg:py-4 ${
                        active
                          ? 'bg-[var(--surface-hi)] text-[var(--text)] ring-1 ring-[var(--signal)]'
                          : 'text-[var(--muted)] hover:bg-[var(--surface-hi)] hover:text-[var(--text)]'
                      }`}
                    >
                      <span>{label}</span>
                      <span
                        className={`tabular-nums text-xs font-bold ${
                          active ? 'text-[var(--signal)]' : 'text-[var(--muted)]'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          <div className="min-w-0">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <FeedSortControls value={sort} onChange={setSort} comfortable />
              <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--muted)]">
                {displayPosts.length} topic{displayPosts.length === 1 ? '' : 's'}
              </p>
            </div>
            <motion.div
              className="flex flex-col gap-10 lg:gap-12"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {displayPosts.map((p) => (
                <DiscussionCard key={p.id} post={p} variant="explore" />
              ))}
            </motion.div>
            {!displayPosts.length && (
              <p className="mt-16 text-center text-base text-[var(--muted)]">Nothing in this bucket yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
