import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { HydrationBoundary } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { queryClient } from './lib/queryClient'

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
