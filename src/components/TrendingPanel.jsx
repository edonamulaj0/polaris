import { motion, useSpring, useMotionValueEvent } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFeedStore } from '../stores/feedStore'
import { formatSource } from '../lib/displayUtils'

/** [EXP-3] category prop filters trending list to one topic */
export function TrendingPanel({ category = null }) {
  const posts = useFeedStore((s) => s.posts)
  const trending = useMemo(() => {
    return [...posts]
      .filter((p) => {
        if (p.hidden || p.verified === false) return false // [WRK-6]
        if (category === null) return true // [EXP-3]
        const label = p.category === 'Tech' ? 'Technology' : p.category // [CAT-2]
        return label === category // [EXP-3]
      })
      .sort((a, b) => (b.num_comments || 0) - (a.num_comments || 0))
      .slice(0, 8)
  }, [posts, category]) // [EXP-3]

  return (
    <aside className="rounded-none border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="font-display mb-2 text-sm uppercase tracking-widest text-[var(--text-hi)]">
        Trending
      </h2>
      <hr className="signal mb-4" />
      <ol className="space-y-3">
        {trending.map((p, i) => (
          <TrendingRow key={p.id} rank={i + 1} post={p} comments={p.num_comments || 0} />
        ))}
      </ol>
    </aside>
  )
}

function TrendingRow({ rank, post, comments }) {
  // [REFACTOR U-5] Always init spring at 0 — effect animates to target on mount/update
  const spring = useSpring(0, { stiffness: 120, damping: 18 })
  const [label, setLabel] = useState(comments)
  useMotionValueEvent(spring, 'change', (v) => setLabel(Math.round(v)))
  useEffect(() => {
    spring.set(comments)
  }, [comments, spring])

  return (
    <li>
      <Link
        to={`/discussion/${post.id}`}
        className="flex gap-3 rounded-none p-2 transition-colors hover:bg-[var(--surface-hi)]"
      >
        <span className="font-mono w-5 pt-0.5 text-sm text-[var(--signal)]">{rank}</span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium text-[var(--text)]">
            {post.title}
            {post.verified && (
              <span className="ml-1.5 font-mono text-[9px] text-[var(--signal)]">• ✓</span>
            )}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted)]">
            <span className="rounded-none bg-[var(--surface-hi)] px-1.5 py-0.5">
              {formatSource(post.subreddit) || post.source}
            </span>
            <motion.span key={label}>{label}</motion.span>
            <span>comments</span>
          </div>
        </div>
      </Link>
    </li>
  )
}
