import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useFeedStore } from '../stores/feedStore'

export function TrendingStrip() {
  const posts = useFeedStore((s) => s.posts)

  const trending = useMemo(
    () =>
      [...posts]
        .filter((p) => !p.hidden && p.verified !== false)
        .sort((a, b) => (b.num_comments || 0) - (a.num_comments || 0))
        .slice(0, 10),
    [posts],
  )

  if (trending.length === 0) return null

  return (
    <nav aria-label="Trending discussions" className="w-full">
      <p className="mb-3 px-4 font-mono text-[10px] uppercase tracking-[.15em] text-[var(--muted)]">
        Trending
      </p>
      <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-3">
        {trending.map((post, i) => (
          <Link
            key={post.id}
            to={`/discussion/${post.id}`}
            className="flex max-w-[200px] shrink-0 flex-col gap-1 rounded-none border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--signal)]/40"
          >
            <span className="font-mono text-[10px] font-bold text-[var(--signal)]">#{i + 1}</span>
            <span className="line-clamp-2 text-sm font-medium leading-snug text-[var(--text)]">
              {post.title}
            </span>
            <span className="font-mono text-[9px] uppercase text-[var(--muted)]">
              {post.category || 'Technology'}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
