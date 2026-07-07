import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60_000,     // 10 min: catálogo cambia poco y el backend valida stock al pagar
      gcTime: 30 * 60_000,        // 30 min en caché antes de GC
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})

// Claves de queries centralizadas — evita typos y facilita invalidación
export const qk = {
  categorias: ['categorias'],
  productos: ['productos'],
  producto: (id) => ['producto', id],
  productosPorCategoria: (id) => ['productos', 'categoria', id],
  adminProductos: ['admin', 'productos'],
  analytics: ['admin', 'analytics'],
  relacionados: (productoId) => ['relacionados', productoId],
  reviews: (productoId) => ['reviews', productoId],
  adminReviews: (estado) => ['admin', 'reviews', estado || 'all'],
  topProductos: ['productos', 'top'],
}
