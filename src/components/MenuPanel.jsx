import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineX } from 'react-icons/hi'
import {
  IoHomeOutline,
  IoCompassOutline,
  IoPersonOutline,
  IoInformationCircleOutline,
} from 'react-icons/io5'
import { Link, NavLink } from 'react-router-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { ThemeToggle } from './ThemeToggle'
import { LogoMark } from './LogoMark'
import { useUserStore } from '../stores/userStore'

const navItems = [
  { to: '/', end: true, label: 'Home', icon: IoHomeOutline },
  { to: '/explore', label: 'Explore', icon: IoCompassOutline },
  { to: '/profile/me', label: 'Profile', icon: IoPersonOutline },
  { to: '/about', label: 'About', icon: IoInformationCircleOutline },
]

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
          <div className="relative flex shrink-0 items-center justify-between px-4 py-4">
            <LogoMark compact showTagline={false} />
            <motion.button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--nav-pill-bg)] text-[var(--text)] shadow-[var(--shadow-pill)] transition-colors hover:bg-[var(--nav-pill-hover)]"
              aria-label="Close menu"
              whileTap={{ scale: 0.95 }}
            >
              <HiOutlineX className="h-6 w-6" />
            </motion.button>
          </div>

          <nav className="flex flex-1 flex-col gap-1.5 px-4 py-4">
            {navItems.map(({ to, end, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onClose}
                className={({ isActive }) =>
                  `nav-pill flex items-center gap-3 px-4 py-3 text-sm font-medium ${
                    isActive ? 'nav-pill-active text-[var(--text-hi)]' : 'text-[var(--muted)]'
                  }`
                }
              >
                <Icon className="h-5 w-5 opacity-70" aria-hidden />
                {label}
              </NavLink>
            ))}
            <Link
              to="/terms"
              onClick={onClose}
              className="nav-pill px-4 py-3 text-sm font-medium text-[var(--muted)]"
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              onClick={onClose}
              className="nav-pill px-4 py-3 text-sm font-medium text-[var(--muted)]"
            >
              Privacy Policy
            </Link>
          </nav>

          <div className="shrink-0 px-6 py-4">
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
                className="w-full rounded-full bg-[var(--nav-pill-bg)] py-3 text-xs font-semibold text-[var(--muted)] shadow-[var(--shadow-pill)] transition-colors hover:bg-[var(--nav-pill-hover)] hover:text-[var(--text)]"
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
