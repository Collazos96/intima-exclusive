import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Categoria from './pages/Categoria'
import Producto from './pages/Producto'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/categoria/:id" element={<Categoria />} />
        <Route path="/producto/:id" element={<Producto />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App