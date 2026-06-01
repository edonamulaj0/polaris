import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CATEGORIES } from '../data/categories'
import { useFeedStore } from '../stores/feedStore'
import { TopicPortalCard } from '../components/TopicPortalCard'
import { InfiniteScrollFeed } from '../components/InfiniteScrollFeed'
import { TrendingPanel } from '../components/TrendingPanel'
import { SkeletonCard } from '../components/SkeletonCard'

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.22 },
}

export function ExplorePage() {
  const [activeCat, setActiveCat] = useState(null) // [EXP-1] null = landing portal
  const posts = useFeedStore((s) => s.posts)
  const loading = useFeedStore((s) => s.loading)
  const fetchByCategory = useFeedStore((s) => s.fetchByCategory)
  const bootstrap = useFeedStore((s) => s.bootstrap)

  useEffect(() => {
    if (!activeCat) return
    fetchByCategory(activeCat) // [EXP-2]
  }, [activeCat, fetchByCategory])

  useEffect(() => {
    return () => {
      bootstrap() // [EXP-2] restore full feed when leaving Explore
    }
  }, [bootstrap])

  const visiblePosts = useMemo(
    () => posts.filter((p) => !p.hidden && p.verified !== false),
    [posts],
  )

  function handleBack() {
    setActiveCat(null) // [EXP-2]
    bootstrap()
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {activeCat === null ? (
          <motion.div key="portal" {...fade}>
            <header className="mb-10 border-b border-[var(--border)] pb-8 lg:mb-12 lg:pb-10">
              <h1 className="font-display text-4xl uppercase tracking-widest text-[var(--text-hi)] sm:text-5xl">
                Explore
              </h1>
              <hr className="signal mt-4" />
              <p className="font-body mt-4 max-w-2xl text-base leading-relaxed text-[var(--muted)]">
                Choose a topic area to browse curated articles on technology, science, and nature.
              </p>
            </header>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {CATEGORIES.map((cat) => (
                <TopicPortalCard
                  key={cat}
                  category={cat}
                  onClick={() => setActiveCat(cat)} // [EXP-1]
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key={`feed-${activeCat}`} {...fade}>
            <button
              type="button"
              onClick={handleBack}
              className="mb-8 font-mono text-[10px] uppercase tracking-[.15em] text-[var(--muted)] transition-colors hover:text-[var(--signal)]"
            >
              ← Back to topics
            </button>

            <header className="mb-8 border-b border-[var(--border)] pb-8">
              <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--signal)]">
                {activeCat}
              </p>
              <h1 className="font-display mt-2 text-5xl uppercase tracking-widest text-[var(--text-hi)]">
                All about {activeCat}
              </h1>
              <hr className="signal mt-4" />
              <p className="font-mono mt-4 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                {visiblePosts.length} article{visiblePosts.length === 1 ? '' : 's'}
              </p>
            </header>

            {loading && !posts.length ? (
              <div className="flex flex-col gap-8">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0">
                  {visiblePosts.length > 0 ? (
                    <InfiniteScrollFeed posts={visiblePosts} />
                  ) : (
                    <p className="py-16 text-center text-base text-[var(--muted)]">
                      No articles in this topic yet.
                    </p>
                  )}
                </div>
                <div className="hidden lg:block">
                  <div className="sticky top-20">
                    <TrendingPanel category={activeCat} /> {/* [EXP-3] */}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
