import { create } from 'zustand'
import { MOCK_DISCUSSIONS } from '../data/mockDiscussions'

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

/** [CAT-2] Legacy mock categories → new labels for fallback filtering */
function mockMatchesCategory(post, cat) {
  if (post.category === cat) return true
  if (cat === 'Technology' && post.category === 'Tech') return true
  return false
}

export const useFeedStore = create((set, get) => ({
  posts: [],
  /** Start true so deep-linked discussion pages wait for bootstrap instead of flashing “not found”. */
  loading: true,
  loadingMore: false,
  hasMore: false,
  nextCursor: null,
  error: null,
  lastRefresh: 0,
  /** [EXP-2] When set, loadMore appends within this category */
  activeCategory: null,
  /** Cached preview articles (pending, owner-only) keyed by id */
  previewById: {},

  setPosts: (posts) => set({ posts }),

  updatePost: (id, patch) => {
    set({
      posts: get().posts.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })
  },

  updateVoteDistribution: (articleId, distribution) => {
    set({
      posts: get().posts.map((p) =>
        p.id === articleId ? { ...p, stanceDistribution: distribution } : p,
      ),
    })
  },

  /** [WRK-6] POST user topic to Worker — returns { id, status } or throws */
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

  /** [WRK-6] Fetch pending article preview for submitter */
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
    set({ loading: true, error: null, activeCategory: null }) // [EXP-2]
    try {
      const res = await fetch('/api/articles?limit=50') // [FE-1]
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { articles, nextCursor } = await res.json() // [FE-1]
      if (articles?.length > 0) {
        set({
          posts: articles.map(normalizeArticle).filter(isPublicFeedPost), // [FE-1]
          nextCursor: nextCursor ?? null, // [FE-1]
          hasMore: nextCursor != null, // [FE-1]
          loading: false, // [FE-1]
          lastRefresh: Date.now(), // [FE-1]
        })
        return
      }
    } catch {
      /* fall through to static JSON */
    }

    const staticFeed = await loadStaticArticles()
    if (staticFeed) {
      set({
        posts: staticFeed.articles.map(normalizeArticle).filter(isPublicFeedPost),
        nextCursor: staticFeed.nextCursor,
        hasMore: staticFeed.nextCursor != null,
        loading: false,
        error: null,
        lastRefresh: Date.now(),
      })
      return
    }

    set({
      posts: mockPosts().filter(isPublicFeedPost), // [FE-1]
      hasMore: false, // [FE-1]
      nextCursor: null, // [FE-1]
      loading: false, // [FE-1]
      error: 'Feed unavailable',
      lastRefresh: Date.now(), // [FE-1]
    })
  },

  loadMore: async () => {
    const { loadingMore, hasMore, nextCursor, posts, activeCategory } = get() // [EXP-2]
    if (loadingMore || !hasMore || nextCursor == null) return // [FE-1]
    set({ loadingMore: true }) // [FE-1]
    try {
      const catQs = activeCategory
        ? `&category=${encodeURIComponent(activeCategory)}`
        : '' // [EXP-2]
      const res = await fetch(`/api/articles?cursor=${nextCursor}&limit=20${catQs}`) // [EXP-2]
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { articles, nextCursor: nc } = await res.json() // [FE-1]
      if (articles?.length > 0) {
        set({
          posts: [
            ...posts,
            ...articles.map(normalizeArticle).filter(isPublicFeedPost),
          ], // [FE-1]
          nextCursor: nc ?? null, // [FE-1]
          hasMore: nc != null, // [FE-1]
          loadingMore: false, // [FE-1]
          lastRefresh: Date.now(), // [FE-1]
        })
        return
      }
    } catch {
      /* static feed is single-page */
    }
    set({ loadingMore: false, hasMore: false }) // [FE-1]
  },

  fetchByCategory: async (cat) => {
    set({ loading: true, error: null, activeCategory: cat }) // [EXP-2]
    try {
      const res = await fetch(
        `/api/articles?category=${encodeURIComponent(cat)}&limit=50`,
      ) // [FE-1]
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { articles, nextCursor } = await res.json() // [FE-1]
      if (articles?.length > 0) {
        set({
          posts: articles.map(normalizeArticle).filter(isPublicFeedPost), // [FE-1]
          nextCursor: nextCursor ?? null, // [FE-1]
          hasMore: nextCursor != null, // [FE-1]
          loading: false, // [FE-1]
          lastRefresh: Date.now(), // [FE-1]
        })
        return
      }
    } catch {
      /* static fallback */
    }

    const staticFeed = await loadStaticArticles()
    if (staticFeed) {
      const filtered = staticFeed.articles.filter((a) => a.category === cat)
      set({
        posts: filtered.map(normalizeArticle).filter(isPublicFeedPost),
        nextCursor: null,
        hasMore: false,
        loading: false,
        error: null,
        lastRefresh: Date.now(),
      })
      return
    }

    set({
      posts: mockPosts().filter((p) => mockMatchesCategory(p, cat)).filter(isPublicFeedPost), // [FE-1]
      hasMore: false, // [FE-1]
      nextCursor: null, // [FE-1]
      loading: false, // [FE-1]
      error: 'Feed unavailable', // [FE-1]
    })
  },
}))
