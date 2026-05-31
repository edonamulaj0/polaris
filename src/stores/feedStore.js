import { create } from 'zustand'
import { MOCK_DISCUSSIONS } from '../data/mockDiscussions'
import { enrichDiscussion, loadHeadlinesOnce, fetchGdeltTopics } from '../services/pipeline'
import { fetchInitialMultiSub, fetchSubredditHot, normalizePost, SUBS } from '../services/reddit'
import { loadCuratedDiscussions } from '../services/staticFeed'
import { pruneLlmCache } from '../services/llmCache'

let refreshTimer = null

export const useFeedStore = create((set, get) => ({
  posts: [],
  /** Start true so deep-linked discussion pages wait for bootstrap instead of flashing “not found”. */
  loading: true,
  loadingMore: false,
  hasMore: true,
  afterBySub: {},
  loadMoreSubIndex: 0,
  error: null,
  lastRefresh: 0,
  headlines: [],

  setPosts: (posts) => set({ posts }),

  updatePost: (id, patch) => {
    set({
      posts: get().posts.map(p => p.id === id ? { ...p, ...patch } : p)
    })
  },

  prependLocalDiscussion: (data) => {
    const id = `local-${Date.now()}`
    const post = {
      id,
      source: 'polaris',
      subreddit: 'r/polaris',
      category: data.category,
      title: data.title,
      url: '#',
      score: 1,
      num_comments: 0,
      thumbnail: null,
      imageUrl: `https://picsum.photos/seed/${id}/960/520`,
      createdUtc: Math.floor(Date.now() / 1000),
      stanceDistribution: { for: 34, against: 33, neutral: 33 },
      civility: 78,
      bothSides: {
        for: [
          data.description
            ? `Author (${data.stance}): ${data.description.slice(0, 200)}`
            : 'Opening position recorded — invite counter-evidence.',
        ],
        against: [
          'Counter-arguments will appear as the thread attracts diverse readers.',
        ],
        common_ground: 'Structured disagreement starts with shared definitions and good-faith reading.',
        stance_distribution: { for: 34, against: 33, neutral: 33 },
      },
      sources: [
        {
          type: 'polaris',
          title: 'Locally authored topic',
          url: '#',
          domain: 'polaris.local',
        },
      ],
      verified: false,
      redditComments: [],
      tweets: [],
    }
    set({ posts: [post, ...get().posts] })
    return id
  },

  bootstrap: async () => {
    // [REFACTOR P-2] Prune stale LLM cache entries once per bootstrap
    pruneLlmCache()

    // [REFACTOR D-7] Reset pagination cursors on every bootstrap (e.g. hot-reload)
    set({ loading: true, error: null, afterBySub: {}, loadMoreSubIndex: 0 })
    const mockPosts = () => MOCK_DISCUSSIONS.map((p) => ({ ...p, sources: [...p.sources] }))

    try {
      const curated = await loadCuratedDiscussions()
      if (curated?.length) {
        // [REFACTOR D-6] loading:false handled solely by finally block below
        set({
          posts: curated,
          hasMore: false,
          afterBySub: {},
          loadMoreSubIndex: 0,
          lastRefresh: Date.now(),
          headlines: [],
        })
        get()._clearRefresh()
        return
      }

      const headlines = await loadHeadlinesOnce()
      set({ headlines })
      let posts = []
      try {
        posts = await fetchInitialMultiSub({ perSub: 6 })
      } catch (e) {
        set({ error: String(e?.message || e) })
      }
      if (posts.length < 6) {
        try {
          const gdelt = await fetchGdeltTopics({ limit: 12 })
          posts = [...posts, ...gdelt]
        } catch {
          // ignore
        }
      }
      if (!posts.length) {
        set({
          posts: mockPosts(),
          hasMore: false,
          lastRefresh: Date.now(),
        })
      } else {
        set({
          posts,
          hasMore: true,
          afterBySub: {},
          loadMoreSubIndex: 0,
          lastRefresh: Date.now(),
        })
      }

      get()._clearRefresh()
      refreshTimer = window.setInterval(() => {
        get().refreshTrending()
      }, 10 * 60 * 1000)

      const top = get()
        .posts.slice(0, 5)
        .filter((p) => p.source === 'reddit' && p.redditId)

      // [REFACTOR D-1, P-3] Apply enrichment patches per post instead of shallow-cloning the array
      await Promise.all(
        top.map(async (p) => {
          try {
            const patch = await enrichDiscussion(p, headlines)
            if (patch) get().updatePost(p.id, patch)
          } catch {
            /* keep partial */
          }
        }),
      )
      set({ lastRefresh: Date.now() })
    } catch (e) {
      set({ error: String(e?.message || e) })
      if (!get().posts.length) {
        set({
          posts: mockPosts(),
          hasMore: false,
          lastRefresh: Date.now(),
        })
      }
    } finally {
      set({ loading: false })
    }
  },

  _clearRefresh: () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  },

  refreshTrending: async () => {
    if (get().posts[0]?.source === 'curated') return
    set({ lastRefresh: Date.now() })
    const headlines = get().headlines.length ? get().headlines : await loadHeadlinesOnce()
    if (!get().headlines.length) set({ headlines })
    try {
      const fresh = await fetchInitialMultiSub({ perSub: 4 })
      if (!fresh.length) return
      const seen = new Set(get().posts.map((p) => p.id))
      const merged = [...fresh.filter((p) => !seen.has(p.id)), ...get().posts].slice(0, 40)
      set({ posts: merged })
    } catch {
      /* ignore */
    }
  },

  loadMore: async () => {
    const { loadingMore, hasMore, posts, afterBySub, loadMoreSubIndex } = get()
    if (loadingMore || !hasMore) return
    if (posts[0]?.source === 'polaris' || posts[0]?.source === 'curated') {
      set({ hasMore: false })
      return
    }
    set({ loadingMore: true })
    try {
      // [REFACTOR D-4] Rotate through SUBS instead of hardcoding politics
      const sub = SUBS[loadMoreSubIndex % SUBS.length]
      const after = afterBySub[sub] ?? null
      const { children, after: nextAfter } = await fetchSubredditHot(sub, {
        limit: 10,
        after,
      })
      const mapped = (children ?? []).map((ch) => normalizePost(ch, sub)).filter(Boolean)
      const ids = new Set(get().posts.map((p) => p.id))
      const appended = mapped.filter((p) => p && !ids.has(p.id))
      set({
        posts: [...get().posts, ...appended],
        afterBySub: { ...get().afterBySub, [sub]: nextAfter },
        loadMoreSubIndex: (loadMoreSubIndex + 1) % SUBS.length,
        hasMore: Boolean(nextAfter) || loadMoreSubIndex + 1 < SUBS.length,
        loadingMore: false,
      })
    } catch {
      set({ hasMore: false, loadingMore: false })
    }
  },
}))
