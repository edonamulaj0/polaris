import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineX } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import { useScrollLock } from '../hooks/useScrollLock'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useNotificationStore } from '../stores/notificationStore'

export function NotificationsPanel({ open, onClose }) {
  const navigate = useNavigate()
  const items = useNotificationStore((s) => s.items)
  const markRead = useNotificationStore((s) => s.markRead)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  useScrollLock(open && !isDesktop)

  return (
    <AnimatePresence>
      {open && (
        <>
          {isDesktop && (
            <motion.div
              key="notif-backdrop"
              role="presentation"
              className="fixed inset-0 z-[109] bg-[var(--overlay)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={onClose}
            />
          )}
          <motion.div
            key="notif-panel"
            className={
              isDesktop
                ? 'fixed right-4 top-14 z-[110] flex max-h-[min(32rem,75vh)] w-[min(20rem,calc(100vw-15rem))] flex-col overflow-hidden rounded-none border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] lg:right-8 lg:top-16'
                : 'fixed inset-0 z-[110] flex flex-col bg-[var(--surface)]'
            }
            initial={
              isDesktop ? { opacity: 0, scale: 0.96, y: -6 } : { opacity: 0 }
            }
            animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1 }}
            exit={isDesktop ? { opacity: 0, scale: 0.96, y: -6 } : { opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
          >
            <div className="relative flex h-12 shrink-0 items-center border-b border-[var(--border)] px-3 sm:h-11">
              <h2 className="flex-1 text-center font-heading text-base font-semibold text-[var(--text)] sm:text-sm">
                Notifications
              </h2>
              <motion.button
                type="button"
                onClick={onClose}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-none text-[var(--text)] transition-colors hover:bg-[var(--surface-hi)]"
                aria-label="Close notifications"
                whileTap={{ scale: 0.95 }}
              >
                <HiOutlineX className="h-6 w-6" />
              </motion.button>
            </div>
            <div className="flex shrink-0 justify-center border-b border-[var(--border)] py-1.5">
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-xs font-semibold text-[var(--signal)] hover:underline sm:text-sm"
              >
                Mark all as read
              </button>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3">
              {items.map((n) => (
                <li key={n.id} className="mb-1.5 sm:mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      markRead(n.id)
                      onClose()
                      navigate(`/discussion/${n.discussionId}`)
                    }}
                    className="flex w-full gap-2 rounded-none border border-transparent p-3 text-left transition-colors hover:border-[var(--border)] hover:bg-[var(--surface-hi)] sm:gap-3 sm:p-4"
                  >
                    <span className="text-xl sm:text-2xl" aria-hidden>
                      {n.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--text)] sm:text-sm">{n.title}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--muted)] sm:mt-1 sm:text-xs">{n.body}</p>
                      <p className="mt-1.5 text-[9px] uppercase tracking-wide text-[var(--muted)] sm:mt-2 sm:text-[10px]">
                        {new Date(n.at).toLocaleString()}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--signal)] sm:mt-2 sm:h-2.5 sm:w-2.5" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
