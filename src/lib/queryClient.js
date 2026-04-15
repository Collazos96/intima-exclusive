import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,          // 1 min: datos frescos
      gcTime: 5 * 60_000,         // 5 min en caché antes de GC
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
  reviews: (productoId) => ['reviews', productoId],
  adminReviews: (estado) => ['admin', 'reviews', estado || 'all'],
}
