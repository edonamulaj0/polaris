import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { CATEGORIES } from '../data/categories'

const stanceOptions = ['For', 'Against', 'Neutral']

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modal = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 28 },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
}

export function NewDiscussionModal({ open, onClose, onSubmit, submitting = false, error = '' }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0]) // [CAT-1]
  const [stance, setStance] = useState('Neutral')
  const [description, setDescription] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || submitting) return
    onSubmit({
      title: title.trim(),
      category,
      stance,
      description: description.trim(),
    })
    setTitle('')
    setCategory(CATEGORIES[0]) // [CAT-1]
    setStance('Neutral')
    setDescription('')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-md"
            variants={backdrop}
            initial="hidden"
            animate="visible"
            exit="hidden"
            aria-label="Close modal backdrop"
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-lg max-h-[90svh] overflow-y-auto rounded-3xl bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]"
            variants={modal}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-discussion-title"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2
                id="new-discussion-title"
                className="font-heading text-2xl font-semibold text-[var(--text)]"
              >
                Submit Topic
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-hi)] hover:text-[var(--text)]"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">
                  Topic title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl bg-[var(--surface-hi)] px-4 py-2.5 text-[var(--text)] shadow-[var(--shadow-pill)] outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(244,208,104,.25)]"
                  placeholder="Frame the disagreement clearly"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-2xl bg-[var(--surface-hi)] px-4 py-2.5 text-[var(--text)] shadow-[var(--shadow-pill)] outline-none focus:shadow-[0_0_0_3px_rgba(244,208,104,.25)]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="mb-2 block text-sm font-medium text-[var(--muted)]">
                  Your stance
                </span>
                <div className="flex flex-wrap gap-2">
                  {stanceOptions.map((s) => (
                    <motion.button
                      key={s}
                      type="button"
                      onClick={() => setStance(s)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold shadow-[var(--shadow-pill)] transition-colors ${
                        stance === s
                          ? 'bg-[var(--gold)] text-[var(--signal-on)]'
                          : 'bg-[var(--surface-hi)] text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full resize-y rounded-2xl bg-[var(--surface-hi)] px-4 py-2.5 text-[var(--text)] shadow-[var(--shadow-pill)] outline-none focus:shadow-[0_0_0_3px_rgba(244,208,104,.25)]"
                  placeholder="Context, definitions, and what you hope to learn."
                />
              </div>
              <p className="rounded-2xl bg-[var(--surface-hi)] px-4 py-3 text-sm italic text-[var(--muted)] shadow-[var(--shadow-pill)]">
                Topics are reviewed by editors before appearing in the public feed.
              </p>
              {error && (
                <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--signal)]" role="alert">
                  {error}
                </p>
              )}
              <motion.button
                type="submit"
                disabled={submitting}
                className="signal-glow-hover w-full rounded-full bg-[var(--gold)] py-3 text-sm font-semibold text-[var(--signal-on)] shadow-[0_4px_16px_-4px_rgba(244,208,104,.45)] disabled:cursor-not-allowed disabled:opacity-50"
                whileHover={{ scale: submitting ? 1 : 1.02 }}
                whileTap={{ scale: submitting ? 1 : 0.98 }}
              >
                {submitting ? 'Submitting…' : 'Submit for review'}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
