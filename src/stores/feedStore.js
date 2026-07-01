import { create } from 'zustand'
import { MOCK_DISCUSSIONS } from '../data/mockDiscussions'
import { CURATED_DEBATES } from '../data/curatedDebates'
import { postMatchesTopic } from '../data/exploreTopics'

/** [FE-1] Map Worker ArticlePublic to card-compatible post shape */
function normalizeArticle(article) {
  return {
    ...article,
    createdUtc: article.publishedAt ?? article.createdUtc ?? Math.floor(Date.now() / 1000),
    source: article.source ?? 'polaris',
    subreddit: article.subreddit ?? article.category ?? '',
    num_comments: article.num_comments ?? 0,
    score: article.score ?? 0,
  }
}

/** [WRK-6] Public feeds only show verified articles */
function isPublicFeedPost(post) {
  return !post.hidden && post.verified !== false
}

function mockPosts() {
  return MOCK_DISCUSSIONS.map((p) => ({ ...p, sources: [...(p.sources || [])] }))
}

function mergePosts(apiPosts, curated = CURATED_DEBATES) {
  const byId = new Map()
  for (const p of curated.map(normalizeArticle)) {
    byId.set(p.id, p)
  }
  for (const p of apiPosts) {
    if (!byId.has(p.id)) byId.set(p.id, p)
  }
  return [...byId.values()].sort(
    (a, b) => (b.createdUtc ?? b.publishedAt ?? 0) - (a.createdUtc ?? a.publishedAt ?? 0),
  )
}

/** Curated Guardian corpus: public/articles.json (no API keys required) */
async function loadStaticArticles() {
  try {
    const res = await fetch('/articles.json', { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    const articles = data?.articles
    if (!Array.isArray(articles) || articles.length === 0) return null
    return {
      articles: articles.filter((a) => a.verified !== false),
      nextCursor: data.nextCursor ?? null,
    }
  } catch {
    return null
  }
}

/** @deprecated use postMatchesTopic from exploreTopics.js */
function mockMatchesCategory(post, cat) {
  return postMatchesTopic(post, cat)
}

export const useFeedStore = create((set, get) => ({
  posts: [],
  /** Full merged pool (API + curated) for client-side Explore filtering */
  allPosts: [],
  loading: true,
  loadingMore: false,
  hasMore: false,
  nextCursor: null,
  error: null,
  lastRefresh: 0,
  activeCategory: null,
  previewById: {},

  setPosts: (posts) => set({ posts }),

  updatePost: (id, patch) => {
    const mapPatch = (list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p))
    set({
      posts: mapPatch(get().posts),
      allPosts: mapPatch(get().allPosts),
    })
  },

  updateVoteDistribution: (articleId, distribution) => {
    const mapDist = (list) =>
      list.map((p) => (p.id === articleId ? { ...p, stanceDistribution: distribution } : p))
    set({
      posts: mapDist(get().posts),
      allPosts: mapDist(get().allPosts),
    })
  },

  submitTopic: async (data, idToken) => {
    const res = await fetch('/api/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        title: data.title,
        category: data.category,
        stance: data.stance,
        description: data.description,
      }),
    })

    if (res.status === 401) {
      const err = new Error('unauthorized')
      err.code = 'unauthorized'
      throw err
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const err = new Error(body.error || `HTTP ${res.status}`)
      err.code = body.error || 'submit_failed'
      throw err
    }

    return res.json()
  },

  fetchArticlePreview: async (id, idToken) => {
    const cached = get().previewById[id]
    if (cached) return cached

    const res = await fetch(`/api/articles/${encodeURIComponent(id)}?preview=1`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })

    if (!res.ok) return null

    const article = normalizeArticle(await res.json())
    set({ previewById: { ...get().previewById, [id]: article } })
    return article
  },

  bootstrap: async () => {
    set({ loading: true, error: null, activeCategory: null })
    try {
      const res = await fetch('/api/articles?limit=50')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { articles, nextCursor } = await res.json()
      if (articles?.length > 0) {
        const merged = mergePosts(articles.map(normalizeArticle).filter(isPublicFeedPost))
        set({
          allPosts: merged,
          posts: merged,
          nextCursor: nextCursor ?? null,
          hasMore: nextCursor != null,
          loading: false,
          lastRefresh: Date.now(),
        })
        return
      }
    } catch {
      /* fall through */
    }

    const staticFeed = await loadStaticArticles()
    if (staticFeed) {
      const merged = mergePosts(staticFeed.articles.map(normalizeArticle).filter(isPublicFeedPost))
      set({
        allPosts: merged,
        posts: merged,
        nextCursor: staticFeed.nextCursor,
        hasMore: staticFeed.nextCursor != null,
        loading: false,
        error: null,
        lastRefresh: Date.now(),
      })
      return
    }

    const merged = mergePosts(mockPosts().filter(isPublicFeedPost))
    set({
      allPosts: merged,
      posts: merged,
      hasMore: false,
      nextCursor: null,
      loading: false,
      error: 'Feed unavailable',
      lastRefresh: Date.now(),
    })
  },

  loadMore: async () => {
    const { loadingMore, hasMore, nextCursor, posts, allPosts, activeCategory } = get()
    if (loadingMore || !hasMore || nextCursor == null || activeCategory) return
    set({ loadingMore: true })
    try {
      const res = await fetch(`/api/articles?cursor=${nextCursor}&limit=20`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { articles, nextCursor: nc } = await res.json()
      if (articles?.length > 0) {
        const merged = mergePosts(
          [...allPosts, ...articles.map(normalizeArticle).filter(isPublicFeedPost)],
        )
        set({
          allPosts: merged,
          posts: merged,
          nextCursor: nc ?? null,
          hasMore: nc != null,
          loadingMore: false,
          lastRefresh: Date.now(),
        })
        return
      }
    } catch {
      /* static feed is single-page */
    }
    set({ loadingMore: false, hasMore: false })
  },

  /** Client-side topic filter — works for curated debates and legacy API categories */
  fetchByTopic: async (topicId) => {
    set({ loading: true, error: null, activeCategory: topicId })

    let pool = get().allPosts
    if (!pool.length) {
      await get().bootstrap()
      pool = get().allPosts
    }

    const filtered = pool.filter((p) => postMatchesTopic(p, topicId) && isPublicFeedPost(p))
    set({
      posts: filtered,
      activeCategory: topicId,
      hasMore: false,
      nextCursor: null,
      loading: false,
      lastRefresh: Date.now(),
    })
  },

  /** @deprecated use fetchByTopic */
  fetchByCategory: async (cat) => get().fetchByTopic(cat),
}))

export function resolveFeedPost(id) {
  const decoded = decodeURIComponent(id)
  const { allPosts, posts, previewById } = useFeedStore.getState()
  const pools = [allPosts, posts, Object.values(previewById)]
  for (const pool of pools) {
    const hit = pool.find((p) => p.id === id || p.id === decoded)
    if (hit) return hit
  }
  return null
}
