import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { EXPLORE_TOPICS, getExploreTopic, postMatchesTopic } from '../data/exploreTopics'
import { CURATED_DEBATES } from '../data/curatedDebates'
import { useFeedStore } from '../stores/feedStore'
import { TopicPortalCard } from '../components/TopicPortalCard'
import { InfiniteScrollFeed } from '../components/InfiniteScrollFeed'
import { TrendingPanel } from '../components/TrendingPanel'
import { SkeletonCard } from '../components/SkeletonCard'
import { WeeklyDebateBanner } from '../components/WeeklyDebateBanner'

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.22 },
}

export function ExplorePage() {
  const [activeTopicId, setActiveTopicId] = useState(null)
  const posts = useFeedStore((s) => s.posts)
  const allPosts = useFeedStore((s) => s.allPosts)
  const loading = useFeedStore((s) => s.loading)
  const fetchByTopic = useFeedStore((s) => s.fetchByTopic)
  const bootstrap = useFeedStore((s) => s.bootstrap)

  const activeTopic = activeTopicId ? getExploreTopic(activeTopicId) : null

  useEffect(() => {
    if (!activeTopicId) return
    fetchByTopic(activeTopicId)
  }, [activeTopicId, fetchByTopic])

  useEffect(() => {
    return () => {
      bootstrap()
    }
  }, [bootstrap])

  const visiblePosts = useMemo(
    () => posts.filter((p) => !p.hidden && p.verified !== false),
    [posts],
  )

  const curatedInTopic = useMemo(() => {
    if (!activeTopicId) return []
    return CURATED_DEBATES.filter((d) => postMatchesTopic(d, activeTopicId))
  }, [activeTopicId])

  function handleBack() {
    setActiveTopicId(null)
    bootstrap()
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {activeTopicId === null ? (
          <motion.div key="portal" {...fade}>
            <header className="mb-10 border-b border-[var(--border)] pb-8 lg:mb-12 lg:pb-10">
              <h1 className="font-display text-4xl uppercase tracking-widest text-[var(--text-hi)] sm:text-5xl">
                Explore
              </h1>
              <hr className="signal mt-4" />
              <p className="font-body mt-4 max-w-2xl text-base leading-relaxed text-[var(--muted)]">
                Browse subject areas from technology and climate to human rights, politics, and
                ethics — then join moderated debates on both sides.
              </p>
            </header>

            <WeeklyDebateBanner className="mb-10" />

            <section className="mb-12">
              <h2 className="font-mono text-[10px] uppercase tracking-[.2em] text-[var(--signal)]">
                Subject areas
              </h2>
              <p className="font-body mt-2 mb-6 max-w-2xl text-sm text-[var(--muted)]">
                Pick a topic to see curated debates and related articles.
              </p>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {EXPLORE_TOPICS.map((topic) => (
                  <TopicPortalCard
                    key={topic.id}
                    topic={topic}
                    onClick={() => setActiveTopicId(topic.id)}
                  />
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-mono text-[10px] uppercase tracking-[.2em] text-[var(--signal)]">
                All curated debates
              </h2>
              <p className="font-body mt-2 mb-6 max-w-2xl text-sm text-[var(--muted)]">
                {CURATED_DEBATES.length} controversial topics ready for stance voting and moderated
                discussion.
              </p>
              <ul className="divide-y divide-[var(--border)] border border-[var(--border)] bg-[var(--surface)]">
                {CURATED_DEBATES.map((debate) => (
                  <li key={debate.id}>
                    <Link
                      to={`/discussion/${debate.id}`}
                      className="group flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-[var(--surface-hi)] sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--signal)]">
                          {debate.topicArea}
                        </p>
                        <h3 className="font-heading mt-1 text-base font-semibold leading-snug text-[var(--text-hi)] group-hover:text-[var(--signal)] sm:text-lg">
                          {debate.title}
                        </h3>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-[var(--muted)] group-hover:text-[var(--signal)]">
                        Debate →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </motion.div>
        ) : (
          <motion.div key={`feed-${activeTopicId}`} {...fade}>
            <button
              type="button"
              onClick={handleBack}
              className="mb-8 font-mono text-[10px] uppercase tracking-[.15em] text-[var(--muted)] transition-colors hover:text-[var(--signal)]"
            >
              ← Back to subject areas
            </button>

            <header className="mb-8 border-b border-[var(--border)] pb-8">
              <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--signal)]">
                {activeTopic?.label ?? activeTopicId}
              </p>
              <h1 className="font-display mt-2 text-3xl uppercase leading-tight tracking-widest text-[var(--text-hi)] sm:text-4xl lg:text-5xl">
                Debates on {activeTopic?.label ?? activeTopicId}
              </h1>
              <hr className="signal mt-4" />
              <p className="font-body mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
                {activeTopic?.tagline}
              </p>
              <p className="font-mono mt-4 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                {visiblePosts.length} article{visiblePosts.length === 1 ? '' : 's'}
                {curatedInTopic.length > 0 &&
                  ` · ${curatedInTopic.length} curated debate${curatedInTopic.length === 1 ? '' : 's'}`}
              </p>
            </header>

            {loading && !posts.length ? (
              <div className="flex flex-col gap-8">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0">
                  {visiblePosts.length > 0 ? (
                    <InfiniteScrollFeed posts={visiblePosts} />
                  ) : (
                    <div className="py-8">
                      <p className="text-center text-base text-[var(--muted)]">
                        No news articles in this area yet — browse curated debates below.
                      </p>
                      <ul className="mt-8 divide-y divide-[var(--border)] border border-[var(--border)]">
                        {curatedInTopic.map((debate) => (
                          <li key={debate.id}>
                            <Link
                              to={`/discussion/${debate.id}`}
                              className="block px-5 py-4 transition-colors hover:bg-[var(--surface-hi)]"
                            >
                              <h3 className="font-heading text-base font-semibold text-[var(--text-hi)] hover:text-[var(--signal)]">
                                {debate.title}
                              </h3>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="hidden lg:block">
                  <div className="sticky top-20">
                    <TrendingPanel category={activeTopicId} posts={allPosts.length ? allPosts : posts} />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
