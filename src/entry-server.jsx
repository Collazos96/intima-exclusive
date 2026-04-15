import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { QueryClient, QueryClientProvider, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import App from './App.jsx'

/**
 * Renderiza una ruta a HTML estático.
 *
 * @param {string} url - URL absoluta o path (ej. '/categoria/sets')
 * @param {object} prefetched - data ya fetcheada para hidratar React Query
 *   ej: { categorias: [...], productos: [...], producto: {...}, reviews: {...} }
 * @returns {{ html: string, dehydratedState: any }}
 */
export function render(url, prefetched = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
  })

  // Hidratar el cache con la data ya fetcheada
  if (prefetched.categorias) {
    queryClient.setQueryData(['categorias'], prefetched.categorias)
  }
  if (prefetched.productos) {
    queryClient.setQueryData(['productos'], prefetched.productos)
  }
  if (prefetched.productosPorCategoria) {
    for (const [catId, prods] of Object.entries(prefetched.productosPorCategoria)) {
      queryClient.setQueryData(['productos', 'categoria', catId], prods)
    }
  }
  if (prefetched.producto) {
    queryClient.setQueryData(['producto', prefetched.producto.id], prefetched.producto)
  }
  if (prefetched.reviewsByProducto) {
    for (const [prodId, reviews] of Object.entries(prefetched.reviewsByProducto)) {
      queryClient.setQueryData(['reviews', prodId], reviews)
    }
  }
  if (prefetched.relacionadosByProducto) {
    for (const [prodId, rel] of Object.entries(prefetched.relacionadosByProducto)) {
      queryClient.setQueryData(['relacionados', prodId], rel)
    }
  }

  const html = renderToString(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </HydrationBoundary>
      </QueryClientProvider>
    </StrictMode>
  )

  const dehydratedState = dehydrate(queryClient)
  return { html, dehydratedState }
}
