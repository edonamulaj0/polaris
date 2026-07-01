import { create } from 'zustand'

export const useNotificationStore = create((set, get) => ({
  items: [],
  unreadCount: 0,
  loading: false,
  lastSync: 0,

  syncFromServer: async (token) => {
    if (!token?.trim()) {
      set({ items: [], unreadCount: 0, loading: false })
      return
    }
    set({ loading: true })
    try {
      const res = await fetch('/api/users/me/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('notifications_fetch_failed')
      const data = await res.json()
      set({
        items: data.items ?? [],
        unreadCount: data.unreadCount ?? 0,
        loading: false,
        lastSync: Date.now(),
      })
    } catch {
      set({ loading: false })
    }
  },

  markRead: async (id, token) => {
    set({
      items: get().items.map((i) => (i.id === id ? { ...i, read: true } : i)),
    })
    get()._syncUnread()
    if (token?.trim()) {
      try {
        await fetch(`/api/users/me/notifications/${encodeURIComponent(id)}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        /* local optimistic update */
      }
    }
  },

  markAllRead: async (token) => {
    set({ items: get().items.map((i) => ({ ...i, read: true })) })
    get()._syncUnread()
    if (token?.trim()) {
      try {
        await fetch('/api/users/me/notifications/read-all', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        /* local optimistic update */
      }
    }
  },

  _syncUnread: () => {
    const unread = get().items.filter((i) => !i.read).length
    set({ unreadCount: unread })
  },
}))
