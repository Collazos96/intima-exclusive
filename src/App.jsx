import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Categoria from './pages/Categoria'
import Producto from './pages/Producto'
import GuiaTallas from './pages/GuiaTallas'
import AdminLogin from './pages/admin/AdminLogin'
import AdminPanel from './pages/admin/AdminPanel'
import AdminProductoForm from './pages/admin/AdminProductoForm'
import AdminAnalytics from './pages/admin/AdminAnalytics'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/productos/nuevo" element={<AdminProductoForm />} />
        <Route path="/admin/productos/:id/editar" element={<AdminProductoForm />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />  
        <Route path="/*" element={
          <>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/categoria/:id" element={<Categoria />} />
              <Route path="/producto/:id" element={<Producto />} />
              <Route path="/guia-tallas" element={<GuiaTallas />} />
            </Routes>
            <Footer />
          </>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App