import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFeedStore } from '../stores/feedStore'
import { IoLockClosedOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoPencilOutline } from 'react-icons/io5'
import { VerifiedBadge } from '../components/VerifiedBadge'

const MANAGER_PIN_KEY = 'polaris_mgr_pin'

/** [REFACTOR S-2] SHA-256 digest — never store plaintext PIN in localStorage */
async function hashPin(pin) {
  const data = new TextEncoder().encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function PinGate({ onUnlock }) {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState(() =>
    localStorage.getItem(MANAGER_PIN_KEY) ? 'enter' : 'create'
  )
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (mode === 'create') {
      if (input.length !== 4 || !/^\d+$/.test(input)) {
        setError('PIN must be exactly 4 digits.')
        return
      }
      if (input !== confirm) {
        setError('PINs do not match.')
        return
      }
      const digest = await hashPin(input)
      localStorage.setItem(MANAGER_PIN_KEY, digest)
      onUnlock('Editor')
    } else {
      const stored = localStorage.getItem(MANAGER_PIN_KEY)
      const digest = await hashPin(input)
      if (digest === stored) {
        onUnlock('Editor')
      } else {
        setError('Incorrect PIN.')
      }
    }
  }

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
        {mode === 'create' ? 'Create a 4-digit access PIN' : 'Enter your PIN to continue'}
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0,4))}
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
            onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0,4))}
            className="w-full rounded-none border border-[var(--border)] bg-[var(--surface-hi)] px-4 py-3 font-mono text-xl tracking-[.5em] text-center text-[var(--text-hi)] outline-none focus:border-[var(--signal)]"
            placeholder="Confirm PIN"
          />
        )}
        {error && (
          <p className="font-mono text-[10px] text-[var(--signal)] uppercase tracking-wide">{error}</p>
        )}
        <motion.button
          type="submit"
          className="signal-glow-hover w-full bg-[var(--signal)] py-3 text-[11px] font-bold uppercase tracking-[.12em] text-[var(--signal-on)]"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {mode === 'create' ? 'Set PIN & Enter' : 'Unlock'}
        </motion.button>
        {mode === 'enter' && (
          <button
            type="button"
            onClick={() => { localStorage.removeItem(MANAGER_PIN_KEY); setMode('create'); setInput(''); setConfirm(''); setError('') }}
            className="w-full text-[9px] font-mono uppercase tracking-wide text-[var(--muted)] hover:text-[var(--signal)]"
          >
            Reset PIN
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

function ArticleReviewCard({ post, onApprove, onReject, onUpdateBullets }) {
  const [forBullets, setForBullets] = useState(post.bothSides?.for || [])
  const [againstBullets, setAgainstBullets] = useState(post.bothSides?.against || [])

  return (
    <article className="border border-[var(--border)] border-t-2 border-t-[var(--signal)] bg-[var(--surface)] p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--signal)]">
              {post.category}
            </span>
            <span className="font-mono text-[9px] text-[var(--muted)]">{post.subreddit}</span>
            {post.verified && <VerifiedBadge />}
            {!post.verified && (
              <span className="font-mono text-[9px] uppercase tracking-widest bg-[var(--surface-hi)] text-[var(--muted)] px-2 py-0.5">
                Pending Review
              </span>
            )}
          </div>
          <h2 className="font-heading text-lg leading-tight text-[var(--text-hi)]">{post.title}</h2>
        </div>
      </div>

      {/* Both sides editor */}
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

      {/* Common ground */}
      {post.bothSides?.common_ground && (
        <p className="border-l-2 border-[var(--signal)] pl-3 font-mono text-[10px] italic text-[var(--muted)]">
          {post.bothSides.common_ground}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border)]">
        <motion.button
          type="button"
          onClick={() => onApprove(post.id, forBullets, againstBullets)}
          className="flex items-center gap-1.5 bg-[var(--signal)] px-4 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--signal-on)] signal-glow-hover"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <IoCheckmarkCircleOutline className="h-4 w-4" />
          Approve & Publish
        </motion.button>
        <motion.button
          type="button"
          onClick={() => onReject(post.id)}
          className="flex items-center gap-1.5 border border-[var(--border)] px-4 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--muted)] hover:border-[var(--signal)]/50 hover:text-[var(--signal)]"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <IoCloseCircleOutline className="h-4 w-4" />
          Reject
        </motion.button>
        <a
          href={post.url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto font-mono text-[9px] uppercase tracking-wide text-[var(--muted)] hover:text-[var(--text)] underline"
        >
          View source ↗
        </a>
      </div>
    </article>
  )
}

export function ManagerPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [editorName, setEditorName] = useState('')
  const [filter, setFilter] = useState('pending') // 'pending' | 'verified' | 'all'

  const posts = useFeedStore((s) => s.posts)
  const updatePost = useFeedStore((s) => s.updatePost)

  const filtered = useMemo(() => {
    if (filter === 'pending') return posts.filter(p => !p.verified && !p.hidden)
    if (filter === 'verified') return posts.filter(p => p.verified && !p.hidden)
    return posts.filter(p => !p.hidden)
  }, [posts, filter])

  function handleUnlock(name) {
    setEditorName(name)
    setUnlocked(true)
  }

  function handleApprove(id, forBullets, againstBullets) {
    updatePost(id, {
      verified: true,
      verifiedBy: editorName,
      verifiedAt: Date.now(),
      bothSides: {
        ...posts.find(p => p.id === id)?.bothSides,
        for: forBullets,
        against: againstBullets,
      },
    })
  }

  function handleReject(id) {
    updatePost(id, { hidden: true })
  }

  function handleUpdateBullets(id, side, bullets) {
    const post = posts.find(p => p.id === id)
    if (!post) return
    updatePost(id, {
      bothSides: { ...post.bothSides, [side]: bullets }
    })
  }

  if (!unlocked) return <PinGate onUnlock={handleUnlock} />

  return (
    <div>
      {/* Header */}
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
          {posts.filter(p => !p.verified && !p.hidden).length} articles awaiting review
        </p>
      </div>

      {/* Filter tabs */}
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

      {/* Article list */}
      <div className="space-y-4">
        <AnimatePresence>
          {filtered.map(post => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ArticleReviewCard
                key={post.verifiedAt ?? post.id}
                post={post}
                onApprove={handleApprove}
                onReject={handleReject}
                onUpdateBullets={handleUpdateBullets}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {!filtered.length && (
          <p className="py-16 text-center font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
            No articles in this queue.
          </p>
        )}
      </div>
    </div>
  )
}
