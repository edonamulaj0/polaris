import { motion, useSpring, useMotionValueEvent } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFeedStore } from '../stores/feedStore'
import { postMatchesTopic } from '../data/exploreTopics'
import { formatSource } from '../lib/displayUtils'

export function TrendingPanel({ category = null, posts: postsProp = null }) {
  const storePosts = useFeedStore((s) => (s.allPosts.length ? s.allPosts : s.posts))
  const posts = postsProp ?? storePosts
  const trending = useMemo(() => {
    return [...posts]
      .filter((p) => {
        if (p.hidden || p.verified === false) return false
        if (category === null) return true
        return postMatchesTopic(p, category)
      })
      .sort((a, b) => (b.num_comments || 0) - (a.num_comments || 0))
      .slice(0, 8)
  }, [posts, category])

  return (
    <aside className="rounded-3xl bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <h2 className="font-heading mb-2 text-lg font-semibold tracking-wide text-[var(--text-hi)]">
        Trending
      </h2>
      <hr className="signal mb-4" />
      <ol className="space-y-1">
        {trending.map((p, i) => (
          <TrendingRow key={p.id} rank={i + 1} post={p} comments={p.num_comments || 0} />
        ))}
      </ol>
    </aside>
  )
}

function TrendingRow({ rank, post, comments }) {
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
        className="flex gap-3 rounded-2xl p-2.5 transition-colors hover:bg-[var(--surface-hi)]"
      >
        <span className="font-body w-5 pt-0.5 text-sm font-semibold text-[var(--gold)]">{rank}</span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium text-[var(--text)]">
            {post.title}
            {post.verified && (
              <span className="ml-1.5 text-[9px] text-[var(--gold)]">• ✓</span>
            )}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted)]">
            <span className="rounded-full bg-[var(--surface-hi)] px-2 py-0.5">
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
