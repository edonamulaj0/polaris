import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

function systemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'system',
      resolved: 'dark',

      init: () => {
        const { theme } = get()
        const resolved = theme === 'system' ? systemTheme() : theme
        applyTheme(resolved)
        set({ resolved })
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
          if (get().theme === 'system') {
            const r = systemTheme()
            applyTheme(r)
            set({ resolved: r })
          }
        })
      },

      setTheme: (theme) => {
        const resolved = theme === 'system' ? systemTheme() : theme
        applyTheme(resolved)
        set({ theme, resolved })
      },

      toggle: () => {
        const order = ['light', 'dark', 'system']
        const current = get().theme
        const next = order[(order.indexOf(current) + 1) % order.length]
        get().setTheme(next)
      },
    }),
    { name: 'polaris-theme-v1', partialize: (s) => ({ theme: s.theme }) }
  )
)
