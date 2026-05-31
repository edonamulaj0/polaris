import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai'
import { CivilityBadge } from './CivilityBadge'
import { StanceBar } from './StanceBar'
import { VerifiedBadge } from './VerifiedBadge'
import { VoteWidget } from './VoteWidget'
import { useUserStore } from '../stores/userStore'
import { formatSource } from '../lib/displayUtils'

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

export function DiscussionCard({ post, variant = 'default' }) {
  const isExplore = variant === 'explore'
  const dist = post.stanceDistribution || { for: 33, against: 34, neutral: 33 }
  const likedIds = useUserStore((s) => s.likedDiscussionIds)
  const liked = useMemo(
    () => (Array.isArray(likedIds) ? likedIds : []).includes(post.id),
    [likedIds, post.id],
  )
  const toggleLike = useUserStore((s) => s.toggleDiscussionLike)

  const metaPad = isExplore ? 'px-6 py-4' : 'px-4 py-2.5 sm:px-5 sm:pb-2.5'
  const bodyPad = isExplore ? 'p-7 lg:p-8' : 'p-5 sm:p-6' // [UI P-1] increased card body padding
  const titleClass = isExplore
    ? 'font-heading line-clamp-2 text-2xl leading-snug text-[var(--text-hi)] group-hover:text-[var(--signal)]'
    : 'font-heading line-clamp-2 text-xl leading-tight text-[var(--text-hi)] group-hover:text-[var(--signal)]'
  const likeBtnClass = 'h-12 w-12 shrink-0' // [UI P-1] enlarged touch target

  return (
    <motion.div variants={cardVariants} className="h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-none border border-[var(--border)] border-t-2 border-t-[var(--signal)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-[transform,box-shadow,border-color] duration-300 hover:border-t-[var(--signal)] hover:shadow-[var(--shadow-hover)]">
        <Link
          to={`/discussion/${post.id}`}
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
              {formatSource(post.subreddit) || post.source}
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
          className="border-t border-[var(--border)] p-5 sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <VoteWidget
            compact
            postId={post.id}
            postTitle={post.title}
            category={post.category}
            stanceDistribution={dist}
          />
          <div className="mt-4 flex justify-end">
            <motion.button
              type="button"
              aria-label={liked ? 'Unlike' : 'Like discussion'}
              className={`flex ${likeBtnClass} items-center justify-center rounded-none ring-1 transition-colors ${
                liked
                  ? 'bg-[var(--signal-muted)] text-[var(--signal)] ring-[var(--signal)]/40'
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
