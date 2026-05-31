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

export function NewDiscussionModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Politics')
  const [stance, setStance] = useState('Neutral')
  const [description, setDescription] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      category,
      stance,
      description: description.trim(),
    })
    setTitle('')
    setCategory('Politics')
    setStance('Neutral')
    setDescription('')
    onClose()
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
            className="relative z-10 w-full max-w-lg max-h-[90svh] overflow-y-auto rounded-none border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]"
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
                className="rounded-none p-1 text-[var(--muted)] transition-colors hover:bg-[var(--surface-hi)] hover:text-[var(--text)]"
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
                  className="w-full rounded-none border border-[var(--border)] bg-[var(--surface-hi)] px-3 py-2.5 text-[var(--text)] outline-none ring-0 transition-colors focus:border-[var(--signal)]/50"
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
                  className="w-full rounded-none border border-[var(--border)] bg-[var(--surface-hi)] px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--signal)]/50"
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
                      className={`rounded-none px-4 py-2 text-sm font-semibold ring-1 transition-colors ${
                        stance === s
                          ? 'bg-[var(--signal)] text-[var(--signal-on)] ring-[var(--signal)]'
                          : 'bg-[var(--surface-hi)] text-[var(--muted)] ring-[var(--border)] hover:text-[var(--text)]'
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
                  className="w-full resize-y rounded-none border border-[var(--border)] bg-[var(--surface-hi)] px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--signal)]/50"
                  placeholder="Context, definitions, and what you hope to learn."
                />
              </div>
              <p className="rounded-none border border-[var(--border)] bg-[var(--surface-hi)] px-3 py-2.5 text-sm italic text-[var(--muted)]">
                Keep it factual. Disagree with ideas, not people.
              </p>
              <motion.button
                type="submit"
                className="signal-glow-hover w-full rounded-none bg-[var(--signal)] py-3 text-sm font-bold uppercase tracking-wide text-[var(--signal-on)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Publish topic
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
