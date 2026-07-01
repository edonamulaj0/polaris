import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AppNavbar } from '../components/AppNavbar'
import { MenuPanel } from '../components/MenuPanel'
import { MobileBottomNav } from '../components/MobileBottomNav'
import { NewDiscussionModal } from '../components/NewDiscussionModal'
import { NotificationsPanel } from '../components/NotificationsPanel'
import { TrendingPanel } from '../components/TrendingPanel'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useFeedStore } from '../stores/feedStore'
import { useNotificationStore } from '../stores/notificationStore'
import { useUserStore } from '../stores/userStore'

function mainMaxWidth(pathname) {
  if (pathname === '/explore' || pathname === '/about') return 'max-w-6xl'
  if (pathname.startsWith('/discussion/')) return 'max-w-5xl'
  return 'max-w-6xl'
}

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submitTopic = useFeedStore((s) => s.submitTopic)
  const recordPostCreated = useUserStore((s) => s.recordPostCreated)
  const googleSub = useUserStore((s) => s.googleSub)
  const googleIdToken = useUserStore((s) => s.googleIdToken)
  const syncNotifications = useNotificationStore((s) => s.syncFromServer)
  const isDesktopNav = useMediaQuery('(min-width: 768px)')
  const isExplore = location.pathname === '/explore'
  const isAbout = location.pathname === '/about'
  const showTrending = !isExplore && !isAbout

  useEffect(() => {
    void syncNotifications(googleIdToken)
    if (!googleIdToken) return undefined
    const interval = setInterval(() => {
      void syncNotifications(googleIdToken)
    }, 60_000)
    return () => clearInterval(interval)
  }, [googleIdToken, syncNotifications])

  useEffect(() => {
    if (!isDesktopNav || !menuOpen) return
    queueMicrotask(() => setMenuOpen(false))
  }, [isDesktopNav, menuOpen])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const anyOverlay = notifOpen || (menuOpen && !isDesktopNav)

  async function handleSubmitTopic(data) {
    setSubmitError('')
    if (!googleSub?.trim()) {
      setSubmitError('Sign in with Google to submit a topic.')
      return
    }
    if (!googleIdToken?.trim()) {
      setSubmitError('Session expired — sign out and sign in again.')
      return
    }

    setSubmitting(true)
    try {
      const { id } = await submitTopic(data, googleIdToken)
      const title = data.title?.trim() || 'New discussion'
      recordPostCreated({ discussionId: id, title })
      setModalOpen(false)
      navigate(`/discussion/${id}`)
    } catch (err) {
      if (err?.code === 'unauthorized') {
        setSubmitError('Sign in with Google to submit a topic.')
      } else if (err?.code === 'invalid_category') {
        setSubmitError('Choose a valid category.')
      } else if (err?.code === 'invalid_title') {
        setSubmitError('Title must be at least 5 characters.')
      } else {
        setSubmitError('Could not submit topic — try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-[var(--page)] pt-[4.25rem] lg:pt-[5rem]">
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

      <div className="flex min-w-0 flex-1 flex-col md:flex-row">
        <AnimatePresence mode="sync">
          <motion.main
            key={location.pathname}
            className={`mx-auto w-full flex-1 px-4 py-6 sm:px-6 lg:px-8 ${mainMaxWidth(location.pathname)} ${anyOverlay ? '' : 'pb-[calc(4rem+env(safe-area-inset-bottom))]'} md:pb-12`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>

        {showTrending && (
          <div className="hidden w-[240px] shrink-0 py-6 pr-4 xl:block xl:w-[260px]">
            <div className="sticky top-20">
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
        onClose={() => {
          setModalOpen(false)
          setSubmitError('')
        }}
        onSubmit={handleSubmitTopic}
        submitting={submitting}
        error={submitError}
      />
    </div>
  )
}
