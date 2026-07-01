import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AiFillHeart } from 'react-icons/ai'
import { buildSavedDebates } from '../lib/resolveDiscussionMeta'
import { fetchEditorStatus, registerEditor, resetEditorPin } from '../lib/editorApi'
import { useFeedStore } from '../stores/feedStore'
import { useUserStore } from '../stores/userStore'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'saved', label: 'Saved' },
  { id: 'stances', label: 'Stances' },
  { id: 'comments', label: 'Comments' },
]

function stancePill(stance) {
  if (stance === 'For') return 'bg-[var(--stance-for-bg)] text-[var(--stance-for-text)] ring-[var(--stance-for-text)]/35'
  if (stance === 'Against') return 'bg-[var(--stance-against-bg)] text-[var(--stance-against-text)] ring-[var(--stance-against-text)]/35'
  return 'bg-[var(--stance-neutral-bg)] text-[var(--stance-neutral-text)] ring-[var(--stance-neutral-text)]/30'
}

function initials(name, email) {
  const src = (name || email || '?').trim()
  const parts = src.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return src.slice(0, 2).toUpperCase()
}

function formatMemberSince(ts) {
  if (!ts) return null
  return new Date(ts * 1000).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

async function fetchServerProfile(token) {
  const res = await fetch('/api/users/me/profile', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('profile_fetch_failed')
  return res.json()
}

function ProfileAvatar({ name, email }) {
  return (
    <div
      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-[var(--signal)] bg-[var(--surface-hi)] font-display text-2xl uppercase tracking-wide text-[var(--text-hi)] sm:h-24 sm:w-24 sm:text-3xl"
      aria-hidden
    >
      {initials(name, email)}
    </div>
  )
}

function StatPill({ value, label }) {
  return (
    <div className="flex flex-col items-center px-4 py-2 sm:px-6">
      <span className="font-heading text-2xl font-semibold text-[var(--text-hi)]">{value}</span>
      <span className="font-mono text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">{label}</span>
    </div>
  )
}

function EditorAccessSection({ googleIdToken }) {
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [isEditor, setIsEditor] = useState(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetPin, setResetPin] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetMsg, setResetMsg] = useState('')

  useEffect(() => {
    if (!googleIdToken) {
      setIsEditor(false)
      return
    }
    let cancelled = false
    fetchEditorStatus(googleIdToken)
      .then((data) => {
        if (!cancelled) setIsEditor(Boolean(data.isEditor))
      })
      .catch(() => {
        if (!cancelled) setIsEditor(false)
      })
    return () => {
      cancelled = true
    }
  }, [googleIdToken])

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      setError('PIN must be exactly 4 digits.')
      return
    }
    if (pin !== confirmPin) {
      setError('PINs do not match.')
      return
    }
    setBusy(true)
    const result = await registerEditor(googleIdToken, pin, confirmPin)
    setBusy(false)
    if (!result.ok) {
      setError(result.message || 'Registration failed.')
      return
    }
    setIsEditor(true)
    setOpen(false)
    setPin('')
    setConfirmPin('')
  }

  async function handleResetPin(e) {
    e.preventDefault()
    setError('')
    setResetMsg('')
    if (resetPin.length !== 4 || !/^\d+$/.test(resetPin)) {
      setError('PIN must be exactly 4 digits.')
      return
    }
    if (resetPin !== resetConfirm) {
      setError('PINs do not match.')
      return
    }
    setBusy(true)
    const result = await resetEditorPin(googleIdToken, resetPin, resetConfirm)
    setBusy(false)
    if (!result.ok) {
      setError(result.message || 'Could not reset PIN.')
      return
    }
    setResetOpen(false)
    setResetPin('')
    setResetConfirm('')
    setResetMsg('PIN updated. Use the new PIN when opening the editor panel.')
  }

  if (isEditor === null) return null

  return (
    <section className="mt-12 border-t border-[var(--border)] pt-6">
      <h2 className="font-mono text-[10px] uppercase tracking-[.15em] text-[var(--signal)]">
        Editorial access
      </h2>
      {isEditor ? (
        <div className="mt-4 border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
          <p className="text-sm text-[var(--muted)]">
            You are registered as an editor. Open the editor panel to review submissions and moderate
            flagged comments. You will be asked for your PIN each session.
          </p>
          <Link
            to="/manager"
            className="signal-glow-hover mt-4 inline-block bg-[var(--signal)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[.12em] text-[var(--signal-on)]"
          >
            Open editor panel
          </Link>
          {!resetOpen ? (
            <button
              type="button"
              onClick={() => {
                setResetOpen(true)
                setError('')
                setResetMsg('')
              }}
              className="mt-3 block text-xs text-[var(--muted)] underline-offset-2 hover:text-[var(--signal)] hover:underline"
            >
              Reset editor PIN
            </button>
          ) : (
            <form onSubmit={handleResetPin} className="mt-4 max-w-sm space-y-3">
              <p className="text-xs text-[var(--muted)]">
                Set a new 4-digit PIN. Your Google sign-in must be active to reset it.
              </p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={resetPin}
                onChange={(e) => setResetPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full border border-[var(--border)] bg-[var(--surface-hi)] px-3 py-2 font-mono text-lg tracking-[.4em] text-center text-[var(--text-hi)] outline-none focus:border-[var(--signal)]"
                placeholder="New PIN"
                disabled={busy}
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full border border-[var(--border)] bg-[var(--surface-hi)] px-3 py-2 font-mono text-lg tracking-[.4em] text-center text-[var(--text-hi)] outline-none focus:border-[var(--signal)]"
                placeholder="Confirm PIN"
                disabled={busy}
              />
              {error && (
                <p className="text-xs text-[var(--signal)]" role="alert">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="bg-[var(--signal)] px-4 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--signal-on)] disabled:opacity-50"
                >
                  {busy ? 'Saving…' : 'Save new PIN'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetOpen(false)
                    setResetPin('')
                    setResetConfirm('')
                    setError('')
                  }}
                  className="px-4 py-2 text-[10px] font-mono uppercase tracking-wide text-[var(--muted)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {resetMsg && <p className="mt-3 text-xs text-[var(--teal-calm)]">{resetMsg}</p>}
        </div>
      ) : (
        <div className="mt-4">
          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-sm text-[var(--signal)] underline-offset-2 hover:underline"
            >
              Become an editor
            </button>
          ) : (
            <form
              onSubmit={handleRegister}
              className="max-w-sm space-y-3 border border-[var(--border)] bg-[var(--surface)] px-4 py-4"
            >
              <p className="text-sm text-[var(--muted)]">
                Choose a 4-digit PIN to protect the editor panel. It is stored securely on the server
                and required along with your Google sign-in.
              </p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full border border-[var(--border)] bg-[var(--surface-hi)] px-3 py-2 font-mono text-lg tracking-[.4em] text-center text-[var(--text-hi)] outline-none focus:border-[var(--signal)]"
                placeholder="PIN"
                disabled={busy}
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full border border-[var(--border)] bg-[var(--surface-hi)] px-3 py-2 font-mono text-lg tracking-[.4em] text-center text-[var(--text-hi)] outline-none focus:border-[var(--signal)]"
                placeholder="Confirm PIN"
                disabled={busy}
              />
              {error && (
                <p className="text-xs text-[var(--signal)]" role="alert">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="bg-[var(--signal)] px-4 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--signal-on)] disabled:opacity-50"
                >
                  {busy ? 'Registering…' : 'Register as editor'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setError('')
                    setPin('')
                    setConfirmPin('')
                  }}
                  className="px-4 py-2 text-[10px] font-mono uppercase tracking-wide text-[var(--muted)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  )
}

export function ProfilePage() {
  const { username: routeName } = useParams()
  const [tab, setTab] = useState('overview')
  const [userPersistReady, setUserPersistReady] = useState(() => useUserStore.persist.hasHydrated())
  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => {
    if (userPersistReady) return undefined
    return useUserStore.persist.onFinishHydration(() => setUserPersistReady(true))
  }, [userPersistReady])

  const selfName = useUserStore((s) => s.name)
  const selfEmail = useUserStore((s) => s.email)
  const googleSub = useUserStore((s) => s.googleSub)
  const googleIdToken = useUserStore((s) => s.googleIdToken)
  const birthDate = useUserStore((s) => s.birthDate)
  const birthLocked = useUserStore((s) => s.birthLocked)
  const profileAge = useUserStore((s) => s.getProfileAge())
  const commentHistory = useUserStore((s) => s.commentHistory)
  const stanceHistory = useUserStore((s) => s.stanceHistory)
  const joinedDiscussionIds = useUserStore((s) => s.joinedDiscussionIds)
  const activityFeedRaw = useUserStore((s) => s.activityFeed)
  const likedDiscussionIds = useUserStore((s) => s.likedDiscussionIds)
  const feedPosts = useFeedStore((s) => (s.allPosts.length ? s.allPosts : s.posts))

  const activityFeed = useMemo(
    () => (Array.isArray(activityFeedRaw) ? activityFeedRaw : []),
    [activityFeedRaw],
  )

  useEffect(() => {
    if (!feedPosts.length) useFeedStore.getState().bootstrap()
  }, [feedPosts.length])

  const { data: serverProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', googleSub],
    queryFn: () => fetchServerProfile(googleIdToken),
    enabled: Boolean(googleSub && googleIdToken),
    staleTime: 60_000,
  })

  const savedDebates = useMemo(
    () => buildSavedDebates(likedDiscussionIds, activityFeed),
    [likedDiscussionIds, activityFeed, feedPosts],
  )

  const stanceRows = useMemo(() => {
    const byDiscussion = new Map()
    for (const s of stanceHistory) {
      if (!byDiscussion.has(s.discussionId)) byDiscussion.set(s.discussionId, s)
    }
    return [...byDiscussion.values()]
  }, [stanceHistory])

  const isMeRoute = routeName === 'me'
  const isOwn = isMeRoute || (!!selfName && routeName === selfName)
  const displayName =
    isMeRoute ? (selfName?.trim() || (googleSub ? 'Member' : 'Your profile')) : routeName

  const memberSince = formatMemberSince(serverProfile?.user?.memberSince)
  const serverComments = serverProfile?.recentComments ?? []
  const serverVotes = serverProfile?.recentVotes ?? []

  const headlineStats = [
    { value: serverProfile?.stats?.comments ?? commentHistory.length, label: 'Comments' },
    { value: savedDebates.length, label: 'Saved' },
    { value: stanceRows.length || serverVotes.length, label: 'Stances' },
    { value: joinedDiscussionIds.length, label: 'Joined' },
  ]

  if (isMeRoute && !userPersistReady) {
    return <p className="text-sm text-[var(--muted)]">Loading profile…</p>
  }

  if (isMeRoute && !googleSub) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold text-[var(--text-hi)]">Your profile</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">Sign in with Google to view your debate profile.</p>
      </div>
    )
  }

  return (
    <div className="pb-12">
      {/* Hero */}
      <div className="relative -mx-4 mb-8 overflow-hidden border-b border-[var(--border)] sm:-mx-6 lg:mx-0 lg:rounded-none lg:border lg:border-[var(--border)]">
        <div className="h-28 bg-gradient-to-r from-[var(--signal)]/25 via-[var(--surface-hi)] to-[var(--page)] sm:h-36" />
        <div className="relative px-4 pb-6 sm:px-6">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:gap-6">
            <ProfileAvatar name={isOwn ? selfName : displayName} email={isOwn ? selfEmail : ''} />
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-2xl font-semibold leading-tight text-[var(--text-hi)] sm:text-3xl">
                {displayName}
              </h1>
              {isOwn && selfEmail && (
                <p className="mt-1 truncate font-mono text-xs text-[var(--muted)]">{selfEmail}</p>
              )}
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[.15em] text-[var(--signal)]">
                {memberSince ? `Member since ${memberSince}` : 'Polaris member'}
                {profileAge != null && ` · Age ${profileAge}`}
              </p>
            </div>
          </div>

          {isOwn && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
              Debate profile tied to your Google account. Saved debates, stances, comments, and
              activity sync across devices when you sign in.
            </p>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {isOwn && (
        <div className="mb-8 flex flex-wrap justify-around divide-x divide-[var(--border)] rounded-none border border-[var(--border)] bg-[var(--surface)]">
          {headlineStats.map((s) => (
            <StatPill key={s.label} value={s.value} label={s.label} />
          ))}
        </div>
      )}

      {/* Tabs */}
      {isOwn && (
        <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[.12em] transition-colors ${
                tab === t.id
                  ? 'bg-[var(--signal)] text-[var(--signal-on)]'
                  : 'border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab panels */}
      {isOwn && tab === 'overview' && (
        <div className="space-y-8">
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--signal)]">
              Recent activity
            </h2>
            <ul className="mt-4 space-y-2">
              {activityFeed.length === 0 && !profileLoading && (
                <li className="text-sm text-[var(--muted)]">
                  No activity yet — vote on a debate or leave a comment.
                </li>
              )}
              {activityFeed.slice(0, 12).map((a) => {
                const linkId = a.detail || a.discussionId
                const row = (
                  <>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--signal)]">
                      {a.type}
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-[var(--text)]">{a.title || '—'}</span>
                    <span className="text-xs text-[var(--muted)]">
                      {new Date(a.at).toLocaleDateString()}
                    </span>
                  </>
                )
                return (
                  <li key={a.id}>
                    {linkId ? (
                      <Link
                        to={`/discussion/${encodeURIComponent(linkId)}`}
                        className="flex flex-wrap items-center gap-3 border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--signal)]/40"
                      >
                        {row}
                      </Link>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3 border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                        {row}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          {serverProfile?.recentTopics?.length > 0 && (
            <section>
              <h2 className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--signal)]">
                Topics you submitted
              </h2>
              <ul className="mt-4 space-y-2">
                {serverProfile.recentTopics.map((t) => (
                  <li key={t.id}>
                    <Link
                      to={`/discussion/${encodeURIComponent(t.id)}`}
                      className="flex items-center justify-between gap-3 border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm hover:border-[var(--signal)]/40"
                    >
                      <span className="font-medium text-[var(--text-hi)]">{t.title}</span>
                      <span className="font-mono text-[9px] uppercase text-[var(--muted)]">
                        {t.verified ? 'Verified' : 'Pending'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {isOwn && tab === 'saved' && (
        <section>
          <ul className="space-y-2">
            {savedDebates.length === 0 && (
              <li className="py-8 text-center text-sm text-[var(--muted)]">
                No saved debates — tap the heart on any card.
              </li>
            )}
            {savedDebates.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/discussion/${encodeURIComponent(item.id)}`}
                  className="group flex items-start gap-3 border border-[var(--border)] bg-[var(--surface)] px-4 py-4 transition-colors hover:border-[var(--signal)]/40"
                >
                  <AiFillHeart className="mt-1 h-4 w-4 shrink-0 text-[var(--signal)]" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug text-[var(--text-hi)] group-hover:text-[var(--signal)]">
                      {item.title}
                    </p>
                    {item.category && (
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-[var(--muted)]">
                        {item.category}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isOwn && tab === 'stances' && (
        <section>
          <ul className="space-y-2">
            {stanceRows.length === 0 && serverVotes.length === 0 && (
              <li className="py-8 text-center text-sm text-[var(--muted)]">
                No stances yet — vote For, Against, or Neutral on a debate.
              </li>
            )}
            {stanceRows.map((s) => (
              <li key={s.discussionId}>
                <Link
                  to={`/discussion/${encodeURIComponent(s.discussionId)}`}
                  className="flex items-center gap-3 border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm hover:border-[var(--signal)]/40"
                >
                  <span className={`shrink-0 rounded-none px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${stancePill(s.stance)}`}>
                    {s.stance}
                  </span>
                  <span className="min-w-0 flex-1 font-medium text-[var(--text)]">
                    {commentHistory.find((c) => c.discussionId === s.discussionId)?.title ||
                      serverVotes.find((v) => v.articleId === s.discussionId)?.title ||
                      s.discussionId}
                  </span>
                </Link>
              </li>
            ))}
            {stanceRows.length === 0 &&
              serverVotes.map((v) => (
                <li key={v.articleId}>
                  <Link
                    to={`/discussion/${encodeURIComponent(v.articleId)}`}
                    className="flex items-center gap-3 border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm hover:border-[var(--signal)]/40"
                  >
                    <span className={`shrink-0 rounded-none px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${stancePill(v.stance)}`}>
                      {v.stance}
                    </span>
                    <span className="min-w-0 flex-1 font-medium text-[var(--text)]">{v.title}</span>
                    <span className="font-mono text-[9px] text-[var(--muted)]">Server</span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}

      {isOwn && tab === 'comments' && (
        <section>
          <ul className="space-y-3">
            {serverComments.length === 0 && commentHistory.length === 0 && !profileLoading && (
              <li className="py-8 text-center text-sm text-[var(--muted)]">No comments yet.</li>
            )}
            {serverComments.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/discussion/${encodeURIComponent(c.debateId)}`}
                  className="block border border-[var(--border)] bg-[var(--surface)] px-4 py-4 transition-colors hover:border-[var(--signal)]/40"
                >
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--signal)]">
                    {c.debateTitle}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--text)]">{c.body}</p>
                  <p className="mt-2 font-mono text-[9px] text-[var(--muted)]">
                    {new Date(c.createdAt * 1000).toLocaleString()}
                  </p>
                </Link>
              </li>
            ))}
            {serverComments.length === 0 &&
              commentHistory.map((h) => (
                <li key={`${h.discussionId}-${h.at}`}>
                  <Link
                    to={`/discussion/${encodeURIComponent(h.discussionId)}`}
                    className="flex items-center gap-2 border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm hover:border-[var(--signal)]/40"
                  >
                    <span className="min-w-0 flex-1 font-medium text-[var(--text)]">{h.title}</span>
                    <span className={`rounded-none px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${stancePill(h.stance)}`}>
                      {h.stance}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}

      {!isOwn && (
        <p className="text-sm text-[var(--muted)]">
          Public profiles are limited.{' '}
          <Link to="/profile/me" className="text-[var(--signal)] hover:underline">
            View your profile
          </Link>
        </p>
      )}

      {/* Account details — collapsed, not the main focus */}
      {isOwn && (
        <section className="mt-12 border-t border-[var(--border)] pt-6">
          <button
            type="button"
            onClick={() => setAccountOpen((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-[.15em] text-[var(--muted)] hover:text-[var(--text)]"
          >
            {accountOpen ? '▾ Hide account details' : '▸ Account details'}
          </button>
          {accountOpen && (
            <dl className="mt-4 space-y-3 border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm">
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-widest text-[var(--muted)]">Google account</dt>
                <dd className="mt-1 text-[var(--text)]">{selfEmail || '—'}</dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-widest text-[var(--muted)]">Birthday</dt>
                <dd className="mt-1 text-[var(--text)]">
                  {birthDate
                    ? new Date(birthDate + 'T12:00:00').toLocaleDateString(undefined, { dateStyle: 'long' })
                    : 'Not set'}
                  {birthLocked && (
                    <span className="ml-2 font-mono text-[9px] text-[var(--muted)]">(locked)</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-widest text-[var(--muted)]">Account ID</dt>
                <dd className="mt-1 break-all font-mono text-[10px] text-[var(--muted)]">{googleSub}</dd>
              </div>
            </dl>
          )}
        </section>
      )}

      {isOwn && googleIdToken && <EditorAccessSection googleIdToken={googleIdToken} />}
    </div>
  )
}
