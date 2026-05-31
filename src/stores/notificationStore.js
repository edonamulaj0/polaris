import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const seed = () => [
  {
    id: 'n1',
    type: 'reply',
    read: false,
    title: 'Someone replied to your comment on Should AI be regulated…',
    body: 'Mock notification — client-side only.',
    discussionId: 'mock-1',
    commentId: null,
    at: Date.now() - 600000,
    icon: '💬',
  },
  {
    id: 'n2',
    type: 'trending',
    read: false,
    title: 'A discussion you joined is trending',
    body: 'Open the thread to see new top comments.',
    discussionId: 'mock-3',
    at: Date.now() - 3600000,
    icon: '🔥',
  },
  {
    id: 'n3',
    type: 'update',
    read: true,
    title: 'Both sides updated',
    body: 'Summaries were refreshed from new comments (simulated).',
    discussionId: 'mock-2',
    at: Date.now() - 86400000,
    icon: '⚡',
  },
]

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      items: [],
      initialized: false,

      init: () => {
        const { items, initialized } = get()
        if (initialized && items.length) {
          get()._syncUnread()
          return
        }
        if (!items.length) set({ items: seed() })
        set({ initialized: true })
        get()._syncUnread()
      },

      _syncUnread: () => {
        const unread = get().items.filter((i) => !i.read).length
        set({ unreadCount: unread })
      },

      unreadCount: 0,

      push: (item) => {
        set({ items: [{ ...item, id: `n-${Date.now()}`, read: false }, ...get().items] })
        get()._syncUnread()
      },

      markRead: (id) => {
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, read: true } : i)),
        })
        get()._syncUnread()
      },

      markAllRead: () => {
        set({ items: get().items.map((i) => ({ ...i, read: true })) })
        get()._syncUnread()
      },
    }),
    {
      name: 'polaris-notify-v1',
      partialize: (s) => ({ items: s.items, initialized: s.initialized }),
    },
  ),
)
