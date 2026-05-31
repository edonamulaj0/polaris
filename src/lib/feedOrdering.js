/** Canonical category filters for Explore (client-side). */
export const EXPLORE_CATEGORIES = ['All', 'Politics', 'Tech', 'Society', 'Science', 'Culture']

/** @typedef {'relevance' | 'recent' | 'popular'} FeedSortMode */

/**
 * @param {Array<{ id: string, createdUtc?: number, score?: number, num_comments?: number }>} items
 * @param {FeedSortMode} mode
 * @param {Array<{ id: string }>} baselinePosts Full feed order (e.g. store `posts`) for relevance.
 */
export function orderPostsForDisplay(items, mode, baselinePosts) {
  const copy = [...items]
  if (mode === 'recent') {
    copy.sort((a, b) => (b.createdUtc ?? 0) - (a.createdUtc ?? 0))
    return copy
  }
  if (mode === 'popular') {
    copy.sort((a, b) => {
      const ds = (b.score ?? 0) - (a.score ?? 0)
      if (ds !== 0) return ds
      return (b.num_comments ?? 0) - (a.num_comments ?? 0)
    })
    return copy
  }
  const order = new Map(baselinePosts.map((p, i) => [p.id, i]))
  copy.sort((a, b) => (order.get(a.id) ?? 1e9) - (order.get(b.id) ?? 1e9))
  return copy
}
