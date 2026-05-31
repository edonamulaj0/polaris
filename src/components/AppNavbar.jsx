import { HiMenuAlt3, HiOutlineBell } from 'react-icons/hi'
import { motion } from 'framer-motion'
import { LogoMark } from './LogoMark'
import { ThemeToggle } from './ThemeToggle'
import { useNotificationStore } from '../stores/notificationStore'

export function AppNavbar({ onOpenNotifications, onOpenMenu, onNewDiscussion }) {
  const unread = useNotificationStore((s) => s.unreadCount)

  return (
    <header className="fixed left-0 right-0 top-0 z-[60] border-b border-[var(--border)] bg-[var(--page)]/90 backdrop-blur-md md:left-[60px] xl:left-[220px]">
      <div className="mx-auto flex h-12 max-w-none items-center gap-3 px-4 sm:px-6">

        <div className="md:hidden">
          <LogoMark />
        </div>

        <span className="hidden sm:block font-mono text-[10px] text-[var(--muted)] uppercase tracking-widest ml-2">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
        </span>

        <div className="flex flex-1 items-center justify-end gap-2">
          <motion.button
            type="button"
            onClick={onNewDiscussion}
            className="signal-glow-hover inline-flex rounded-none border border-[var(--signal)] bg-[var(--signal)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[var(--signal-on)]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Submit Topic
          </motion.button>

          <ThemeToggle />

          <motion.button
            type="button"
            onClick={onOpenNotifications}
            className="relative flex h-9 w-9 items-center justify-center rounded-none text-[var(--text)] transition-colors hover:bg-[var(--surface-hi)]"
            aria-label="Notifications"
            whileTap={{ scale: 0.93 }}
          >
            <HiOutlineBell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--signal)] px-0.5 text-[9px] font-bold text-[var(--signal-on)]">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </motion.button>

          <motion.button
            type="button"
            onClick={onOpenMenu}
            className="flex h-9 w-9 items-center justify-center rounded-none text-[var(--text)] transition-colors hover:bg-[var(--surface-hi)] md:hidden"
            aria-label="Open menu"
            whileTap={{ scale: 0.93 }}
          >
            <HiMenuAlt3 className="h-6 w-6" />
          </motion.button>
        </div>
      </div>
    </header>
  )
}
