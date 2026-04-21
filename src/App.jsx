import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
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
import Favoritos from './pages/Favoritos'
import Politica from './pages/Politica'
import Faq from './pages/Faq'
import Nosotros from './pages/Nosotros'
import Checkout from './pages/Checkout'
import PedidoEstado from './pages/PedidoEstado'

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'))
const AdminProductoForm = lazy(() => import('./pages/admin/AdminProductoForm'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminInventario = lazy(() => import('./pages/admin/AdminInventario'))
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'))
const AdminPapelera = lazy(() => import('./pages/admin/AdminPapelera'))
const AdminLimpiezaR2 = lazy(() => import('./pages/admin/AdminLimpiezaR2'))
const AdminPedidos = lazy(() => import('./pages/admin/AdminPedidos'))
const AdminCupones = lazy(() => import('./pages/admin/AdminCupones'))

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

/**
 * App ya NO incluye BrowserRouter ni QueryClientProvider:
 * - El cliente los provee desde entry-client.jsx (BrowserRouter + hidratación QC)
 * - El servidor los provee desde entry-server.jsx (StaticRouter + dehydrate)
 */
export default function App() {
  return (
    <ErrorBoundary>
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
                <Route path="reviews" element={<ProtectedRoute><AdminReviews /></ProtectedRoute>} />
                <Route path="papelera" element={<ProtectedRoute><AdminPapelera /></ProtectedRoute>} />
                <Route path="limpieza" element={<ProtectedRoute><AdminLimpiezaR2 /></ProtectedRoute>} />
                <Route path="pedidos" element={<ProtectedRoute><AdminPedidos /></ProtectedRoute>} />
                <Route path="cupones" element={<ProtectedRoute><AdminCupones /></ProtectedRoute>} />
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
                <Route path="/favoritos" element={<Favoritos />} />
                <Route path="/politica" element={<Politica />} />
                <Route path="/faq" element={<Faq />} />
                <Route path="/nosotros" element={<Nosotros />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/pedido/:reference" element={<PedidoEstado />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Footer />
            </>
          }
        />
      </Routes>
    </ErrorBoundary>
  )
}
