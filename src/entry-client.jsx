import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { HydrationBoundary } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { queryClient } from './lib/queryClient'

// Tras un deploy, los chunks viejos ya no existen y los import() dinámicos
// de pestañas abiertas fallan. Vite emite este evento — recargamos para
// tomar la versión nueva en vez de mostrar un error.
// Guard: máximo una recarga cada 30 s. Si el fallo persiste (ej: 404
// cacheado en el edge), dejamos que el error llegue al ErrorBoundary en
// vez de recargar en bucle infinito.
window.addEventListener('vite:preloadError', (event) => {
  console.error('Chunk falló al cargar:', event.payload)
  const KEY = 'chunk-reload-at'
  const ultima = Number(sessionStorage.getItem(KEY) || 0)
  if (Date.now() - ultima > 30_000) {
    sessionStorage.setItem(KEY, String(Date.now()))
    event.preventDefault()
    window.location.reload()
  }
})

const rootElement = document.getElementById('root')

// El SSG inyecta __INITIAL_STATE__ con el cache dehidratado de React Query.
// Si existe, hidratamos desde HTML pre-renderizado. Si no, render normal (SPA).
const dehydratedState = window.__INITIAL_STATE__

const tree = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HydrationBoundary>
    </QueryClientProvider>
  </StrictMode>
)

if (rootElement.hasChildNodes()) {
  // HTML pre-renderizado existe → hidratar
  hydrateRoot(rootElement, tree)
} else {
  // SPA puro (rutas no SSG'd como /admin/*)
  createRoot(rootElement).render(tree)
}
