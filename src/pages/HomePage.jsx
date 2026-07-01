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

  const headerBlock = (
    <header className="mb-10 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <span className="rounded-full bg-[var(--signal-muted)] px-3 py-1 font-body text-[10px] font-semibold uppercase tracking-[.14em] text-[var(--gold)]">
          Daily Intelligence Brief
        </span>
        <span className="font-body text-[10px] text-[var(--muted)]">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
      <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-wide text-[var(--text-hi)] leading-tight">
        Today&apos;s Debates
      </h1>
      <hr className="signal mt-5" />
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)] font-body">
        Curated debates and AI-gathered news — both sides explained, human-verified where noted.
      </p>
    </header>
  )

  if (loading && !posts.length) {
    return (
      <div className="flex flex-col gap-8">
        {headerBlock}
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div>
      {headerBlock}
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
