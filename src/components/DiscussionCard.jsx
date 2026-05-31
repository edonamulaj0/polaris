import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai'
import { CivilityBadge } from './CivilityBadge'
import { StanceBar } from './StanceBar'
import { VerifiedBadge } from './VerifiedBadge'
import { useUserStore } from '../stores/userStore'

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
}

function formatTime(createdUtc) {
  const sec = Math.max(0, Math.floor(Date.now() / 1000 - (createdUtc || 0)))
  if (sec < 3600) return `${Math.max(1, Math.floor(sec / 60))}m ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
  return `${Math.floor(sec / 86400)}d ago`
}

function formatScore(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function stanceButtonClass(stance, selected) {
  if (stance === 'For') {
    return selected
      ? 'bg-[var(--stance-for-selected-bg)] text-[var(--stance-for-selected-text)] ring-[var(--stance-for-selected-bg)]'
      : 'bg-[var(--stance-for-bg)] text-[var(--stance-for-text)] ring-[var(--border)] hover:ring-[var(--stance-for-text)]/35'
  }
  if (stance === 'Against') {
    return selected
      ? 'bg-[var(--signal)] text-[var(--signal-on)] ring-[var(--signal)]'
      : 'bg-[var(--stance-against-bg)] text-[var(--stance-against-text)] ring-[var(--border)] hover:ring-[var(--stance-against-text)]/35'
  }
  return selected
    ? 'bg-[var(--signal)] text-[var(--signal-on)] ring-[var(--signal)]'
    : 'bg-[var(--stance-neutral-bg)] text-[var(--stance-neutral-text)] ring-[var(--border)] hover:text-[var(--text)]'
}

export function DiscussionCard({ post, variant = 'default' }) {
  const isExplore = variant === 'explore'
  const [stance, setStance] = useState(null)
  const dist = post.stanceDistribution || { for: 33, against: 34, neutral: 33 }
  const likedIds = useUserStore((s) => s.likedDiscussionIds)
  const liked = useMemo(
    () => (Array.isArray(likedIds) ? likedIds : []).includes(post.id),
    [likedIds, post.id],
  )
  const toggleLike = useUserStore((s) => s.toggleDiscussionLike)

  const metaPad = isExplore ? 'px-6 py-4' : 'px-4 py-2.5 sm:px-5 sm:pb-2.5'
  const bodyPad = isExplore ? 'p-6 lg:p-7' : 'p-4 sm:p-5'
  const votePad = isExplore ? 'px-6 py-5 lg:px-7 lg:py-6' : 'px-4 pb-4 pt-3 sm:px-5'
  const titleClass = isExplore
    ? 'font-heading line-clamp-2 text-2xl leading-snug text-[var(--text-hi)] group-hover:text-[var(--signal)]'
    : 'font-heading line-clamp-2 text-xl leading-tight text-[var(--text-hi)] group-hover:text-[var(--signal)]'
  const stanceBtnClass = isExplore
    ? 'rounded-none px-4 py-2.5 text-sm font-semibold ring-1 transition-colors'
    : 'rounded-none px-3 py-1.5 text-xs font-semibold ring-1 transition-colors'
  const likeBtnClass = isExplore ? 'h-11 w-11' : 'h-10 w-10'

  return (
    <motion.div variants={cardVariants} className="h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-none border border-[var(--border)] border-t-2 border-t-[var(--signal)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-[transform,box-shadow,border-color] duration-300 hover:border-t-[var(--signal)] hover:shadow-[var(--shadow-hover)]">
        <Link
          to={`/discussion/${post.id}${stance ? `?stance=${encodeURIComponent(stance)}` : ''}`}
          state={{ preferredStance: stance }}
          className="group flex min-h-0 flex-1 flex-col outline-none"
        >
          <div className={`flex flex-wrap items-center gap-2.5 border-b border-[var(--border)] ${metaPad}`}>
            {post.category && (
              <span className="rounded-none bg-[var(--surface-hi)] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--text-hi)] ring-1 ring-[var(--border)]">
                {post.category}
              </span>
            )}
            {post.verified && <VerifiedBadge />}
            <span className="font-mono text-[10px] text-[var(--muted)]">
              {post.subreddit || post.source}
            </span>
            <span className="ml-auto font-mono text-[10px] text-[var(--muted)]">
              {formatTime(post.createdUtc)}
            </span>
          </div>
          <div className={`relative w-full shrink-0 overflow-hidden bg-[var(--surface-hi)] ${isExplore ? 'aspect-[2/1] lg:aspect-[21/9]' : 'aspect-[16/9]'}`}>
            <img
              src={post.imageUrl || post.thumbnail || 'https://picsum.photos/seed/polaris/960/520'}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--page)]/90 via-transparent to-transparent" />
          </div>
          <div className={`flex flex-1 flex-col ${bodyPad}`}>
            <h3 className={titleClass}>
              {post.title}
            </h3>
            <div className={isExplore ? 'mt-6' : 'mt-4'}>
              <StanceBar distribution={dist} commentCount={isExplore ? null : post.num_comments} />
            </div>
            {!isExplore && (
              <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[10px] text-[var(--muted)]">
                <span>💬 {post.num_comments ?? 0}</span>
                <span>↑ {formatScore(post.score ?? 0)}</span>
                <CivilityBadge value={post.civility ?? 70} />
              </div>
            )}
          </div>
        </Link>
        <div
          className={`border-t border-[var(--border)] ${votePad}`}
          onClick={(e) => e.stopPropagation()}
        >
          <span className={`mb-3 block font-mono font-bold uppercase tracking-wide text-[var(--muted)] ${isExplore ? 'text-[11px]' : 'text-[10px]'}`}>
            Your stance before opening
          </span>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className={`flex flex-wrap ${isExplore ? 'gap-3' : 'gap-2'}`}>
              {['For', 'Against', 'Neutral'].map((s) => (
                <motion.button
                  key={s}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setStance(s)
                  }}
                  className={`${stanceBtnClass} ${stanceButtonClass(s, stance === s)}`}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {s}
                </motion.button>
              ))}
            </div>
            <motion.button
              type="button"
              aria-label={liked ? 'Unlike' : 'Like discussion'}
              className={`flex ${likeBtnClass} shrink-0 items-center justify-center rounded-none ring-1 transition-colors ${
                liked
                  ? 'text-[var(--signal)] ring-[var(--signal)]/40 bg-[var(--signal-muted)]'
                  : 'text-[var(--muted)] ring-[var(--border)] hover:text-[var(--text)]'
              }`}
              onClick={(e) => {
                e.preventDefault()
                toggleLike(post.id, post.title)
              }}
              whileTap={{ scale: 0.92 }}
            >
              {liked ? <AiFillHeart className="h-5 w-5" /> : <AiOutlineHeart className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
