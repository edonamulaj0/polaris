import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineBell, HiOutlineX } from 'react-icons/hi'
import {
  IoHomeOutline,
  IoCompassOutline,
  IoPersonOutline,
  IoInformationCircleOutline,
  IoAddOutline,
  IoLogInOutline,
  IoLogOutOutline,
} from 'react-icons/io5'
import { NavLink } from 'react-router-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { LogoMark } from './LogoMark'
import { useUserStore } from '../stores/userStore'
import { PAGE_SHELL } from '../layout/pageShell'

const navItems = [
  { to: '/', end: true, label: 'Home', icon: IoHomeOutline },
  { to: '/explore', label: 'Explore', icon: IoCompassOutline },
  { to: '/profile/me', label: 'Profile', icon: IoPersonOutline },
  { to: '/about', label: 'About', icon: IoInformationCircleOutline },
]

const menuLinkClass = ({ isActive }) =>
  `nav-pill flex w-full max-w-xs items-center justify-center gap-3 px-6 py-3.5 text-sm font-medium ${
    isActive ? 'nav-pill-active text-[var(--text-hi)]' : 'text-[var(--muted)]'
  }`

export function MenuPanel({ open, onClose, onNewDiscussion, onOpenNotifications, unread = 0 }) {
  const signedIn = useUserStore((s) =>
    Boolean(s.googleSub?.trim() && s.googleIdToken?.trim()),
  )
  const signOut = useUserStore((s) => s.signOut)
  const openSignInPrompt = useUserStore((s) => s.openSignInPrompt)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  useScrollLock(open && !isDesktop)

  function handleSubmitTopic() {
    onClose()
    if (!signedIn) {
      openSignInPrompt()
      return
    }
    onNewDiscussion()
  }

  function handleNotifications() {
    onClose()
    if (!signedIn) {
      openSignInPrompt()
      return
    }
    onOpenNotifications()
  }

  function handleSignInOut() {
    onClose()
    if (signedIn) signOut()
    else openSignInPrompt()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex flex-col bg-[var(--page)] lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
        >
          <div className={`${PAGE_SHELL} flex shrink-0 items-center justify-between py-4`}>
            <LogoMark />
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

          <nav
            className="flex flex-1 flex-col items-center justify-evenly px-6 py-6"
            aria-label="Main navigation"
          >
            {navItems.map(({ to, end, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onClose}
                className={menuLinkClass}
              >
                <Icon className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
                {label}
              </NavLink>
            ))}

            <button
              type="button"
              onClick={handleSubmitTopic}
              className="nav-pill flex w-full max-w-xs items-center justify-center gap-3 px-6 py-3.5 text-sm font-medium text-[var(--muted)]"
            >
              <IoAddOutline className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
              Submit Topic
            </button>

            <button
              type="button"
              onClick={handleNotifications}
              className="nav-pill relative flex w-full max-w-xs items-center justify-center gap-3 px-6 py-3.5 text-sm font-medium text-[var(--muted)]"
            >
              <HiOutlineBell className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
              Notifications
              {unread > 0 && signedIn && (
                <span className="ml-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[10px] font-bold text-[var(--signal-on)]">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleSignInOut}
              className="nav-pill flex w-full max-w-xs items-center justify-center gap-3 px-6 py-3.5 text-sm font-medium text-[var(--muted)]"
            >
              {signedIn ? (
                <>
                  <IoLogOutOutline className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
                  Log out
                </>
              ) : (
                <>
                  <IoLogInOutline className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
                  Sign in
                </>
              )}
            </button>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
