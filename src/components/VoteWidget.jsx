import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { StanceBar } from './StanceBar'
import { useUserStore } from '../stores/userStore'
import { useFeedStore } from '../stores/feedStore'

const STANCES = [
  { key: 'For', label: 'Pro' },
  { key: 'Against', label: 'Against' },
  { key: 'Neutral', label: 'Neutral' },
]

function stanceButtonClasses(stance, selected, compact) {
  const sizeClass = compact
    ? 'min-h-[44px] px-5 py-3 text-sm font-semibold' // [UI V-2] card footer touch target
    : 'min-h-[44px] min-w-[120px] px-8 py-4 text-base font-bold' // [UI V-2] full widget touch target

  if (stance === 'For') {
    return selected
      ? `${sizeClass} bg-[var(--vote-for-active)] text-[var(--vote-for-active-text)] ring-0`
      : `${sizeClass} bg-[var(--stance-for-bg)] text-[var(--stance-for-text)] ring-1 ring-[var(--border)]`
  }
  if (stance === 'Against') {
    return selected
      ? `${sizeClass} bg-[var(--vote-against-active)] text-[var(--vote-against-active-text)] ring-0`
      : `${sizeClass} bg-[var(--stance-against-bg)] text-[var(--stance-against-text)] ring-1 ring-[var(--border)]`
  }
  return selected
    ? `${sizeClass} bg-[var(--vote-neutral-active)] text-[var(--vote-neutral-active-text)] ring-0`
    : `${sizeClass} bg-[var(--stance-neutral-bg)] text-[var(--stance-neutral-text)] ring-1 ring-[var(--border)]`
}

function voteHighlightClass(stance) {
  if (stance === 'For') return 'text-[var(--stance-for-text)]'
  if (stance === 'Against') return 'text-[var(--signal)]'
  return 'text-[var(--stance-neutral-text)]'
}

export function VoteWidget({
  postId,
  postTitle,
  category,
  stanceDistribution,
  compact = false,
}) {
  const stanceHistory = useUserStore((s) => s.stanceHistory)
  const recordComment = useUserStore((s) => s.recordComment)
  const voteCount = useFeedStore((s) => s.posts.find((p) => p.id === postId)?.num_comments)

  const savedVote = useMemo(
    () => stanceHistory.find((h) => h.discussionId === postId)?.stance ?? null,
    [stanceHistory, postId],
  )

  const [currentVote, setCurrentVote] = useState(savedVote)

  useEffect(() => {
    setCurrentVote(savedVote) // [UI V-3] sync with store on mount / external updates
  }, [savedVote])

  const dist = stanceDistribution || { for: 33, against: 34, neutral: 33 }
  const hasVoted = Boolean(currentVote)

  function onVote(stance) {
    recordComment({
      discussionId: postId,
      title: postTitle,
      category,
      stance,
    })
    setCurrentVote(stance)
  }

  const layoutClass = compact
    ? 'flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3'
    : 'flex flex-col gap-3 sm:flex-row sm:gap-4' // [UI V-2] stack full-width below sm

  return (
    <div className={compact ? '' : 'w-full'}>
      {!compact && (
        <p className="mb-5 font-mono text-[10px] uppercase tracking-[.15em] text-[var(--muted)]">
          Where do you stand?
        </p>
      )}

      <div className={layoutClass}>
        {STANCES.map(({ key, label }) => (
          <motion.button
            key={key}
            type="button"
            onClick={() => onVote(key)}
            aria-pressed={currentVote === key}
            aria-label={`Vote ${label}`}
            whileTap={{ scale: 0.98 }}
            className={`w-full rounded-none ring-inset transition-colors sm:w-auto ${stanceButtonClasses(key, currentVote === key, compact)}`}
          >
            {label}
          </motion.button>
        ))}
      </div>

      {!compact && (
        <AnimatePresence>
          {hasVoted && (
            <motion.div
              key="post-vote"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-6 border-t border-[var(--border)] pt-5">
                <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">
                  Your vote:{' '}
                  <span className={`font-bold ${voteHighlightClass(currentVote)}`}>
                    {currentVote}
                  </span>
                </p>
                <StanceBar
                  distribution={dist}
                  commentCount={voteCount}
                  className="mt-3"
                  showTooltip
                />
                <p className="mt-2 font-mono text-[10px] text-[var(--muted)]">
                  {voteCount != null ? `${voteCount} votes` : 'Community distribution'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
