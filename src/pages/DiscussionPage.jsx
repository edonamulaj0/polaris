import { motion, useScroll, useTransform } from 'framer-motion'
import { useLayoutEffect, useMemo, useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CivilityBadge } from '../components/CivilityBadge'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { StanceBar } from '../components/StanceBar'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { VoteWidget } from '../components/VoteWidget'
import { MOCK_DISCUSSIONS } from '../data/mockDiscussions'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { formatSource } from '../lib/displayUtils'
import { useDiscussionStore } from '../stores/discussionStore'
import { useFeedStore } from '../stores/feedStore'
import { useUserStore } from '../stores/userStore'

function formatScore(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n ?? 0)
}

/** [ART-3] Prose article renderer — no bullet points anywhere */
function ArticleBody({ article, bothSides }) {
  if (article) {
    const sections = [
      {
        label: null,
        text: article.lede,
        className: 'text-lg leading-relaxed font-medium text-[var(--text)]',
      },
      { label: 'Background', text: article.background },
      { label: 'Perspectives', text: article.perspectives },
      { label: 'Evidence & Data', text: article.evidence },
      { label: 'Counterpoint', text: article.counterpoint },
      { label: 'Implications', text: article.implications },
      {
        label: null,
        text: article.conclusion,
        className:
          'text-base leading-relaxed italic text-[var(--muted)] border-t border-[var(--border)] pt-8 mt-2',
      },
    ]

    return (
      <div className="space-y-8 mt-10">
        {sections.map((s, i) =>
          s.text ? (
            <section key={i} className={s.className || ''}>
              {s.label && (
                <h2 className="font-mono text-[9px] uppercase tracking-[.18em] text-[var(--signal)] mb-3">
                  {s.label}
                </h2>
              )}
              <p className="text-base leading-[1.85] text-[var(--muted)]">{s.text}</p>
            </section>
          ) : null,
        )}
      </div>
    )
  }

  if (bothSides) {
    const joinBullets = (items) =>
      (items || [])
        .filter(Boolean)
        .map((s) => String(s).trim())
        .filter((s) => s.length > 0)
        .join(' ') // [ART-3] legacy: bullets as prose sentences

    const legacySections = [
      { label: null, text: joinBullets(bothSides.for) },
      { label: 'Counterpoint', text: joinBullets(bothSides.against) },
      { label: null, text: bothSides.common_ground },
    ]

    return (
      <div className="space-y-8 mt-10">
        {legacySections.map((s, i) =>
          s.text ? (
            <section key={i}>
              {s.label && (
                <h2 className="font-mono text-[9px] uppercase tracking-[.18em] text-[var(--signal)] mb-3">
                  {s.label}
                </h2>
              )}
              <p className="text-base leading-[1.85] text-[var(--muted)]">{s.text}</p>
            </section>
          ) : null,
        )}
      </div>
    )
  }

  return null
}

function DiscussionPageInner({ id }) {
  const hydrateFromFeed = useDiscussionStore((s) => s.hydrateFromFeed)
  const feedLoading = useFeedStore((s) => s.loading)
  const feedPosts = useFeedStore((s) => s.posts)
  const feedLastRefresh = useFeedStore((s) => s.lastRefresh)
  const previewById = useFeedStore((s) => s.previewById)
  const fetchArticlePreview = useFeedStore((s) => s.fetchArticlePreview)
  const googleSub = useUserStore((s) => s.googleSub)
  const googleIdToken = useUserStore((s) => s.googleIdToken)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [previewLoading, setPreviewLoading] = useState(false)

  const decodedId = id ? decodeURIComponent(id) : null
  const feedPost =
    feedPosts.find((p) => p.id === id) ||
    feedPosts.find((p) => p.id === decodedId) ||
    previewById[id] ||
    previewById[decodedId] ||
    MOCK_DISCUSSIONS.find((p) => p.id === id || p.id === decodedId) ||
    null
  const lookupId = feedPost?.id ?? id
  const detail = useDiscussionStore((s) => (lookupId ? s.detailById[lookupId] : null))

  const { scrollY } = useScroll()
  const imgY = useTransform(scrollY, (v) => v * 0.3)

  useLayoutEffect(() => {
    if (id) hydrateFromFeed(id)
  }, [id, hydrateFromFeed, feedPosts, feedLoading, feedLastRefresh])

  useEffect(() => {
    if (feedPost || !id || !googleSub || !googleIdToken) return
    let cancelled = false
    /* eslint-disable react-hooks/set-state-in-effect -- preview fetch lifecycle */
    setPreviewLoading(true)
    /* eslint-enable react-hooks/set-state-in-effect */
    fetchArticlePreview(id, googleIdToken).finally(() => {
      if (!cancelled) setPreviewLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [id, feedPost, googleSub, googleIdToken, fetchArticlePreview])

  const post = detail?.post ?? feedPost
  const isPending = post && post.verified === false
  const isOwnerPreview = isPending && post.submittedBy === googleSub

  const sourcesList = useMemo(() => {
    if (!post) return []
    const base = [...(post.sources || [])]
    for (const t of post.tweets || []) {
      base.push({
        type: 'twitter',
        title: (t.text || '').slice(0, 120),
        url: `https://twitter.com/i/web/status/${t.id}`,
        domain: 'twitter.com',
      })
    }
    return base
  }, [post])

  const sourceLabel = formatSource(post?.subreddit) || post?.source || '' // [UI-1]

  if (!post) {
    const isHydrating = Boolean(
      id && !post && (feedLoading || previewLoading || feedPosts.length > 0),
    )

    if (isHydrating || feedLoading || previewLoading) {
      return (
        <div className="space-y-4">
          <div className="h-4 w-32 skeleton-shimmer rounded-none" />
          <div className="aspect-[16/9] min-h-[220px] w-full skeleton-shimmer rounded-none" />
          <div className="h-8 w-3/4 skeleton-shimmer rounded-none" />
          <p className="text-sm text-[var(--muted)]">Loading discussion…</p>
        </div>
      )
    }
    return (
      <p className="text-[var(--muted)]">
        Discussion not found.{' '}
        <Link to="/" className="text-[var(--signal)]">
          Back home
        </Link>
      </p>
    )
  }

  return (
    <div className="pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-12">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--text)]"
      >
        ← Back to feed
      </Link>

      {isOwnerPreview && (
        <div
          className="mb-8 border border-[var(--signal)]/40 bg-[var(--surface)] px-5 py-4"
          role="status"
        >
          <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--signal)] mb-2">
            Pending editor confirmation
          </p>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Your topic has been submitted and is pending editor confirmation. It will appear in the
            feed once verified.
          </p>
        </div>
      )}

      <div className="relative -mx-4 mb-10 overflow-hidden sm:-mx-6 lg:mx-0">
        <div className="relative aspect-[16/9] min-h-[220px] w-full sm:min-h-[300px] lg:min-h-[380px]">
          <motion.div className="absolute inset-0 scale-110" style={{ y: imgY }}>
            <img
              src={post.imageUrl || post.thumbnail || 'https://picsum.photos/seed/polaris/1200/520'}
              alt=""
              className="h-full w-full object-cover"
            />
          </motion.div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--page)] via-[var(--page)]/30 to-transparent" />
        </div>
      </div>

      <header className="mb-6">
        <h1 className="font-heading mb-6 text-3xl font-semibold leading-tight text-[var(--text)] sm:text-4xl lg:text-5xl">
          {post.title}
        </h1>
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          {post.category && (
            <span className="rounded-none bg-[var(--surface-hi)] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--text-hi)] ring-1 ring-[var(--border)]">
              {post.category}
            </span>
          )}
          {sourceLabel && (
            <span className="rounded-none bg-[var(--surface)] px-2.5 py-1 font-mono text-[10px] text-[var(--muted)] ring-1 ring-[var(--border)]">
              {sourceLabel}
            </span>
          )}
          {post.verified && <VerifiedBadge />}
          {!post.verified && isOwnerPreview && (
            <span className="font-mono text-[9px] uppercase tracking-widest bg-[var(--surface-hi)] text-[var(--muted)] px-2 py-0.5">
              Pending Review
            </span>
          )}
          <CivilityBadge value={post.civility ?? 70} />
          <span className="ml-auto font-mono text-[10px] text-[var(--muted)]">
            ↑ {formatScore(post.score)} · 💬 {post.num_comments ?? 0}
          </span>
        </div>
        <div className="mt-6 max-w-2xl">
          <StanceBar distribution={post.stanceDistribution} commentCount={post.num_comments} />
        </div>
      </header>

      {!isPending && isDesktop && (
        <div className="my-10 border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <VoteWidget
            postId={post.id}
            postTitle={post.title}
            category={post.category}
            stanceDistribution={post.stanceDistribution}
            compact={false}
          />
        </div>
      )}

      {post.explainer && (
        <div className="mb-10 border-l-4 border-[var(--signal)] py-2 pl-6">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[.15em] text-[var(--signal)]">
            Why this is polarised
          </p>
          <p className="text-base leading-relaxed text-[var(--muted)]">{post.explainer}</p>
        </div>
      )}

      <ArticleBody article={post.article} bothSides={post.bothSides} /> {/* [ART-3] */}

      {sourcesList.length > 0 && (
        <div className="mt-10 border-t border-[var(--border)] pt-8">
          <h2 className="mb-5 font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
            Sources & References
          </h2>
          <ul className="space-y-3">
            {sourcesList.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-4 border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <span className="mt-1 h-8 w-8 shrink-0 rounded-none bg-[var(--surface-hi)] text-center text-xs leading-8 text-[var(--muted)]">
                  {(s.domain || 'link').slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--signal)] hover:underline"
                  >
                    {s.title}
                  </a>
                  <p className="text-xs text-[var(--muted)]">{s.domain}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isPending && !isDesktop && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-[50] border-t border-[var(--border)] bg-[var(--page)]/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <VoteWidget
            postId={post.id}
            postTitle={post.title}
            category={post.category}
            stanceDistribution={post.stanceDistribution}
            compact={false}
          />
        </div>
      )}
    </div>
  )
}

export function DiscussionPage() {
  const { id } = useParams()
  if (!id) return null
  return (
    <ErrorBoundary>
      <DiscussionPageInner key={id} id={id} />
    </ErrorBoundary>
  )
}
