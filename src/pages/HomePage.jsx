import { useMemo, useState } from 'react'
import { useFeedStore } from '../stores/feedStore'
import { InfiniteScrollFeed } from '../components/InfiniteScrollFeed'
import { SkeletonCard } from '../components/SkeletonCard'
import { FeedSortControls } from '../components/FeedSortControls'
import { TopicExplainerBanner } from '../components/TopicExplainerBanner'
import { TrendingStrip } from '../components/TrendingStrip'
import { WeeklyDebateBanner } from '../components/WeeklyDebateBanner'
import { orderPostsForDisplay } from '../lib/feedOrdering'

export function HomePage() {
  const loading = useFeedStore((s) => s.loading)
  const posts = useFeedStore((s) => s.posts)
  const [sort, setSort] = useState('relevance')

  const visiblePosts = useMemo(
    () => posts.filter((p) => !p.hidden && p.verified !== false),
    [posts],
  )

  const displayPosts = useMemo(
    () => orderPostsForDisplay(visiblePosts, sort, visiblePosts),
    [visiblePosts, sort],
  )

  const hasGdelt = useMemo(
    () => visiblePosts.some((p) => p.source === 'gdelt'),
    [visiblePosts],
  )

  if (loading && !posts.length) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8">
        <header className="mb-8 border-b border-[var(--border)] pb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[9px] uppercase tracking-[.18em] text-[var(--signal)]">
              Daily Intelligence Brief
            </span>
            <span className="font-mono text-[9px] text-[var(--muted)] uppercase tracking-wide">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-widest text-[var(--text-hi)] leading-none">
            Today&apos;s Debates
          </h1>
          <hr className="signal mt-4" />
          <p className="mt-3 text-sm text-[var(--muted)] font-body">
            AI-gathered discussions on technology & science — both sides explained, human-verified.
          </p>
        </header>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div>
      <header className="mb-8 border-b border-[var(--border)] pb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[9px] uppercase tracking-[.18em] text-[var(--signal)]">
            Daily Intelligence Brief
          </span>
          <span className="font-mono text-[9px] text-[var(--muted)] uppercase tracking-wide">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-widest text-[var(--text-hi)] leading-none">
          Today&apos;s Debates
        </h1>
        <hr className="signal mt-4" />
        <p className="mt-3 text-sm text-[var(--muted)] font-body">
          Curated debates and AI-gathered news — both sides explained, human-verified where noted.
        </p>
      </header>
      {hasGdelt && <TopicExplainerBanner />}
      <WeeklyDebateBanner className="mb-8" />
      <div className="mb-8 -mx-4 sm:-mx-6 lg:hidden">
        <TrendingStrip />
      </div>
      <FeedSortControls value={sort} onChange={setSort} className="mb-6" />
      <InfiniteScrollFeed
        posts={displayPosts}
        className="grid grid-cols-1 gap-8 xl:grid-cols-2 xl:gap-10"
      />
    </div>
  )
}
