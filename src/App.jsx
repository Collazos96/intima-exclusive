import { lazy, Suspense } from 'react'
import { Routes, Route, Link, Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import CartDrawer from './components/CartDrawer'
import ScrollToTop from './components/ScrollToTop'
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
const AdminSuscriptores = lazy(() => import('./pages/admin/AdminSuscriptores'))
const AdminNav = lazy(() => import('./components/AdminNav'))

function AdminFallback() {
  return <div className="min-h-screen flex items-center justify-center">Cargando…</div>
}

// Layout compartido del admin: barra de navegación sticky + contenido.
// El login queda fuera para no mostrar la barra sin sesión.
function AdminLayout() {
  return (
    <>
      <AdminNav />
      <Outlet />
    </>
  )
}

function NotFound() {
  return (
    <main id="main" className="min-h-screen flex items-center justify-center bg-cream-100 pt-[98px] px-6">
      {/* noindex: evita que Google indexe URLs erradas que responden 200 (SPA fallback) */}
      <title>Página no encontrada — Íntima Exclusive</title>
      <meta name="robots" content="noindex" />
      <div className="text-center max-w-md">
        <span className="block font-sans text-[0.68rem] tracking-[4px] uppercase text-gold-500 mb-3">Error 404</span>
        <h1 className="font-serif text-3xl text-wine-800 mb-3">Página no encontrada</h1>
        <p className="font-sans text-sm text-taupe-600 mb-8">
          La página que buscas no existe o fue movida. Explora nuestras colecciones o vuelve al inicio.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            to="/"
            className="bg-wine-600 text-cream-200 px-8 py-3 font-sans text-[0.68rem] tracking-widest uppercase hover:bg-wine-800 transition-colors">
            Volver al inicio
          </Link>
          <Link
            to="/categoria/sets"
            className="border border-gold-300 text-taupe-600 px-8 py-3 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
            Ver colección
          </Link>
        </div>
      </div>
    </main>
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
      <ScrollToTop />
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
                <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route path="" element={<AdminPanel />} />
                  <Route path="productos/nuevo" element={<AdminProductoForm />} />
                  <Route path="productos/:id/editar" element={<AdminProductoForm />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="inventario" element={<AdminInventario />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="papelera" element={<AdminPapelera />} />
                  <Route path="limpieza" element={<AdminLimpiezaR2 />} />
                  <Route path="pedidos" element={<AdminPedidos />} />
                  <Route path="cupones" element={<AdminCupones />} />
                  <Route path="suscriptores" element={<AdminSuscriptores />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
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
