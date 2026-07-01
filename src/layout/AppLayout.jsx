import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AppNavbar } from '../components/AppNavbar'
import { MenuPanel } from '../components/MenuPanel'
import { NewDiscussionModal } from '../components/NewDiscussionModal'
import { NotificationsPanel } from '../components/NotificationsPanel'
import { TrendingPanel } from '../components/TrendingPanel'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useFeedStore } from '../stores/feedStore'
import { useNotificationStore } from '../stores/notificationStore'
import { useUserStore } from '../stores/userStore'
import { PAGE_SHELL } from './pageShell'

function mainContentClass(pathname, withTrending) {
  if (withTrending) return 'min-w-0 flex-1 py-6 lg:py-8'
  if (pathname === '/explore' || pathname === '/about') return 'mx-auto w-full max-w-6xl flex-1 py-6 lg:py-8'
  if (pathname.startsWith('/discussion/')) return 'mx-auto w-full max-w-5xl flex-1 py-6 lg:py-8'
  return 'mx-auto w-full max-w-6xl flex-1 py-6 lg:py-8'
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
  const openSignInPrompt = useUserStore((s) => s.openSignInPrompt)
  const isSignedIn = useUserStore((s) => s.isSignedIn)
  const syncNotifications = useNotificationStore((s) => s.syncFromServer)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const isDesktopNav = useMediaQuery('(min-width: 1024px)')
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

  useEffect(() => {
    if (!googleSub?.trim() || !googleIdToken?.trim()) return
    void useUserStore.getState().syncBirthdayFromServer()
  }, [googleSub, googleIdToken])

  async function handleSubmitTopic(data) {
    setSubmitError('')
    if (!isSignedIn()) {
      openSignInPrompt()
      setSubmitError('Sign in with Google to submit a topic.')
      return
    }
    if (!googleSub?.trim()) {
      openSignInPrompt()
      setSubmitError('Sign in with Google to submit a topic.')
      return
    }
    if (!googleIdToken?.trim()) {
      openSignInPrompt()
      setSubmitError('Session expired — sign in again.')
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
    <div className="flex min-h-svh flex-col bg-[var(--page)] pt-14 sm:pt-[3.75rem] lg:pt-20">
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

      <div
        className={`${PAGE_SHELL} flex min-w-0 flex-1 flex-col ${
          showTrending ? 'lg:flex-row lg:gap-8 xl:gap-10' : ''
        }`}
      >
        <AnimatePresence mode="sync">
          <motion.main
            key={location.pathname}
            className={`${mainContentClass(location.pathname, showTrending)} pb-6 md:pb-12`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>

        {showTrending && (
          <aside className="hidden w-[300px] shrink-0 py-6 lg:block lg:w-[340px] xl:w-[380px]">
            <div className="sticky top-20">
              <TrendingPanel />
            </div>
          </aside>
        )}
      </div>

      <MenuPanel
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNewDiscussion={() => setModalOpen(true)}
        onOpenNotifications={() => setNotifOpen(true)}
        unread={unreadCount}
      />
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
