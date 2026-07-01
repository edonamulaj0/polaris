import { CURATED_DEBATE_BY_ID } from '../data/curatedDebates'
import { MOCK_DISCUSSIONS } from '../data/mockDiscussions'
import { useFeedStore } from '../stores/feedStore'

/**
 * Resolve display metadata for a discussion id from local caches.
 * @param {string} id
 * @param {{ title?: string, detail?: string }[]} [activityFeed]
 */
export function resolveDiscussionMeta(id, activityFeed = []) {
  if (!id) return { id: '', title: 'Discussion', category: null }

  const curated = CURATED_DEBATE_BY_ID[id]
  if (curated) {
    return { id, title: curated.title, category: curated.topicArea ?? curated.category }
  }

  const { allPosts, posts } = useFeedStore.getState()
  const fromFeed = [...allPosts, ...posts].find((p) => p.id === id)
  if (fromFeed) {
    return { id, title: fromFeed.title, category: fromFeed.category ?? fromFeed.topicArea ?? null }
  }

  const mock = MOCK_DISCUSSIONS.find((p) => p.id === id)
  if (mock) {
    return { id, title: mock.title, category: mock.category ?? null }
  }

  const fromActivity = activityFeed.find(
    (a) => a.detail === id || a.discussionId === id,
  )
  if (fromActivity?.title) {
    return { id, title: fromActivity.title, category: fromActivity.category ?? null }
  }

  return { id, title: id, category: null }
}

/**
 * @param {string[]} likedIds
 * @param {{ title?: string, detail?: string, discussionId?: string }[]} activityFeed
 */
export function buildSavedDebates(likedIds, activityFeed = []) {
  const ids = Array.isArray(likedIds) ? likedIds : []
  return ids.map((id) => resolveDiscussionMeta(id, activityFeed))
}
