import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { IoLockClosedOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoPencilOutline } from 'react-icons/io5'
import { VerifiedBadge } from '../components/VerifiedBadge'

const MANAGER_PIN_KEY = 'polaris_mgr_pin'
const EDITOR_KEY_STORAGE = 'polaris_editor_key'

/** [REFACTOR S-2] SHA-256 digest — never store plaintext PIN in localStorage */
async function hashPin(pin) {
  const data = new TextEncoder().encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function verifyEditorKey(key) {
  const res = await fetch('/api/editor/articles?filter=pending', {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (res.status === 401) return { ok: false, error: 'Invalid editor API key.' }
  if (!res.ok) return { ok: false, error: 'Could not reach editor API.' }
  return { ok: true }
}

function PinGate({ onUnlock }) {
  const [input, setInput] = useState('')
  const [editorKeyDraft, setEditorKeyDraft] = useState('')
  const [mode, setMode] = useState(() =>
    localStorage.getItem(MANAGER_PIN_KEY) ? 'enter' : 'create',
  )
  const [needsEditorKey, setNeedsEditorKey] = useState(
    () => mode === 'enter' && !localStorage.getItem(EDITOR_KEY_STORAGE),
  )
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (mode === 'create') {
      if (input.length !== 4 || !/^\d+$/.test(input)) {
        setError('PIN must be exactly 4 digits.')
        return
      }
      if (input !== confirm) {
        setError('PINs do not match.')
        return
      }
      const trimmedKey = editorKeyDraft.trim()
      if (!trimmedKey) {
        setError('Enter your editor API key once — it stays on this device.')
        return
      }
      setSubmitting(true)
      const verified = await verifyEditorKey(trimmedKey)
      if (!verified.ok) {
        setError(verified.error)
        setSubmitting(false)
        return
      }
      const digest = await hashPin(input)
      localStorage.setItem(MANAGER_PIN_KEY, digest)
      localStorage.setItem(EDITOR_KEY_STORAGE, trimmedKey)
      setSubmitting(false)
      onUnlock('Editor', trimmedKey)
      return
    }

    const stored = localStorage.getItem(MANAGER_PIN_KEY)
    const digest = await hashPin(input)
    if (digest !== stored) {
      setError('Incorrect PIN.')
      return
    }

    let editorKey = localStorage.getItem(EDITOR_KEY_STORAGE)
    if (!editorKey || needsEditorKey) {
      const trimmedKey = editorKeyDraft.trim()
      if (!trimmedKey) {
        setNeedsEditorKey(true)
        setError('Enter your editor API key once — then only your PIN is needed.')
        return
      }
      setSubmitting(true)
      const verified = await verifyEditorKey(trimmedKey)
      if (!verified.ok) {
        setError(verified.error)
        setSubmitting(false)
        return
      }
      localStorage.setItem(EDITOR_KEY_STORAGE, trimmedKey)
      editorKey = trimmedKey
      setSubmitting(false)
    }

    onUnlock('Editor', editorKey)
  }

  function resetSetup() {
    localStorage.removeItem(MANAGER_PIN_KEY)
    localStorage.removeItem(EDITOR_KEY_STORAGE)
    setMode('create')
    setNeedsEditorKey(false)
    setInput('')
    setConfirm('')
    setEditorKeyDraft('')
    setError('')
  }

  const showEditorKeyField = mode === 'create' || needsEditorKey

  return (
    <div className="mx-auto mt-20 max-w-xs">
      <div className="flex items-center gap-2 mb-6">
        <IoLockClosedOutline className="h-5 w-5 text-[var(--signal)]" />
        <h1 className="font-display text-2xl text-[var(--text-hi)] uppercase tracking-widest">
          Editor Panel
        </h1>
      </div>
      <hr className="signal mb-6" />
      <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)] mb-4">
        {mode === 'create'
          ? 'Create a PIN and link this device to the editor API'
          : 'Enter your PIN to continue'}
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="w-full rounded-none border border-[var(--border)] bg-[var(--surface-hi)] px-4 py-3 font-mono text-xl tracking-[.5em] text-center text-[var(--text-hi)] outline-none focus:border-[var(--signal)]"
          placeholder="• • • •"
          autoFocus
        />
        {mode === 'create' && (
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full rounded-none border border-[var(--border)] bg-[var(--surface-hi)] px-4 py-3 font-mono text-xl tracking-[.5em] text-center text-[var(--text-hi)] outline-none focus:border-[var(--signal)]"
            placeholder="Confirm PIN"
          />
        )}
        {showEditorKeyField && (
          <div>
            <label className="mb-1.5 block font-mono text-[9px] uppercase tracking-widest text-[var(--muted)]">
              Editor API key {mode === 'enter' ? '(one time)' : ''}
            </label>
            <input
              type="password"
              value={editorKeyDraft}
              onChange={(e) => setEditorKeyDraft(e.target.value)}
              className="w-full rounded-none border border-[var(--border)] bg-[var(--surface-hi)] px-4 py-3 font-mono text-sm text-[var(--text-hi)] outline-none focus:border-[var(--signal)]"
              placeholder="From wrangler secret put EDITOR_SECRET"
            />
          </div>
        )}
        {error && (
          <p className="font-mono text-[10px] text-[var(--signal)] uppercase tracking-wide">{error}</p>
        )}
        <motion.button
          type="submit"
          disabled={submitting}
          className="signal-glow-hover w-full bg-[var(--signal)] py-3 text-[11px] font-bold uppercase tracking-[.12em] text-[var(--signal-on)] disabled:opacity-50"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {submitting ? 'Verifying…' : mode === 'create' ? 'Set up & Enter' : 'Unlock'}
        </motion.button>
        {mode === 'enter' && (
          <button
            type="button"
            onClick={resetSetup}
            className="w-full text-[9px] font-mono uppercase tracking-wide text-[var(--muted)] hover:text-[var(--signal)]"
          >
            Reset PIN &amp; device setup
          </button>
        )}
      </form>
    </div>
  )
}

function BulletEditor({ bullets, onChange, label, color }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => (bullets || []).join('\n'))

  function save() {
    onChange(draft.split('\n').map(s => s.trim()).filter(Boolean))
    setEditing(false)
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <p className="font-mono text-[9px] uppercase tracking-widest font-bold" style={{ color }}>
          {label}
        </p>
        <button
          type="button"
          onClick={() => { setDraft((bullets||[]).join('\n')); setEditing(!editing) }}
          className="text-[var(--muted)] hover:text-[var(--text)]"
        >
          <IoPencilOutline className="h-3 w-3" />
        </button>
      </div>
      {editing ? (
        <div className="space-y-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full min-h-[80px] rounded-none border border-[var(--border)] bg-[var(--surface)] px-2 py-2 font-mono text-xs text-[var(--text)] outline-none focus:border-[var(--signal)] resize-y"
            placeholder="One bullet per line"
          />
          <button
            type="button"
            onClick={save}
            className="text-[9px] font-mono uppercase tracking-wide text-[var(--signal)] hover:underline"
          >
            Save edits
          </button>
        </div>
      ) : (
        <ul className="space-y-1">
          {(bullets || []).map((b, i) => (
            <li key={i} className="text-xs text-[var(--muted)] leading-snug">
              — {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function bulletsFromArticle(post) {
  if (post.bothSides?.for?.length || post.bothSides?.against?.length) {
    return {
      for: post.bothSides.for || [],
      against: post.bothSides.against || [],
    }
  }
  const desc = post.submissionDescription || post.article?.lede || ''
  return {
    for: desc ? [desc] : [],
    against: ['Opposing view to be expanded upon approval.'],
  }
}

function ArticleReviewCard({ post, onApprove, onReject, onUpdateBullets, busy }) {
  const initial = bulletsFromArticle(post)
  const [forBullets, setForBullets] = useState(initial.for)
  const [againstBullets, setAgainstBullets] = useState(initial.against)

  return (
    <article className="border border-[var(--border)] border-t-2 border-t-[var(--signal)] bg-[var(--surface)] p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--signal)]">
              {post.category}
            </span>
            {post.sourceType === 'user_submission' && (
              <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--muted)]">
                User submission
              </span>
            )}
            {post.verified && <VerifiedBadge />}
            {!post.verified && (
              <span className="font-mono text-[9px] uppercase tracking-widest bg-[var(--surface-hi)] text-[var(--muted)] px-2 py-0.5">
                Pending Review
              </span>
            )}
          </div>
          <h2 className="font-heading text-lg leading-tight text-[var(--text-hi)]">{post.title}</h2>
          {post.submitterStance && (
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-[var(--muted)]">
              Submitter stance: {post.submitterStance}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BulletEditor
          bullets={forBullets}
          onChange={(v) => { setForBullets(v); onUpdateBullets(post.id, 'for', v) }}
          label="Arguments For"
          color="var(--ink-100)"
        />
        <BulletEditor
          bullets={againstBullets}
          onChange={(v) => { setAgainstBullets(v); onUpdateBullets(post.id, 'against', v) }}
          label="Arguments Against"
          color="var(--signal)"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border)]">
        <motion.button
          type="button"
          disabled={busy}
          onClick={() => onApprove(post.id, forBullets, againstBullets)}
          className="flex items-center gap-1.5 bg-[var(--signal)] px-4 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--signal-on)] signal-glow-hover disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <IoCheckmarkCircleOutline className="h-4 w-4" />
          Approve & Publish
        </motion.button>
        <motion.button
          type="button"
          disabled={busy}
          onClick={() => onReject(post.id)}
          className="flex items-center gap-1.5 border border-[var(--border)] px-4 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--muted)] hover:border-[var(--signal)]/50 hover:text-[var(--signal)] disabled:opacity-50"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <IoCloseCircleOutline className="h-4 w-4" />
          Reject
        </motion.button>
        <Link
          to={`/discussion/${post.id}`}
          className="ml-auto font-mono text-[9px] uppercase tracking-wide text-[var(--muted)] hover:text-[var(--text)] underline"
        >
          Preview ↗
        </Link>
      </div>
    </article>
  )
}

export function ManagerPage() {
  const [pinUnlocked, setPinUnlocked] = useState(false)
  const [editorKey, setEditorKey] = useState('')
  const [editorName, setEditorName] = useState('')
  const [filter, setFilter] = useState('pending')
  const [articles, setArticles] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const loadQueue = useCallback(async () => {
    if (!editorKey) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/editor/articles?filter=${filter}`, {
        headers: { Authorization: `Bearer ${editorKey}` },
      })
      if (res.status === 401) {
        localStorage.removeItem(EDITOR_KEY_STORAGE)
        setEditorKey('')
        setPinUnlocked(false)
        setError('Editor API key invalid — use Reset on the PIN screen to re-link this device.')
        return
      }
      if (!res.ok) throw new Error('fetch_failed')
      const data = await res.json()
      setArticles(data.articles || [])
      setPendingCount(data.pendingCount ?? 0)
    } catch {
      setError('Could not load review queue.')
    } finally {
      setLoading(false)
    }
  }, [editorKey, filter])

  useEffect(() => {
    if (editorKey) loadQueue()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when filter or key changes
  }, [editorKey, filter])

  const filtered = useMemo(() => articles, [articles])

  async function patchArticle(id, body) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/editor/articles/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${editorKey}`,
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('patch_failed')
      await loadQueue()
    } catch {
      setError('Action failed — try again.')
    } finally {
      setBusyId(null)
    }
  }

  function handleApprove(id, forBullets, againstBullets) {
    patchArticle(id, {
      verified: true,
      verifiedBy: editorName,
      bothSides: { for: forBullets, against: againstBullets },
    })
  }

  function handleReject(id) {
    patchArticle(id, { hidden: true })
  }

  function handleUpdateBullets(id, side, bullets) {
    setArticles((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const bothSides = { ...(p.bothSides || { for: [], against: [] }), [side]: bullets }
        return { ...p, bothSides }
      }),
    )
  }

  if (!pinUnlocked || !editorKey) {
    return (
      <PinGate
        onUnlock={(name, key) => {
          setEditorName(name)
          setEditorKey(key)
          setPinUnlocked(true)
        }}
      />
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <IoLockClosedOutline className="h-4 w-4 text-[var(--signal)]" />
          <p className="font-mono text-[9px] uppercase tracking-[.15em] text-[var(--signal)]">
            Editor Panel — {editorName}
          </p>
        </div>
        <h1 className="font-display text-4xl uppercase tracking-widest text-[var(--text-hi)]">
          Review Queue
        </h1>
        <hr className="signal mt-3" />
        <p className="mt-3 font-mono text-[10px] text-[var(--muted)] uppercase tracking-wide">
          {pendingCount} articles awaiting review
        </p>
        {error && (
          <p className="mt-2 font-mono text-[10px] text-[var(--signal)] uppercase tracking-wide">{error}</p>
        )}
      </div>

      <div className="flex gap-1 border-b border-[var(--border)] mb-6">
        {['pending','verified','all'].map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`relative px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              filter === f ? 'text-[var(--text-hi)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {f}
            {filter === f && (
              <motion.span
                layoutId="mgr-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--signal)]"
              />
            )}
          </button>
        ))}
      </div>

      {loading && (
        <p className="py-8 text-center font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
          Loading queue…
        </p>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {!loading && filtered.map(post => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ArticleReviewCard
                post={post}
                onApprove={handleApprove}
                onReject={handleReject}
                onUpdateBullets={handleUpdateBullets}
                busy={busyId === post.id}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {!loading && !filtered.length && (
          <p className="py-16 text-center font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
            No articles in this queue.
          </p>
        )}
      </div>
    </div>
  )
}
