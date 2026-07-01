import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { DebateSaveSubscribe } from './DebateSaveSubscribe'
import { CivilityBadge } from './CivilityBadge'
import { StanceBar } from './StanceBar'
import { VerifiedBadge } from './VerifiedBadge'
import { VoteWidget } from './VoteWidget'
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

  const metaPad = isExplore ? 'px-6 py-4' : 'px-5 py-3 sm:px-6'
  const bodyPad = isExplore ? 'p-7 lg:p-8' : 'p-5 sm:p-6'
  const titleClass = isExplore
    ? 'font-heading line-clamp-2 text-2xl leading-snug text-[var(--text-hi)] group-hover:text-[var(--gold)] transition-colors'
    : 'font-heading line-clamp-2 text-xl leading-tight text-[var(--text-hi)] group-hover:text-[var(--gold)] transition-colors'

  return (
    <motion.div variants={cardVariants} className="h-full">
      <div className="elevated elevated-hover flex h-full flex-col overflow-hidden rounded-3xl bg-[var(--surface)] transition-[transform,box-shadow] duration-300">
        <Link
          to={`/discussion/${post.id}`}
          className="group flex min-h-0 flex-1 flex-col outline-none"
        >
          <div className={`flex flex-wrap items-center gap-2.5 ${metaPad}`}>
            {post.category && (
              <span className="rounded-full bg-[var(--surface-hi)] px-3 py-1 font-body text-[10px] font-semibold uppercase tracking-wide text-[var(--text-hi)] shadow-[var(--shadow-pill)]">
                {post.category}
              </span>
            )}
            {post.verified && <VerifiedBadge />}
            <span className="font-body text-[10px] text-[var(--muted)]">
              {formatSource(post.subreddit) || post.source}
            </span>
            <span className="ml-auto font-body text-[10px] text-[var(--muted)]">
              {formatTime(post.createdUtc)}
            </span>
          </div>
          <div className={`relative mx-4 overflow-hidden rounded-2xl bg-[var(--surface-hi)] sm:mx-5 ${isExplore ? 'aspect-[2/1] lg:aspect-[21/9]' : 'aspect-[16/9]'}`}>
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
              <div className="mt-4 flex flex-wrap items-center gap-3 font-body text-[10px] text-[var(--muted)]">
                <span>💬 {post.num_comments ?? 0}</span>
                <span>↑ {formatScore(post.score ?? 0)}</span>
                <CivilityBadge value={post.civility ?? 70} />
              </div>
            )}
          </div>
        </Link>
        <div
          className="px-5 pb-5 pt-2 sm:px-6 sm:pb-6"
          onClick={(e) => e.stopPropagation()}
        >
          <VoteWidget
            compact
            postId={post.id}
            postTitle={post.title}
            category={post.category}
            stanceDistribution={dist}
          />
          <DebateSaveSubscribe discussionId={post.id} title={post.title} className="mt-4" />
        </div>
      </div>
    </motion.div>
  )
}
