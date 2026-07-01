import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import { useThemeStore } from './stores/themeStore'

useThemeStore.getState().init()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, retry: 1 },
  },
})

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
const app = (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
const root = (
  <StrictMode>
    {clientId ? <GoogleOAuthProvider clientId={clientId}>{app}</GoogleOAuthProvider> : app}
  </StrictMode>
)

createRoot(document.getElementById('root')).render(root)
