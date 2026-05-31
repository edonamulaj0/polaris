import { create } from 'zustand'
import { MOCK_DISCUSSIONS } from '../data/mockDiscussions'
import { useFeedStore } from './feedStore'

const LS_COMMENTS = 'polaris_thread_'

function loadThread(postId) {
  try {
    const raw = localStorage.getItem(LS_COMMENTS + postId)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveThread(postId, comments) {
  try {
    localStorage.setItem(LS_COMMENTS + postId, JSON.stringify(comments))
  } catch {
    /* */
  }
}

function resolvePost(id) {
  const decoded = decodeURIComponent(id)
  const feed = useFeedStore.getState().posts
  return (
    feed.find((p) => p.id === id) ||
    feed.find((p) => p.id === decoded) ||
    MOCK_DISCUSSIONS.find((p) => p.id === id || p.id === decoded) ||
    null
  )
}

export const useDiscussionStore = create((set, get) => ({
  currentId: null,
  /** @type {Record<string, any>} */
  detailById: {},
  tab: 'sides',

  setTab: (tab) => set({ tab }),

  hydrateFromFeed: (id) => {
    const post = resolvePost(id)
    if (!post) return null

    // [REFACTOR D-2] Always key by canonical post.id — never the raw route param
    const cacheKey = post.id
    const existing = get().detailById[cacheKey]
    const saved = loadThread(post.id)
    const keepComments =
      existing?.post?.id === post.id && Array.isArray(existing.comments) && existing.comments.length
        ? existing.comments
        : null
    const baseComments = keepComments ?? saved ?? seedComments()
    const sort = existing?.post?.id === post.id ? existing.sort : 'top'
    set({
      currentId: post.id,
      tab: existing?.post?.id === post.id ? get().tab : 'sides',
      detailById: {
        ...get().detailById,
        [cacheKey]: {
          post,
          comments: baseComments,
          sort,
        },
      },
    })
    return post
  },

  addComment: (discussionId, { text, stance, username, parentId = null }) => {
    const row =
      get().detailById[discussionId] ||
      Object.values(get().detailById).find((r) => r.post?.id === discussionId)
    if (!row) return
    const cacheKey = row.post.id
    const id = `c-${Date.now()}`
    const comment = {
      id,
      username,
      stance,
      text,
      upvotes: 1,
      downvotes: 0,
      createdAt: Date.now(),
      replies: [],
    }
    let comments = [...row.comments]
    if (parentId) {
      comments = comments.map((c) => {
        if (c.id !== parentId) return c
        return { ...c, replies: [...(c.replies || []), { ...comment, id: id + '-r' }] }
      })
    } else {
      comments = [comment, ...comments]
    }
    const next = { ...row, comments }
    set({ detailById: { ...get().detailById, [cacheKey]: next } })
    saveThread(row.post.id, comments)
  },

  voteComment: (discussionId, commentId, delta) => {
    const row =
      get().detailById[discussionId] ||
      Object.values(get().detailById).find((r) => r.post?.id === discussionId)
    if (!row) return
    const cacheKey = row.post.id
    const bump = (c) => {
      if (c.id === commentId) {
        if (delta > 0) return { ...c, upvotes: (c.upvotes || 0) + 1 }
        return { ...c, downvotes: (c.downvotes || 0) + 1 }
      }
      if (c.replies?.length) {
        return { ...c, replies: c.replies.map(bump) }
      }
      return c
    }
    const comments = row.comments.map(bump)
    const next = { ...row, comments }
    set({ detailById: { ...get().detailById, [cacheKey]: next } })
    saveThread(row.post.id, comments)
  },

  setSort: (discussionId, sort) => {
    const row =
      get().detailById[discussionId] ||
      Object.values(get().detailById).find((r) => r.post?.id === discussionId)
    if (!row) return
    const cacheKey = row.post.id
    set({
      detailById: {
        ...get().detailById,
        [cacheKey]: { ...row, sort },
      },
    })
  },

  sortedComments: (discussionId) => {
    const row =
      get().detailById[discussionId] ||
      Object.values(get().detailById).find((r) => r.post?.id === discussionId)
    if (!row) return []
    const list = [...row.comments]
    if (row.sort === 'new') list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    else if (row.sort === 'controversial')
      list.sort((a, b) => {
        const ca = Math.abs((a.upvotes || 0) - (a.downvotes || 0))
        const cb = Math.abs((b.upvotes || 0) - (b.downvotes || 0))
        return ca - cb
      })
    else list.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
    return list
  },
}))

function seedComments() {
  return [
    {
      id: 'seed-1',
      username: 'thread_bot',
      stance: 'Neutral',
      text: 'Opening balance: read sources before replying. Polaris is a client-only MVP.',
      upvotes: 12,
      downvotes: 0,
      createdAt: Date.now() - 3600000,
      replies: [],
    },
  ]
}
