import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { FeedBootstrap } from './components/FeedBootstrap'
import { AuthGate } from './components/AuthGate'
import { ErrorBoundary } from './components/ErrorBoundary'
import { HomePage } from './pages/HomePage'
import { DiscussionPage } from './pages/DiscussionPage'
import { ExplorePage } from './pages/ExplorePage'
import { ProfilePage } from './pages/ProfilePage'
import { AboutPage } from './pages/AboutPage'
import { TermsPage } from './pages/TermsPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { ManagerPage } from './pages/ManagerPage'

export default function App() {
  return (
    <BrowserRouter>
      <FeedBootstrap />
      <AuthGate />
      {/* [REFACTOR U-3] Top-level boundary — prevents full-app white screen on render errors */}
      <ErrorBoundary>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="explore" element={<ExplorePage />} />
            <Route path="discussion/:id" element={<DiscussionPage />} />
            <Route path="profile/:username" element={<ProfilePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="manager" element={<ManagerPage />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
