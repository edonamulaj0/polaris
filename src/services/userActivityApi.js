/** @typedef {{ savedDebateIds?: string[], stanceHistory?: object[], commentHistory?: object[], activityFeed?: object[], joinedDiscussionIds?: string[], stats?: object }} ActivityData */

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

/** @returns {Promise<ActivityData>} */
export async function fetchActivityData(token) {
  const res = await fetch('/api/users/me/activity-data', {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('activity_fetch_failed')
  return res.json()
}

/**
 * Merge device-local activity into the server, then return fresh activity data.
 * @param {string} token
 * @param {{ savedDebateIds?: string[], stances?: object[], activity?: object[] }} payload
 * @returns {Promise<ActivityData>}
 */
export async function syncActivityToServer(token, payload) {
  const res = await fetch('/api/users/me/sync', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('activity_sync_failed')
  return res.json()
}

/** @returns {Promise<{ saved: boolean, articleId: string }>} */
export async function saveDebate(token, articleId) {
  const res = await fetch(`/api/users/me/saved/${encodeURIComponent(articleId)}`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('save_failed')
  return res.json()
}

/** @returns {Promise<{ saved: boolean, articleId: string }>} */
export async function unsaveDebate(token, articleId) {
  const res = await fetch(`/api/users/me/saved/${encodeURIComponent(articleId)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('unsave_failed')
  return res.json()
}

/** @returns {Promise<{ subscribed: boolean, articleId: string }>} */
export async function subscribeDebate(token, articleId) {
  const res = await fetch(`/api/users/me/subscriptions/${encodeURIComponent(articleId)}`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('subscribe_failed')
  return res.json()
}

/** @returns {Promise<{ subscribed: boolean, articleId: string }>} */
export async function unsubscribeDebate(token, articleId) {
  const res = await fetch(`/api/users/me/subscriptions/${encodeURIComponent(articleId)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('unsubscribe_failed')
  return res.json()
}

/** @returns {Promise<{ id: string }>} */
export async function postActivity(token, entry) {
  const res = await fetch('/api/users/me/activity', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(entry),
  })
  if (!res.ok) throw new Error('activity_post_failed')
  return res.json()
}

/** @returns {Promise<{ stance: string, distribution: object }>} */
export async function postVote(token, articleId, stance) {
  const res = await fetch(`/api/articles/${encodeURIComponent(articleId)}/vote`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ stance }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const err = new Error(data.error || 'vote_failed')
    /** @type {Record<string, unknown>} */ (err).code = data.error
    throw err
  }
  return res.json()
}

/** @param {ActivityData} data */
export function applyActivityDataToStore(data) {
  return {
    likedDiscussionIds: data.savedDebateIds ?? [],
    subscribedDiscussionIds: data.subscribedDebateIds ?? [],
    stanceHistory: data.stanceHistory ?? [],
    commentHistory: data.commentHistory ?? [],
    activityFeed: (data.activityFeed ?? []).map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      detail: a.detail,
      at: a.at,
    })),
    joinedDiscussionIds: data.joinedDiscussionIds ?? [],
    stats: {
      postsCreated: data.stats?.postsCreated ?? 0,
      upvotesGiven: data.stats?.upvotesGiven ?? 0,
      downvotesGiven: data.stats?.downvotesGiven ?? 0,
      likesGiven: data.stats?.likesGiven ?? 0,
    },
  }
}

/** Build one-time migration payload from local account bucket. */
export function localSyncPayloadFromAccount(account) {
  if (!account) return null
  const hasData =
    (account.likedDiscussionIds?.length ?? 0) > 0 ||
    (account.stanceHistory?.length ?? 0) > 0 ||
    (account.activityFeed?.length ?? 0) > 0
  if (!hasData) return null

  return {
    savedDebateIds: account.likedDiscussionIds ?? [],
    stances: (account.stanceHistory ?? []).map((s) => ({
      discussionId: s.discussionId,
      stance: s.stance,
      category: s.category,
    })),
    activity: (account.activityFeed ?? []).map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      detail: a.detail,
      discussionId: a.detail && a.type === 'like' ? a.detail : undefined,
      at: a.at,
    })),
  }
}
