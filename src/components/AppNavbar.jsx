import { HiMenuAlt3, HiOutlineBell } from 'react-icons/hi'
import {
  IoHomeOutline,
  IoCompassOutline,
  IoPersonOutline,
  IoInformationCircleOutline,
  IoAddOutline,
  IoLogOutOutline,
  IoLogInOutline,
} from 'react-icons/io5'
import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { LogoMark } from './LogoMark'
import { ThemeToggle } from './ThemeToggle'
import { useNotificationStore } from '../stores/notificationStore'
import { useUserStore } from '../stores/userStore'
import { PAGE_SHELL } from '../layout/pageShell'

const navItems = [
  { to: '/', end: true, label: 'Home', icon: IoHomeOutline },
  { to: '/explore', label: 'Explore', icon: IoCompassOutline },
  { to: '/profile/me', label: 'Profile', icon: IoPersonOutline },
  { to: '/about', label: 'About', icon: IoInformationCircleOutline },
]

function NavPill({ to, end, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `nav-pill inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[var(--muted)] ${
          isActive ? 'nav-pill-active !text-[var(--text-hi)]' : 'hover:text-[var(--text)]'
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
      {label}
    </NavLink>
  )
}

export function AppNavbar({ onOpenNotifications, onOpenMenu, onNewDiscussion }) {
  const unread = useNotificationStore((s) => s.unreadCount)
  const signedIn = useUserStore((s) => s.isSignedIn())
  const signOut = useUserStore((s) => s.signOut)
  const openSignInPrompt = useUserStore((s) => s.openSignInPrompt)

  const actionBtn =
    'flex h-10 w-10 items-center justify-center rounded-full bg-[var(--nav-pill-bg)] text-[var(--text)] shadow-[var(--shadow-pill)] transition-colors hover:bg-[var(--nav-pill-hover)]'

  return (
    <header
      className="fixed left-0 right-0 top-0 z-[60] bg-[var(--page)]/85 backdrop-blur-xl elevated"
      style={{ boxShadow: '0 4px 24px -8px rgba(0,0,0,.35), inset 0 -1px 0 rgba(226,232,240,.04)' }}
    >
      <div className={`${PAGE_SHELL} flex h-14 flex-nowrap items-center gap-2 lg:h-[3.75rem] lg:gap-3`}>
        <div className="min-w-0 shrink-0">
          <LogoMark />
        </div>

        <nav
          className="hidden flex-1 items-center justify-center gap-1.5 lg:flex xl:gap-2"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <NavPill key={item.to} {...item} />
          ))}
        </nav>

        {/* Desktop-only actions */}
        <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
          <motion.button
            type="button"
            onClick={() => {
              if (!signedIn) {
                openSignInPrompt()
                return
              }
              onNewDiscussion()
            }}
            className="signal-glow-hover inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-4 py-2 text-xs font-semibold text-[var(--signal-on)] shadow-[0_4px_16px_-4px_rgba(244,208,104,.45)] transition-transform"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            aria-label="Submit Topic"
          >
            <IoAddOutline className="h-4 w-4 shrink-0" aria-hidden />
            Submit Topic
          </motion.button>

          <ThemeToggle />

          <motion.button
            type="button"
            onClick={() => {
              if (!signedIn) {
                openSignInPrompt()
                return
              }
              onOpenNotifications()
            }}
            className={`relative ${actionBtn}`}
            aria-label="Notifications"
            whileTap={{ scale: 0.93 }}
          >
            <HiOutlineBell className="h-5 w-5" />
            {unread > 0 && signedIn && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--gold)] px-0.5 text-[9px] font-bold text-[var(--signal-on)]">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </motion.button>

          {signedIn ? (
            <motion.button
              type="button"
              onClick={signOut}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--nav-pill-bg)] px-3 py-2 text-[var(--text)] shadow-[var(--shadow-pill)] transition-colors hover:bg-[var(--nav-pill-hover)]"
              aria-label="Log out"
              title="Log out"
              whileTap={{ scale: 0.93 }}
            >
              <IoLogOutOutline className="h-5 w-5 shrink-0" aria-hidden />
              <span className="hidden text-xs font-medium xl:inline">Log out</span>
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={openSignInPrompt}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--nav-pill-bg)] px-3 py-2 text-[var(--text)] shadow-[var(--shadow-pill)] transition-colors hover:bg-[var(--nav-pill-hover)]"
              aria-label="Sign in"
              title="Sign in with Google"
              whileTap={{ scale: 0.93 }}
            >
              <IoLogInOutline className="h-5 w-5 shrink-0" aria-hidden />
              <span className="hidden text-xs font-medium xl:inline">Sign in</span>
            </motion.button>
          )}
        </div>

        {/* Mobile: theme + hamburger */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:hidden">
          <ThemeToggle className="!h-9 !w-9 sm:!h-10 sm:!w-10" />
          <motion.button
            type="button"
            onClick={onOpenMenu}
            className={actionBtn}
            aria-label="Open menu"
            whileTap={{ scale: 0.93 }}
          >
            <HiMenuAlt3 className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </header>
  )
}
