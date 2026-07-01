import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CATEGORIES } from '../data/categories'
import {
  applyAccountActivity,
  emptyAccountActivity,
  migrateLegacyAccountState,
  readAccountActivity,
  snapshotAccountActivity,
} from '../lib/accountActivity'
import {
  applyActivityDataToStore,
  fetchActivityData,
  localSyncPayloadFromAccount,
  postActivity,
  saveDebate,
  syncActivityToServer,
  unsaveDebate,
  subscribeDebate,
  unsubscribeDebate,
} from '../services/userActivityApi'
import { isGoogleIdTokenExpired } from '../lib/googleAuth'
import { authErrorFromResponse } from '../lib/authErrors'

const emptyStats = () => ({
  postsCreated: 0,
  upvotesGiven: 0,
  downvotesGiven: 0,
  likesGiven: 0,
})

/** @param {Record<string, unknown>} p */
function displayNameFromJwt(p) {
  const direct = typeof p.name === 'string' ? p.name.trim() : ''
  if (direct) return direct.slice(0, 120)
  const g = typeof p.given_name === 'string' ? p.given_name.trim() : ''
  const f = typeof p.family_name === 'string' ? p.family_name.trim() : ''
  const combined = [g, f].filter(Boolean).join(' ').trim()
  return (combined || 'Member').slice(0, 120)
}

/** @param {string} iso `YYYY-MM-DD` */
function ageFromBirthDateString(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null
  const born = new Date(y, mo, d)
  if (Number.isNaN(born.getTime())) return null
  const today = new Date()
  if (born > today) return null
  let age = today.getFullYear() - born.getFullYear()
  const md = today.getMonth() - born.getMonth()
  if (md < 0 || (md === 0 && today.getDate() < born.getDate())) age -= 1
  if (age < 0 || age > 120) return null
  return age
}

export const useUserStore = create(
  persist(
    (set, get) => ({
      /** Google subject (stable account id from ID token) */
      googleSub: '',
      /** Short-lived Google ID token for authenticated API calls */
      googleIdToken: '',
      email: '',
      name: '',
      /** @type {number | null} legacy / cache when using date of birth */
      age: null,
      /** `YYYY-MM-DD` */
      birthDate: '',
      /** [FE-2] true once birthday is saved to Worker (write-once) */
      birthLocked: false,
      /** Activity keyed by Google `sub` — survives account switch on same device */
      accounts: {},
      commentHistory: [],
      stanceHistory: [],
      joinedDiscussionIds: [],
      stats: emptyStats(),
      /** @type {{ id: string; type: string; title?: string; at: number; detail?: string }[]} */
      activityFeed: [],
      likedDiscussionIds: [],
      subscribedDiscussionIds: [],
      /** True once server activity has been loaded for the current session */
      activitySynced: false,
      signInPromptOpen: false,

      openSignInPrompt: () => set({ signInPromptOpen: true }),
      closeSignInPrompt: () => set({ signInPromptOpen: false }),

      /** Upsert the signed-in Google user in D1 (required before birthday / votes / comments). */
      ensureUserOnServer: async () => {
        const token = get().googleIdToken
        if (!token?.trim()) return false
        try {
          const res = await fetch('/api/users', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
          return res.ok
        } catch {
          return false
        }
      },

      /** Load birthday lock state from the server (required for vote/comment after sign-in). */
      syncBirthdayFromServer: async () => {
        const token = get().googleIdToken
        const sub = get().googleSub
        if (!token?.trim() || !sub?.trim()) return

        try {
          await get().ensureUserOnServer()
          const res = await fetch('/api/users/me/birthday', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) return
          const data = await res.json()
          if (data.set) {
            set({
              birthLocked: true,
              birthDate: data.birthDate || get().birthDate,
            })
          }
        } catch {
          /* offline — keep local state */
        }
      },

      /** @returns {boolean} */
      isSignedIn: () => {
        const token = get().googleIdToken
        return Boolean(get().googleSub?.trim() && token?.trim() && !isGoogleIdTokenExpired(token))
      },

      /** Signed in + birthday on file — required to vote, comment, save. */
      canParticipate: () => get().isSignedIn() && get().birthLocked,

      /** Run fn when authenticated; otherwise open sign-in modal. @returns {boolean} */
      requireAuth: (fn) => {
        if (get().isSignedIn()) {
          if (typeof fn === 'function') fn()
          return true
        }
        set({ signInPromptOpen: true })
        return false
      },

      /** Persist current activity slice into accounts[googleSub] (migration cache only) */
      _commitAccount: () => {
        const sub = get().googleSub
        if (!sub?.trim()) return
        set({ accounts: snapshotAccountActivity(get(), sub) })
      },

      /**
       * Load hearts, stances, and activity feed from the server (Google account).
       * Merges any device-local data once, then server is source of truth.
       */
      syncAccountFromServer: async () => {
        const token = get().googleIdToken
        const sub = get().googleSub
        if (!token?.trim() || !sub?.trim()) return

        try {
          const account = readAccountActivity(get(), sub)
          const payload = localSyncPayloadFromAccount(account)

          let data
          if (payload) {
            data = await syncActivityToServer(token, payload)
            const accounts = { ...(get().accounts || {}) }
            delete accounts[sub]
            set({ accounts })
          } else {
            data = await fetchActivityData(token)
          }

          set({ ...applyActivityDataToStore(data), activitySynced: true })
        } catch {
          get()._loadAccount(sub)
        }
      },

      _persistActivity: async (entry) => {
        const token = get().googleIdToken
        if (!token?.trim() || !entry?.type) return
        try {
          await postActivity(token, entry)
        } catch {
          /* local state already updated */
        }
      },

      /** Load activity for the signed-in Google account (offline fallback) */
      _loadAccount: (sub) => {
        if (!sub?.trim()) return
        set({
          accounts: snapshotAccountActivity(get(), get().googleSub),
          ...applyAccountActivity(readAccountActivity(get(), sub)),
        })
      },

      /**
       * Persist Google profile and upsert user in D1 (fire-and-forget).
       * @param {Record<string, unknown>} jwtPayload — decoded ID token claims
       * @param {string} [idToken] — raw credential for Bearer auth
       */
      setGoogleProfileFromJwt: (jwtPayload, idToken = '') => {
        const sub = typeof jwtPayload.sub === 'string' ? jwtPayload.sub.trim() : ''
        const email = typeof jwtPayload.email === 'string' ? jwtPayload.email.trim() : ''
        if (!sub || !email) return
        const name = displayNameFromJwt(jwtPayload)
        const prevSub = get().googleSub

        if (prevSub && prevSub !== sub) {
          set({ accounts: snapshotAccountActivity(get(), prevSub) })
        }

        const accounts = snapshotAccountActivity(get(), prevSub)
        const accountData = readAccountActivity({ ...get(), accounts }, sub)

        set({
          googleSub: sub,
          googleIdToken: typeof idToken === 'string' ? idToken : '',
          email: email.slice(0, 254),
          name,
          accounts,
          activitySynced: false,
          ...applyAccountActivity(accountData),
        })

        void (async () => {
          try {
            const token = typeof idToken === 'string' ? idToken : get().googleIdToken
            if (token?.trim()) {
              await fetch('/api/users', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              })
            }
          } catch {
            /* upsert best-effort */
          }
          await get().syncBirthdayFromServer()
          await get().syncAccountFromServer()
          if (!get().birthLocked) {
            set({ signInPromptOpen: true })
          }
        })()
      },

      setAge: (raw) => {
        const n = typeof raw === 'number' ? raw : Number(raw)
        const a =
          Number.isFinite(n) && !Number.isNaN(n) && n >= 13 && n <= 120 ? Math.floor(n) : null
        set({ age: a, birthDate: '' })
      },

      /** Age from saved birthday, else legacy `age` field */
      getProfileAge: () => {
        const s = get()
        const fromDob = ageFromBirthDateString(s.birthDate)
        if (fromDob != null && fromDob >= 13 && fromDob <= 120) return fromDob
        if (s.age != null && s.age >= 13 && s.age <= 120) return s.age
        return null
      },

      /**
       * [FE-2] Save birthday to Worker (write-once). Falls back to local-only on network error.
       * @param {string} iso `YYYY-MM-DD`
       * @returns {Promise<{ ok: boolean, error?: string }>}
       */
      setBirthDate: async (iso) => {
        const trimmed = String(iso || '').trim()
        const computed = ageFromBirthDateString(trimmed)
        if (computed == null || computed < 13 || computed > 120) {
          set({ birthDate: '', age: null })
          return { ok: false, error: 'invalid_date' }
        }

        if (get().birthLocked) {
          return { ok: false, error: 'birthday_already_set' }
        }

        const sub = get().googleSub
        const token = get().googleIdToken
        if (!sub) {
          set({ birthDate: trimmed, age: computed, birthLocked: true })
          return { ok: true }
        }

        if (!token?.trim()) {
          return { ok: false, error: 'unauthorized' }
        }

        try {
          await get().ensureUserOnServer()
          const res = await fetch('/api/users/me/birthday', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ birthDate: trimmed }),
          })

          if (res.ok) {
            set({ birthDate: trimmed, age: computed, birthLocked: true }) // [FE-2]
            return { ok: true }
          }

          if (res.status === 409) {
            const data = await res.json().catch(() => ({}))
            set({
              birthLocked: true, // [FE-2]
              birthDate: data.birthDate || get().birthDate, // [FE-2]
            })
            return { ok: false, error: 'birthday_already_set' }
          }

          return { ok: false, error: 'server_error' }
        } catch {
          set({ birthDate: trimmed, age: computed }) // [FE-2] graceful local fallback
          return { ok: false, error: 'network_error' }
        }
      },

      /** Clears Google session only; keeps birthday, age cache, and activity on this device */
      signOut: () => {
        get()._commitAccount()
        set({
          googleSub: '',
          googleIdToken: '',
          email: '',
          name: '',
          activitySynced: false,
          ...applyAccountActivity(emptyAccountActivity()),
        })
      },

      /** Drop expired ID token but keep profile hints so UI can prompt re-login. */
      clearExpiredGoogleSession: () => {
        const token = get().googleIdToken
        if (!token?.trim() || !isGoogleIdTokenExpired(token)) return false
        get()._commitAccount()
        set({
          googleIdToken: '',
          activitySynced: false,
          ...applyAccountActivity(emptyAccountActivity()),
        })
        return true
      },

      pushActivity: (entry) => {
        const full = { ...entry, id: entry.id || `a-${Date.now()}`, at: entry.at || Date.now() }
        set({
          activityFeed: [full, ...get().activityFeed].slice(0, 200),
        })
        void get()._persistActivity({
          id: full.id,
          type: full.type,
          title: full.title,
          detail: full.detail,
          discussionId: full.detail,
          at: full.at,
        })
      },

      recordPostCreated: ({ discussionId, title }) => {
        const entry = {
          id: `a-${Date.now()}`,
          type: 'post',
          title,
          at: Date.now(),
          detail: discussionId,
        }
        set({
          stats: { ...get().stats, postsCreated: (get().stats.postsCreated || 0) + 1 },
          activityFeed: [entry, ...get().activityFeed].slice(0, 200),
          joinedDiscussionIds: Array.from(new Set([discussionId, ...get().joinedDiscussionIds])),
        })
        void get()._persistActivity({
          ...entry,
          discussionId,
        })
      },

      recordComment: ({ discussionId, title, category, body }) => {
        const h = {
          discussionId,
          title,
          category: category || CATEGORIES[0],
          body: body || '',
          at: Date.now(),
        }
        set({
          commentHistory: [h, ...get().commentHistory].slice(0, 200),
          joinedDiscussionIds: Array.from(
            new Set([discussionId, ...get().joinedDiscussionIds]),
          ),
          activityFeed: [
            {
              id: `a-${Date.now()}`,
              type: 'comment',
              title,
              at: h.at,
              detail: discussionId,
            },
            ...get().activityFeed,
          ].slice(0, 200),
        })
        void get()._persistActivity({
          type: 'comment',
          title,
          detail: discussionId,
          discussionId,
          at: h.at,
        })
      },

      recordStance: async ({ discussionId, title, category, stance }) => {
        const at = Date.now()
        try {
          if (get().clearExpiredGoogleSession()) {
            get().openSignInPrompt()
            return {
              ok: false,
              error: 'invalid_token',
              message: 'Your session expired. Sign in again with Google.',
            }
          }
        } catch {
          /* ignore token parse errors */
        }
        const token = get().googleIdToken
        if (!token?.trim()) {
          get().openSignInPrompt()
          return { ok: false, error: 'unauthorized', message: 'Sign in to vote.' }
        }
        if (!get().birthLocked) {
          get().openSignInPrompt()
          return { ok: false, error: 'birthday_required', message: 'Enter your date of birth to vote.' }
        }

        try {
          const res = await fetch(`/api/articles/${encodeURIComponent(discussionId)}/vote`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ stance }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) {
            const code = data.error
            if (code === 'invalid_token' || code === 'unauthorized') {
              get().clearExpiredGoogleSession()
              get().openSignInPrompt()
            }
            throw Object.assign(new Error(authErrorFromResponse(res, data)), { code })
          }
          const h = {
            discussionId,
            stance: data.stance ?? stance,
            category: category || CATEGORIES[0],
            title,
            at,
          }
          set({
            stanceHistory: [h, ...get().stanceHistory.filter((s) => s.discussionId !== discussionId)].slice(
              0,
              400,
            ),
            joinedDiscussionIds: Array.from(
              new Set([discussionId, ...get().joinedDiscussionIds]),
            ),
            activityFeed: [
              {
                id: `a-${Date.now()}`,
                type: 'stance',
                title: title || 'Discussion',
                at,
                detail: h.stance,
              },
              ...get().activityFeed,
            ].slice(0, 200),
          })
          void get()._persistActivity({
            type: 'stance',
            title,
            detail: h.stance,
            discussionId,
            at,
          })
          return { ok: true, stance: h.stance, distribution: data.distribution }
        } catch (err) {
          const message =
            err?.code === 'social_banned'
              ? 'Your account cannot vote due to a community guidelines violation.'
              : err?.message || 'Could not save your vote.'
          return { ok: false, error: err?.code || 'vote_failed', message }
        }
      },

      recordVoteGiven: (delta) => {
        const up = get().stats.upvotesGiven || 0
        const down = get().stats.downvotesGiven || 0
        const entry = {
          id: `a-${Date.now()}`,
          type: 'vote',
          title: delta > 0 ? 'Upvoted a comment' : 'Downvoted a comment',
          at: Date.now(),
        }
        set({
          stats: {
            ...get().stats,
            upvotesGiven: delta > 0 ? up + 1 : up,
            downvotesGiven: delta < 0 ? down + 1 : down,
          },
          activityFeed: [entry, ...get().activityFeed].slice(0, 200),
        })
        void get()._persistActivity(entry)
      },

      toggleDiscussionLike: async (discussionId, title) => {
        if (!get().isSignedIn()) {
          get().openSignInPrompt()
          return
        }
        if (!get().birthLocked) {
          get().openSignInPrompt()
          return
        }
        const token = get().googleIdToken
        const cur = new Set(get().likedDiscussionIds ?? [])
        const wasLiked = cur.has(discussionId)

        if (wasLiked) {
          cur.delete(discussionId)
          set({
            likedDiscussionIds: [...cur],
            stats: {
              ...get().stats,
              likesGiven: Math.max(0, (get().stats.likesGiven || 0) - 1),
            },
          })
        } else {
          cur.add(discussionId)
          const entry = {
            id: `a-${Date.now()}`,
            type: 'like',
            title: title || 'Discussion',
            at: Date.now(),
            detail: discussionId,
          }
          set({
            likedDiscussionIds: [...cur],
            stats: { ...get().stats, likesGiven: (get().stats.likesGiven || 0) + 1 },
            activityFeed: [entry, ...get().activityFeed].slice(0, 200),
          })
        }

        if (!token?.trim()) return

        try {
          if (wasLiked) {
            await unsaveDebate(token, discussionId)
          } else {
            await saveDebate(token, discussionId)
            void get()._persistActivity({
              type: 'like',
              title: title || 'Discussion',
              detail: discussionId,
              discussionId,
            })
          }
        } catch {
          await get().syncAccountFromServer()
        }
      },

      isDiscussionLiked: (discussionId) => (get().likedDiscussionIds ?? []).includes(discussionId),

      toggleDiscussionSubscribe: async (discussionId, title) => {
        if (!get().isSignedIn()) {
          get().openSignInPrompt()
          return { ok: false, error: 'sign_in_required' }
        }
        if (!get().birthLocked) {
          get().openSignInPrompt()
          return { ok: false, error: 'birthday_required' }
        }
        const token = get().googleIdToken
        if (!token?.trim()) {
          get().openSignInPrompt()
          return { ok: false, error: 'sign_in_required' }
        }

        const cur = new Set(get().subscribedDiscussionIds ?? [])
        const wasSubscribed = cur.has(discussionId)

        if (wasSubscribed) {
          cur.delete(discussionId)
          set({ subscribedDiscussionIds: [...cur] })
        } else {
          cur.add(discussionId)
          set({ subscribedDiscussionIds: [...cur] })
        }

        try {
          if (wasSubscribed) {
            await unsubscribeDebate(token, discussionId)
          } else {
            await subscribeDebate(token, discussionId)
          }
          return { ok: true, subscribed: !wasSubscribed }
        } catch {
          await get().syncAccountFromServer()
          return { ok: false, error: 'sync_failed' }
        }
      },

      isDiscussionSubscribed: (discussionId) =>
        (get().subscribedDiscussionIds ?? []).includes(discussionId),

      categoryEngagement: () => {
        const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) // [CAT-1]
        for (const h of get().commentHistory) {
          const c = h.category
          if (c === 'Tech') counts.Technology = (counts.Technology || 0) + 1 // [CAT-2]
          else if (counts[c] !== undefined) counts[c]++
          else counts[CATEGORIES[0]]++
        }
        return counts
      },

      politicalLean: () => {
        const political = get().stanceHistory.filter((s) => s.category === 'Politics')
        if (!political.length) return 0
        let score = 0
        for (const s of political) {
          if (s.stance === 'For') score += 0.15
          if (s.stance === 'Against') score -= 0.15
        }
        return Math.max(-1, Math.min(1, score))
      },
    }),
    {
      name: 'polaris-user-v2',
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted || {}) }
        return migrateLegacyAccountState(merged)
      },
      onRehydrateStorage: () => (state) => {
        if (!state?.googleSub?.trim()) return
        if (state.googleIdToken?.trim() && isGoogleIdTokenExpired(state.googleIdToken)) {
          state.googleIdToken = ''
        }
        if (!state.googleIdToken?.trim()) return
        queueMicrotask(async () => {
          const store = useUserStore.getState()
          await store.syncBirthdayFromServer()
          await store.syncAccountFromServer()
        })
      },
      partialize: (s) => ({
        googleSub: s.googleSub,
        googleIdToken: s.googleIdToken,
        email: s.email,
        name: s.name,
        age: s.age,
        birthDate: s.birthDate,
        birthLocked: s.birthLocked,
        accounts: snapshotAccountActivity(s, s.googleSub),
      }),
    },
  ),
)
