import { motion } from 'framer-motion'
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai'
import { IoNotifications, IoNotificationsOutline } from 'react-icons/io5'
import { useUserStore } from '../stores/userStore'

const actionBtn =
  'flex h-11 w-11 items-center justify-center rounded-full transition-colors shadow-[var(--shadow-pill)]'

export function DebateSaveSubscribe({ discussionId, title, className = '' }) {
  const googleIdToken = useUserStore((s) => s.googleIdToken)
  const liked = useUserStore((s) => s.isDiscussionLiked(discussionId))
  const subscribed = useUserStore((s) => s.isDiscussionSubscribed(discussionId))
  const toggleLike = useUserStore((s) => s.toggleDiscussionLike)
  const toggleSubscribe = useUserStore((s) => s.toggleDiscussionSubscribe)

  return (
    <div className={`flex items-center justify-end gap-2 ${className}`}>
      <motion.button
        type="button"
        aria-label={
          subscribed ? 'Unsubscribe from comment notifications' : 'Notify me about new comments'
        }
        title={
          !googleIdToken
            ? 'Sign in to subscribe to comments'
            : subscribed
              ? 'Unsubscribe from new comments'
              : 'Notify me when new comments are posted'
        }
        disabled={!googleIdToken}
        className={`${actionBtn} ${
          subscribed
            ? 'bg-[var(--signal-muted)] text-[var(--gold)]'
            : 'bg-[var(--surface-hi)] text-[var(--muted)] hover:text-[var(--text)]'
        } disabled:cursor-not-allowed disabled:opacity-40`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void toggleSubscribe(discussionId, title)
        }}
        whileTap={googleIdToken ? { scale: 0.92 } : undefined}
      >
        {subscribed ? (
          <IoNotifications className="h-5 w-5" aria-hidden />
        ) : (
          <IoNotificationsOutline className="h-5 w-5" aria-hidden />
        )}
      </motion.button>
      <motion.button
        type="button"
        aria-label={liked ? 'Unlike' : 'Save discussion'}
        title={liked ? 'Remove from saved' : 'Save discussion'}
        className={`${actionBtn} ${
          liked
            ? 'bg-[var(--signal-muted)] text-[var(--gold)]'
            : 'bg-[var(--surface-hi)] text-[var(--muted)] hover:text-[var(--text)]'
        }`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void toggleLike(discussionId, title)
        }}
        whileTap={{ scale: 0.92 }}
      >
        {liked ? <AiFillHeart className="h-5 w-5" aria-hidden /> : <AiOutlineHeart className="h-5 w-5" aria-hidden />}
      </motion.button>
    </div>
  )
}
