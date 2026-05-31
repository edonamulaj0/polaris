import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineX } from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { ThemeToggle } from './ThemeToggle'
import { useUserStore } from '../stores/userStore'

const linkClass =
  'block rounded-none px-6 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:text-[var(--signal)]'

export function MenuPanel({ open, onClose }) {
  const googleSub = useUserStore((s) => s.googleSub)
  const signOut = useUserStore((s) => s.signOut)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  useScrollLock(open && !isDesktop)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex flex-col bg-[var(--page)] md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
        >
          <div className="relative flex h-14 shrink-0 items-center justify-center border-b border-[var(--border)] px-4">
            <span className="font-heading text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">
              Menu
            </span>
            <motion.button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-none text-[var(--text)] transition-colors hover:bg-[var(--surface-hi)]"
              aria-label="Close menu"
              whileTap={{ scale: 0.95 }}
            >
              <HiOutlineX className="h-7 w-7" />
            </motion.button>
          </div>

          <nav className="flex flex-1 flex-col px-4 py-6">
            <Link to="/about" className={linkClass} onClick={onClose}>
              About
            </Link>
            <Link to="/terms" className={linkClass} onClick={onClose}>
              Terms of Service
            </Link>
            <Link to="/privacy" className={linkClass} onClick={onClose}>
              Privacy Policy
            </Link>
          </nav>

          <div className="shrink-0 border-t border-[var(--border)] px-6 py-4">
            <div className="mb-4 flex justify-center">
              <ThemeToggle />
            </div>
            {googleSub ? (
              <button
                type="button"
                onClick={() => {
                  signOut()
                  onClose()
                }}
                className="w-full rounded-none border border-[var(--border)] py-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] transition-colors hover:border-[var(--signal)]/40 hover:text-[var(--signal)]"
              >
                Sign out of Google
              </button>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
