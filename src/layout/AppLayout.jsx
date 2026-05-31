import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AppNavbar } from '../components/AppNavbar'
import { DesktopSidebar } from '../components/DesktopSidebar'
import { MenuPanel } from '../components/MenuPanel'
import { MobileBottomNav } from '../components/MobileBottomNav'
import { NewDiscussionModal } from '../components/NewDiscussionModal'
import { NotificationsPanel } from '../components/NotificationsPanel'
import { TrendingPanel } from '../components/TrendingPanel'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useFeedStore } from '../stores/feedStore'
import { useNotificationStore } from '../stores/notificationStore'
import { useUserStore } from '../stores/userStore'

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const prependLocalDiscussion = useFeedStore((s) => s.prependLocalDiscussion)
  const recordPostCreated = useUserStore((s) => s.recordPostCreated)
  const initNotifications = useNotificationStore((s) => s.init)
  const isDesktopNav = useMediaQuery('(min-width: 768px)')

  useEffect(() => {
    initNotifications()
  }, [initNotifications])

  useEffect(() => {
    if (!isDesktopNav || !menuOpen) return
    queueMicrotask(() => setMenuOpen(false))
  }, [isDesktopNav, menuOpen])

  const anyOverlay = notifOpen || (menuOpen && !isDesktopNav)

  const isExplore = location.pathname === '/explore'

  return (
    <div className="flex min-h-svh flex-col bg-[var(--page)] pt-12">
      <DesktopSidebar onNewDiscussion={() => setModalOpen(true)} />
      <AppNavbar
        onOpenNotifications={() => {
          setMenuOpen(false)
          setNotifOpen(true)
        }}
        onOpenMenu={() => {
          setNotifOpen(false)
          setMenuOpen(true)
        }}
        onNewDiscussion={() => setModalOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col md:flex-row md:pl-[60px] xl:pl-[220px]">
        <AnimatePresence mode="sync">
          <motion.main
            key={location.pathname}
            className={`mx-auto w-full flex-1 px-4 py-6 sm:px-6 lg:px-10 ${isExplore ? 'max-w-6xl' : 'max-w-3xl'} ${anyOverlay ? '' : 'pb-[calc(4rem+env(safe-area-inset-bottom))]'} md:pb-12`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>

        {!isExplore && (
          <div className="hidden w-[260px] shrink-0 py-6 pr-4 lg:block xl:w-[280px]">
            <div className="sticky top-16">
              <TrendingPanel />
            </div>
          </div>
        )}
      </div>

      <MobileBottomNav />

      <MenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      <NewDiscussionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          const newId = prependLocalDiscussion(data)
          const title = data.title?.trim() || 'New discussion'
          recordPostCreated({ discussionId: newId, title })
          setModalOpen(false)
          navigate(`/discussion/${newId}`)
        }}
      />
    </div>
  )
}
