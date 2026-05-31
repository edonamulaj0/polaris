import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'

function toIsoLocalDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** @param {string} iso `YYYY-MM-DD` */
function formatBirthdayLong(iso) {
  if (!iso || typeof iso !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { dateStyle: 'long' })
}

function stancePill(stance) {
  if (stance === 'For') return 'bg-[var(--stance-for-bg)] text-[var(--stance-for-text)] ring-[var(--stance-for-text)]/35'
  if (stance === 'Against') return 'bg-[var(--stance-against-bg)] text-[var(--stance-against-text)] ring-[var(--stance-against-text)]/35'
  return 'bg-[var(--stance-neutral-bg)] text-[var(--stance-neutral-text)] ring-[var(--stance-neutral-text)]/30'
}

const defaultStats = {
  postsCreated: 0,
  upvotesGiven: 0,
  downvotesGiven: 0,
  likesGiven: 0,
}

function ProfileBirthdayEditor({ birthDate, dobMin, dobMax, setBirthDate }) {
  const [dobEdit, setDobEdit] = useState(birthDate || '')
  return (
    <section className="mt-8 rounded-none border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="font-heading text-sm font-semibold text-[var(--text)]">Update birthday</h2>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Stored only on this device. Kept when you sign out of Google until you clear site data.
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Date</label>
          <input
            type="date"
            min={dobMin}
            max={dobMax}
            value={dobEdit}
            onChange={(e) => setDobEdit(e.target.value)}
            className="mt-1 w-full rounded-none border border-[var(--border)] bg-[var(--surface-hi)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--signal)]/45"
          />
        </div>
        <button
          type="button"
          disabled={!dobEdit || dobEdit < dobMin || dobEdit > dobMax}
          onClick={() => setBirthDate(dobEdit)}
          className="rounded-none bg-[var(--signal)] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[var(--signal-on)] disabled:opacity-40"
        >
          Save birthday
        </button>
      </div>
    </section>
  )
}

function ProfileField({ label, children }) {
  return (
    <div className="border-b border-[var(--border)] py-3 last:border-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 text-sm text-[var(--text)]">{children}</dd>
    </div>
  )
}

export function ProfilePage() {
  const { username: routeName } = useParams()
  const [userPersistReady, setUserPersistReady] = useState(() => useUserStore.persist.hasHydrated())

  useEffect(() => {
    if (userPersistReady) return undefined
    return useUserStore.persist.onFinishHydration(() => setUserPersistReady(true))
  }, [userPersistReady])

  const selfName = useUserStore((s) => s.name)
  const selfEmail = useUserStore((s) => s.email)
  const googleSub = useUserStore((s) => s.googleSub)
  const birthDate = useUserStore((s) => s.birthDate)
  const profileAge = useUserStore((s) => s.getProfileAge())
  const setBirthDate = useUserStore((s) => s.setBirthDate)
  const commentHistory = useUserStore((s) => s.commentHistory)
  const joinedDiscussionIds = useUserStore((s) => s.joinedDiscussionIds)
  const statsRaw = useUserStore((s) => s.stats)
  const stats = useMemo(() => ({ ...defaultStats, ...statsRaw }), [statsRaw])
  const activityFeedRaw = useUserStore((s) => s.activityFeed)
  const activityFeed = useMemo(
    () => (Array.isArray(activityFeedRaw) ? activityFeedRaw : []),
    [activityFeedRaw],
  )
  const categoryEngagement = useMemo(() => {
    const cats = ['Politics', 'Tech', 'Society', 'Science', 'Culture']
    const counts = Object.fromEntries(cats.map((c) => [c, 0]))
    for (const h of commentHistory) {
      const c = h.category
      if (counts[c] !== undefined) counts[c]++
      else counts.Society++
    }
    return counts
  }, [commentHistory])

  const isMeRoute = routeName === 'me'
  const displayName =
    isMeRoute ? (selfName?.trim() || (googleSub ? 'Member' : 'Your profile')) : routeName
  const isOwn = isMeRoute || (!!selfName && routeName === selfName)
  const birthdayLabel = formatBirthdayLong(birthDate)

  const cats = ['Politics', 'Tech', 'Society', 'Science', 'Culture']
  const maxCat = Math.max(1, ...cats.map((c) => (isOwn ? categoryEngagement[c] : 0) || 0))

  const historyRows = isOwn ? commentHistory : []

  const { dobMin, dobMax } = useMemo(() => {
    const today = new Date()
    const max = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
    const min = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
    return { dobMin: toIsoLocalDate(min), dobMax: toIsoLocalDate(max) }
  }, [])

  const statTiles = [
    { label: 'Posts started', value: stats.postsCreated },
    { label: 'Comments', value: commentHistory.length },
    { label: 'Likes (threads)', value: stats.likesGiven },
    { label: 'Upvotes given', value: stats.upvotesGiven },
    { label: 'Downvotes given', value: stats.downvotesGiven },
    { label: 'Discussions joined', value: isOwn ? joinedDiscussionIds.length : 0 },
  ]

  if (isMeRoute && !userPersistReady) {
    return (
      <div>
        <p className="text-sm text-[var(--muted)]">Loading profile…</p>
      </div>
    )
  }

  return (
    <div>
      <header className="border-b border-[var(--border)] pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          {isMeRoute ? 'Your account' : 'Profile'}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-semibold text-[var(--text)]">{displayName}</h1>
        {!isOwn && (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Device-local MVP—only <Link to="/profile/me" className="text-[var(--signal)] hover:underline">/profile/me</Link> shows your data.
          </p>
        )}
      </header>

      {isOwn && (
        <section className="mt-8 rounded-none border border-[var(--border)] bg-[var(--surface)] px-4 py-2">
          <h2 className="border-b border-[var(--border)] py-3 font-heading text-sm font-semibold text-[var(--text)]">
            Name & birthday
          </h2>
          <dl>
            <ProfileField label="Name">{selfName?.trim() || '—'}</ProfileField>
            <ProfileField label="Email">{selfEmail?.trim() || '—'}</ProfileField>
            <ProfileField label="Birthday">{birthdayLabel || '—'}</ProfileField>
            <ProfileField label="Age (from birthday)">
              {profileAge != null ? profileAge : '—'}
            </ProfileField>
          </dl>
        </section>
      )}

      {isOwn && (
        <section className="mt-8">
          <h2 className="font-heading text-lg font-semibold text-[var(--text)]">Activity history</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Posts, likes, comments, and votes (newest first).</p>
          <ul className="mt-4 space-y-2">
            {activityFeed.length === 0 && (
              <li className="text-sm text-[var(--muted)]">No activity yet.</li>
            )}
            {activityFeed.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-none border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
              >
                <span className="font-medium capitalize text-[var(--signal)]">{a.type}</span>
                <span className="min-w-0 flex-1 text-[var(--text)]">{a.title || '—'}</span>
                <span className="text-xs text-[var(--muted)]">{new Date(a.at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isOwn && (
        <ProfileBirthdayEditor
          key={birthDate || 'new'}
          birthDate={birthDate}
          dobMin={dobMin}
          dobMax={dobMax}
          setBirthDate={setBirthDate}
        />
      )}

      {isOwn && (
        <section className="mt-8">
          <h2 className="font-heading text-lg font-semibold text-[var(--text)]">Stats</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {statTiles.map((t) => (
              <div
                key={t.label}
                className="rounded-none border border-[var(--border)] bg-[var(--surface)] px-3 py-4 text-center"
              >
                <p className="font-heading text-2xl font-semibold text-[var(--signal)]">{t.value}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
                  {t.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {isOwn && (
        <section className="mt-10">
          <h2 className="font-heading text-lg font-semibold text-[var(--text)]">Topic mix</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Comments by category.</p>
          <div className="mt-4 space-y-3">
            {cats.map((c) => (
              <div key={c}>
                <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
                  <span>{c}</span>
                  <span>{categoryEngagement[c] || 0}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-hi)] ring-1 ring-[var(--border)]">
                  <motion.div
                    className="h-full rounded-full bg-[var(--signal)]"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((categoryEngagement[c] || 0) / maxCat) * 100}%`,
                    }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-heading text-lg font-semibold text-[var(--text)]">Comment threads</h2>
        <ul className="mt-4 space-y-2">
          {historyRows.length === 0 && (
            <li className="text-sm text-[var(--muted)]">
              {isOwn ? 'No comments yet.' : 'No public history for this profile.'}
            </li>
          )}
          {historyRows.map((h) => (
            <li key={`${h.discussionId}-${h.at}`}>
              <Link
                to={`/discussion/${h.discussionId}`}
                className="flex flex-wrap items-center gap-2 rounded-none border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm transition-colors hover:border-[var(--signal)]/35"
              >
                <span className="min-w-0 flex-1 font-medium text-[var(--text)]">{h.title}</span>
                <span
                  className={`rounded-none px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${stancePill(h.stance)}`}
                >
                  {h.stance}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
