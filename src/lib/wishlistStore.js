import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}
const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined' ? window.localStorage : noopStorage
)

export const useWishlist = create(
  persist(
    (set, get) => ({
      items: [],

      add: (item) => {
        if (get().items.some((i) => i.productoId === item.productoId)) return
        set({
          items: [
            ...get().items,
            { ...item, addedAt: Date.now() },
          ],
        })
      },

      remove: (productoId) =>
        set({ items: get().items.filter((i) => i.productoId !== productoId) }),

      toggle: (item) => {
        const exists = get().items.some((i) => i.productoId === item.productoId)
        if (exists) get().remove(item.productoId)
        else get().add(item)
        return !exists
      },

      has: (productoId) => get().items.some((i) => i.productoId === productoId),

      count: () => get().items.length,

      clear: () => set({ items: [] }),
    }),
    {
      name: 'intima-wishlist-v1',
      storage: safeStorage,
      partialize: (state) => ({ items: state.items }),
      skipHydration: true,
    }
  )
)

if (typeof window !== 'undefined') {
  useWishlist.persist.rehydrate()
}
