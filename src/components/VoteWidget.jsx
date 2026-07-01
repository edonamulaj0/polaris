import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StanceBar } from './StanceBar'
import { useUserStore } from '../stores/userStore'
import { useFeedStore } from '../stores/feedStore'
import { fetchVoteState } from '../services/voteApi'

const STANCES = [
  { key: 'For', label: 'Pro' },
  { key: 'Against', label: 'Against' },
  { key: 'Neutral', label: 'Neutral' },
]

function stanceButtonClasses(stance, selected, compact, disabled, mobileBar) {
  const sizeClass = mobileBar
    ? 'min-h-[40px] px-2 py-2.5 text-xs font-semibold rounded-full'
    : compact
      ? 'min-h-[44px] px-5 py-3 text-sm font-semibold rounded-full'
      : 'min-h-[44px] min-w-[120px] px-8 py-4 text-base font-bold rounded-full'

  const disabledClass = disabled ? ' opacity-50 cursor-not-allowed' : ''

  if (stance === 'For') {
    return selected
      ? `${sizeClass} bg-[var(--vote-for-active)] text-[var(--vote-for-active-text)] shadow-[var(--shadow-pill)]${disabledClass}`
      : `${sizeClass} bg-[var(--stance-for-bg)] text-[var(--stance-for-text)] shadow-[var(--shadow-pill)] hover:bg-[var(--stance-for-bg)]${disabledClass}`
  }
  if (stance === 'Against') {
    return selected
      ? `${sizeClass} bg-[var(--vote-against-active)] text-[var(--vote-against-active-text)] shadow-[var(--shadow-pill)]${disabledClass}`
      : `${sizeClass} bg-[var(--stance-against-bg)] text-[var(--stance-against-text)] shadow-[var(--shadow-pill)]${disabledClass}`
  }
  return selected
    ? `${sizeClass} bg-[var(--vote-neutral-active)] text-[var(--vote-neutral-active-text)] shadow-[var(--shadow-pill)]${disabledClass}`
    : `${sizeClass} bg-[var(--stance-neutral-bg)] text-[var(--stance-neutral-text)] shadow-[var(--shadow-pill)]${disabledClass}`
}

function voteHighlightClass(stance) {
  if (stance === 'For') return 'text-[var(--teal-calm)]'
  if (stance === 'Against') return 'text-[var(--amber-glow)]'
  return 'text-[var(--stance-neutral-text)]'
}

export function VoteWidget({
  postId,
  postTitle,
  category,
  stanceDistribution,
  compact = false,
  mobileBar = false,
}) {
  const googleIdToken = useUserStore((s) => s.googleIdToken)
  const clearExpiredGoogleSession = useUserStore((s) => s.clearExpiredGoogleSession)
  const openSignInPrompt = useUserStore((s) => s.openSignInPrompt)
  const isSignedIn = useUserStore((s) => s.isSignedIn)
  const canParticipate = useUserStore((s) => s.canParticipate)
  const recordStance = useUserStore((s) => s.recordStance)
  const updateVoteDistribution = useFeedStore((s) => s.updateVoteDistribution)
  const voteCount = useFeedStore((s) => s.posts.find((p) => p.id === postId)?.num_comments)

  const fallbackDist = stanceDistribution || { for: 33, against: 34, neutral: 33 }

  useEffect(() => {
    clearExpiredGoogleSession()
  }, [clearExpiredGoogleSession])

  const tokenValid = isSignedIn()

  const { data: voteState, isLoading } = useQuery({
    queryKey: ['vote-state', postId, googleIdToken],
    queryFn: () => fetchVoteState(postId, googleIdToken),
    staleTime: 30_000,
  })

  const [distribution, setDistribution] = useState(fallbackDist)
  const [currentVote, setCurrentVote] = useState(null)
  const [voteError, setVoteError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (voteState?.distribution) {
      setDistribution(voteState.distribution)
    } else {
      setDistribution(fallbackDist)
    }
  }, [voteState, fallbackDist.for, fallbackDist.against, fallbackDist.neutral])

  useEffect(() => {
    setCurrentVote(voteState?.userStance ?? null)
  }, [voteState?.userStance])

  const dist = distribution
  const hasVoted = Boolean(currentVote)
  const canVote = canParticipate() && !saving && !isLoading

  async function onVote(stance) {
    if (!tokenValid) {
      openSignInPrompt()
      return
    }
    if (!canParticipate()) {
      openSignInPrompt()
      return
    }
    if (!canVote) return
    setVoteError('')
    setSaving(true)
    const result = await recordStance({
      discussionId: postId,
      title: postTitle,
      category,
      stance,
    })
    setSaving(false)
    if (!result.ok) {
      setVoteError(result.message || 'Could not save your vote.')
      return
    }
    setCurrentVote(result.stance ?? stance)
    if (result.distribution) {
      setDistribution(result.distribution)
      updateVoteDistribution(postId, result.distribution)
    }
  }

  const layoutClass = mobileBar
    ? 'grid grid-cols-3 gap-2'
    : compact
      ? 'flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3'
      : 'flex flex-col gap-3 sm:flex-row sm:gap-4'

  return (
    <div className={compact || mobileBar ? '' : 'w-full'}>
      {!compact && !mobileBar && (
        <p className="mb-5 font-body text-[10px] uppercase tracking-[.15em] text-[var(--muted)]">
          Where do you stand?
        </p>
      )}

      {mobileBar && (
        <p className="mb-2 font-body text-[10px] uppercase tracking-[.15em] text-[var(--muted)]">
          Where do you stand?
        </p>
      )}

      {!tokenValid && (
        <p className="mb-3 text-xs text-[var(--muted)]">
          Sign in to register your stance on this debate.
        </p>
      )}
      {tokenValid && !canParticipate() && (
        <p className="mb-3 text-xs text-[var(--muted)]">
          Enter your date of birth once to vote (required for age verification).
        </p>
      )}

      <div className={layoutClass}>
        {STANCES.map(({ key, label }) => (
          <motion.button
            key={key}
            type="button"
            onClick={() => onVote(key)}
            disabled={isLoading || saving}
            aria-pressed={currentVote === key}
            aria-label={`Vote ${label}`}
            whileTap={{ scale: 0.98 }}
            className={`transition-colors ${mobileBar ? 'w-full min-w-0' : 'w-full sm:w-auto'} ${stanceButtonClasses(key, currentVote === key, compact, isLoading || saving, mobileBar)}`}
          >
            {label}
          </motion.button>
        ))}
      </div>

      {voteError && (
        <p className="mt-2 text-xs text-[var(--signal)]" role="alert">
          {voteError}
        </p>
      )}

      {!compact && !mobileBar && (
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
              <div className="mt-6 pt-5">
                <p className="font-body text-[10px] uppercase tracking-[.12em] text-[var(--muted)]">
                  Your vote:{' '}
                  <span className={`font-bold ${voteHighlightClass(currentVote)}`}>
                    {currentVote}
                  </span>
                </p>
                <StanceBar
                  distribution={dist}
                  commentCount={voteState?.total ?? voteCount}
                  className="mt-3"
                  showTooltip
                />
                <p className="mt-2 font-body text-[10px] text-[var(--muted)]">
                  {voteState?.total != null && voteState.total > 0
                    ? `${voteState.total} votes recorded`
                    : 'Community distribution'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
