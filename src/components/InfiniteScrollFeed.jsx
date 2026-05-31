import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useFeedStore } from '../stores/feedStore'
import { DiscussionCard } from './DiscussionCard'
import { SkeletonCard } from './SkeletonCard'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

export function InfiniteScrollFeed({ posts }) {
  const loadMore = useFeedStore((s) => s.loadMore)
  const loadingMore = useFeedStore((s) => s.loadingMore)
  const hasMore = useFeedStore((s) => s.hasMore)
  const sentinelRef = useRef(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '240px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [loadMore])

  return (
    <div>
      <motion.div
        className="flex flex-col gap-6 sm:gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {posts.map((post) => (
          <DiscussionCard key={post.id} post={post} />
        ))}
      </motion.div>
      <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
      {loadingMore && (
        <div className="mt-6 flex flex-col gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      {!hasMore && posts.length > 0 && (
        <p className="mt-8 text-center text-sm text-[var(--muted)]">You are caught up.</p>
      )}
    </div>
  )
}
