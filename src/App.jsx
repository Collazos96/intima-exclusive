import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import CartDrawer from './components/CartDrawer'
import Home from './pages/Home'
import Categoria from './pages/Categoria'
import Producto from './pages/Producto'
import GuiaTallas from './pages/GuiaTallas'
import { queryClient } from './lib/queryClient'

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'))
const AdminProductoForm = lazy(() => import('./pages/admin/AdminProductoForm'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminInventario = lazy(() => import('./pages/admin/AdminInventario'))

function AdminFallback() {
  return <div className="min-h-screen flex items-center justify-center">Cargando…</div>
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Página no encontrada.</p>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{ style: { fontFamily: 'inherit' } }}
          />
          <Routes>
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <Routes>
                    <Route path="login" element={<AdminLogin />} />
                    <Route path="" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                    <Route path="productos/nuevo" element={<ProtectedRoute><AdminProductoForm /></ProtectedRoute>} />
                    <Route path="productos/:id/editar" element={<ProtectedRoute><AdminProductoForm /></ProtectedRoute>} />
                    <Route path="analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
                    <Route path="inventario" element={<ProtectedRoute><AdminInventario /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              }
            />
            <Route
              path="/*"
              element={
                <>
                  <a href="#main" className="skip-link">Saltar al contenido principal</a>
                  <Navbar />
                  <CartDrawer />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/categoria/:id" element={<Categoria />} />
                    <Route path="/producto/:id" element={<Producto />} />
                    <Route path="/guia-tallas" element={<GuiaTallas />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <Footer />
                </>
              }
            />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
