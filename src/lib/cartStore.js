import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// SSR-safe: en el servidor no existe localStorage. Usamos un noop que devuelve
// null para que persist no crashee. La hidratación real ocurre en cliente.
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}
const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined' ? window.localStorage : noopStorage
)

// Cada línea del carrito es única por (productoId, color, talla).
const lineKey = (item) => `${item.productoId}::${item.color}::${item.talla}`

export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      addItem: (item) => {
        const key = lineKey(item)
        const existing = get().items.find((i) => lineKey(i) === key)
        if (existing) {
          set({
            items: get().items.map((i) =>
              lineKey(i) === key ? { ...i, cantidad: i.cantidad + item.cantidad } : i
            ),
          })
        } else {
          set({ items: [...get().items, item] })
        }
      },

      removeItem: (key) => set({ items: get().items.filter((i) => lineKey(i) !== key) }),

      updateCantidad: (key, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(key)
          return
        }
        set({
          items: get().items.map((i) => (lineKey(i) === key ? { ...i, cantidad } : i)),
        })
      },

      clear: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.cantidad, 0),
      totalPrecio: () => get().items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
    }),
    {
      name: 'intima-cart-v1',
      storage: safeStorage,
      partialize: (state) => ({ items: state.items }),
      // Server y primer client render arrancan vacíos; rehidratamos en el efecto del cliente
      skipHydration: true,
    }
  )
)

// Rehidratar manualmente cuando el browser ya está disponible
if (typeof window !== 'undefined') {
  useCart.persist.rehydrate()
}

export { lineKey }
