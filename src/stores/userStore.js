import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

/** @param {string} iso `YYYY-MM-DD` (calendar date in local terms when parsed as UTC midnight is wrong — parse parts manually) */
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
      email: '',
      name: '',
      /** @type {number | null} legacy / cache when using date of birth */
      age: null,
      /** `YYYY-MM-DD`, device-local; reused after Google sign-out */
      birthDate: '',
      commentHistory: [],
      stanceHistory: [],
      joinedDiscussionIds: [],
      stats: emptyStats(),
      /** @type {{ id: string; type: string; title?: string; at: number; detail?: string }[]} */
      activityFeed: [],
      likedDiscussionIds: [],

      /**
       * Persist only what we need from Google: sub, email, name.
       * @param {Record<string, unknown>} jwtPayload — decoded ID token claims
       */
      setGoogleProfileFromJwt: (jwtPayload) => {
        const sub = typeof jwtPayload.sub === 'string' ? jwtPayload.sub.trim() : ''
        const email = typeof jwtPayload.email === 'string' ? jwtPayload.email.trim() : ''
        if (!sub || !email) return
        set({
          googleSub: sub,
          email: email.slice(0, 254),
          name: displayNameFromJwt(jwtPayload),
        })
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
       * @param {string} iso `YYYY-MM-DD`
       */
      setBirthDate: (iso) => {
        const trimmed = String(iso || '').trim()
        const computed = ageFromBirthDateString(trimmed)
        if (computed == null || computed < 13 || computed > 120) {
          set({ birthDate: '', age: null })
          return
        }
        set({ birthDate: trimmed, age: computed })
      },

      /** Clears Google session only; keeps birthday, age cache, and activity on this device */
      signOut: () =>
        set({
          googleSub: '',
          email: '',
          name: '',
        }),

      pushActivity: (entry) => {
        set({
          activityFeed: [{ ...entry, id: entry.id || `a-${Date.now()}` }, ...get().activityFeed].slice(
            0,
            200,
          ),
        })
      },

      recordPostCreated: ({ discussionId, title }) => {
        set({
          stats: { ...get().stats, postsCreated: (get().stats.postsCreated || 0) + 1 },
          activityFeed: [
            {
              id: `a-${Date.now()}`,
              type: 'post',
              title,
              at: Date.now(),
              detail: discussionId,
            },
            ...get().activityFeed,
          ].slice(0, 200),
        })
      },

      recordComment: ({ discussionId, title, category, stance }) => {
        const h = {
          discussionId,
          title,
          category: category || 'Society',
          stance,
          at: Date.now(),
        }
        set({
          commentHistory: [h, ...get().commentHistory].slice(0, 200),
          stanceHistory: [
            { discussionId, stance, category: h.category, at: h.at },
            ...get().stanceHistory,
          ].slice(0, 400),
          joinedDiscussionIds: Array.from(
            new Set([discussionId, ...get().joinedDiscussionIds]),
          ),
          activityFeed: [
            {
              id: `a-${Date.now()}`,
              type: 'comment',
              title,
              at: Date.now(),
              detail: stance,
            },
            ...get().activityFeed,
          ].slice(0, 200),
        })
      },

      recordVoteGiven: (delta) => {
        const up = get().stats.upvotesGiven || 0
        const down = get().stats.downvotesGiven || 0
        set({
          stats: {
            ...get().stats,
            upvotesGiven: delta > 0 ? up + 1 : up,
            downvotesGiven: delta < 0 ? down + 1 : down,
          },
          activityFeed: [
            {
              id: `a-${Date.now()}`,
              type: 'vote',
              title: delta > 0 ? 'Upvoted a comment' : 'Downvoted a comment',
              at: Date.now(),
            },
            ...get().activityFeed,
          ].slice(0, 200),
        })
      },

      toggleDiscussionLike: (discussionId, title) => {
        const cur = new Set(get().likedDiscussionIds ?? [])
        if (cur.has(discussionId)) {
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
          set({
            likedDiscussionIds: [...cur],
            stats: { ...get().stats, likesGiven: (get().stats.likesGiven || 0) + 1 },
            activityFeed: [
              {
                id: `a-${Date.now()}`,
                type: 'like',
                title: title || 'Discussion',
                at: Date.now(),
                detail: discussionId,
              },
              ...get().activityFeed,
            ].slice(0, 200),
          })
        }
      },

      isDiscussionLiked: (discussionId) => (get().likedDiscussionIds ?? []).includes(discussionId),

      categoryEngagement: () => {
        const cats = ['Politics', 'Tech', 'Society', 'Science', 'Culture']
        const counts = Object.fromEntries(cats.map((c) => [c, 0]))
        for (const h of get().commentHistory) {
          const c = h.category
          if (counts[c] !== undefined) counts[c]++
          else counts.Society++
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
      name: 'polaris-user-v1',
      partialize: (s) => ({
        googleSub: s.googleSub,
        email: s.email,
        name: s.name,
        age: s.age,
        birthDate: s.birthDate,
        commentHistory: s.commentHistory,
        stanceHistory: s.stanceHistory,
        joinedDiscussionIds: s.joinedDiscussionIds,
        stats: s.stats,
        activityFeed: s.activityFeed,
        likedDiscussionIds: s.likedDiscussionIds,
      }),
    },
  ),
)
