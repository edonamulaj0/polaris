/** Empty per-account activity bucket keyed by Google `sub`. */
export function emptyAccountActivity() {
  return {
    commentHistory: [],
    stanceHistory: [],
    joinedDiscussionIds: [],
    stats: {
      postsCreated: 0,
      upvotesGiven: 0,
      downvotesGiven: 0,
      likesGiven: 0,
    },
    activityFeed: [],
    likedDiscussionIds: [],
  }
}

export function accountStorageKey(sub) {
  const id = typeof sub === 'string' ? sub.trim() : ''
  return id || '_guest'
}

/** Merge legacy flat persisted fields into accounts[sub] on first load. */
export function migrateLegacyAccountState(state) {
  if (!state || typeof state !== 'object') return state
  const accounts = { ...(state.accounts || {}) }
  const sub = accountStorageKey(state.googleSub)
  if (sub === '_guest') return { ...state, accounts }

  const legacyHasData =
    (state.commentHistory?.length ?? 0) > 0 ||
    (state.stanceHistory?.length ?? 0) > 0 ||
    (state.likedDiscussionIds?.length ?? 0) > 0 ||
    (state.activityFeed?.length ?? 0) > 0

  if (!accounts[sub] && legacyHasData) {
    accounts[sub] = {
      commentHistory: state.commentHistory ?? [],
      stanceHistory: state.stanceHistory ?? [],
      joinedDiscussionIds: state.joinedDiscussionIds ?? [],
      stats: state.stats ?? emptyAccountActivity().stats,
      activityFeed: state.activityFeed ?? [],
      likedDiscussionIds: state.likedDiscussionIds ?? [],
    }
  }

  return { ...state, accounts }
}

export function readAccountActivity(state, sub) {
  const key = accountStorageKey(sub)
  const stored = state.accounts?.[key]
  if (stored) return { ...emptyAccountActivity(), ...stored }
  return emptyAccountActivity()
}

export function snapshotAccountActivity(state, sub) {
  const key = accountStorageKey(sub)
  if (key === '_guest') return state.accounts || {}

  return {
    ...(state.accounts || {}),
    [key]: {
      commentHistory: state.commentHistory ?? [],
      stanceHistory: state.stanceHistory ?? [],
      joinedDiscussionIds: state.joinedDiscussionIds ?? [],
      stats: state.stats ?? emptyAccountActivity().stats,
      activityFeed: state.activityFeed ?? [],
      likedDiscussionIds: state.likedDiscussionIds ?? [],
    },
  }
}

export function applyAccountActivity(account) {
  const base = { ...emptyAccountActivity(), ...account }
  return {
    commentHistory: base.commentHistory,
    stanceHistory: base.stanceHistory,
    joinedDiscussionIds: base.joinedDiscussionIds,
    stats: base.stats,
    activityFeed: base.activityFeed,
    likedDiscussionIds: base.likedDiscussionIds,
  }
}
