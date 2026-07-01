import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',
      resolved: 'dark',

      init: () => {
        let { theme } = get()
        if (theme === 'system') theme = 'dark'
        applyTheme(theme)
        set({ theme, resolved: theme })
      },

      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme, resolved: theme })
      },

      toggle: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        get().setTheme(next)
      },
    }),
    {
      name: 'polaris-theme-v1',
      partialize: (s) => ({ theme: s.theme === 'system' ? 'dark' : s.theme }),
    },
  ),
)
