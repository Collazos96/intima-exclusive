import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getAdminProductos, eliminarProducto, logout, isAuthenticated } from '../../hooks/useAdmin'

export default function AdminPanel() {
  const nav = useNavigate()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eliminando, setEliminando] = useState(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      nav('/admin/login')
      return
    }
    cargarProductos()
  }, [])

  async function cargarProductos() {
    setLoading(true)
    setError('')
    try {
      const data = await getAdminProductos()
      setProductos(data)
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los productos.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEliminar(id, nombre) {
    if (!confirm(`Confirma que deseas eliminar el producto: ${nombre}`)) return
    setEliminando(id)
    try {
      await eliminarProducto(id)
      toast.success(`"${nombre}" eliminado`)
      await cargarProductos()
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar el producto')
    } finally {
      setEliminando(null)
    }
  }

  async function handleLogout() {
    await logout()
    nav('/admin/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100">
      <p className="font-serif italic text-gold-500">Cargando productos...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-cream-100 pt-[70px]">
      <div className="max-w-6xl mx-auto px-8 py-10">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl text-wine-800">Panel de administracion</h1>
            <p className="font-sans text-[0.75rem] text-taupe-600 tracking-wide mt-1">Gestion de productos - Intima Exclusive</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => nav('/admin/productos/nuevo')}
              className="bg-wine-600 text-cream-200 px-6 py-2.5 font-sans text-[0.68rem] tracking-widest uppercase hover:bg-wine-800 transition-colors">
              Nuevo producto
            </button>
            <button
              onClick={handleLogout}
              className="border border-gold-300 text-taupe-600 px-6 py-2.5 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
              Cerrar sesion
            </button>
            <button
                onClick={() => nav('/admin/analytics')}
                className="border border-gold-300 text-taupe-600 px-6 py-2.5 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
                Analytics
            </button>
            <button
                onClick={() => nav('/admin/inventario')}
                className="border border-gold-300 text-taupe-600 px-6 py-2.5 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
                Inventario
            </button>
            <button
                onClick={() => nav('/admin/reviews')}
                className="border border-gold-300 text-taupe-600 px-6 py-2.5 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
                Reseñas
            </button>
            <button
                onClick={() => nav('/admin/papelera')}
                className="border border-gold-300 text-taupe-600 px-6 py-2.5 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
                Papelera
            </button>
            <button
                onClick={() => nav('/admin/limpieza')}
                className="border border-gold-300 text-taupe-600 px-6 py-2.5 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
                Limpieza R2
            </button>
            <button
                onClick={() => nav('/admin/pedidos')}
                className="bg-wine-600 text-cream-200 px-6 py-2.5 font-sans text-[0.68rem] tracking-widest uppercase hover:bg-wine-800 transition-colors">
                Pedidos
            </button>
            <button
                onClick={() => nav('/admin/cupones')}
                className="border border-gold-300 text-taupe-600 px-6 py-2.5 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
                Cupones
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 font-sans text-sm px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            ['Total productos', productos.length],
            ['Sets', productos.filter(p => p.categoria_id === 'sets').length],
            ['Corsets', productos.filter(p => p.categoria_id === 'corsets').length],
            ['Nuevos', productos.filter(p => p.nuevo === 1).length],
          ].map(([label, valor]) => (
            <div key={label} className="bg-white border border-gold-300 p-5">
              <p className="font-sans text-[0.62rem] tracking-widest uppercase text-taupe-400 mb-1">{label}</p>
              <p className="font-serif text-3xl text-wine-600">{valor}</p>
            </div>
          ))}
        </div>

        {/* TABLA DE PRODUCTOS */}
        <div className="bg-white border border-gold-300">
          <div className="px-6 py-4 border-b border-gold-300">
            <h2 className="font-sans text-[0.72rem] tracking-widest uppercase text-taupe-600">Productos registrados</h2>
          </div>
          {productos.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-sans text-[0.85rem] text-taupe-400 italic">No hay productos registrados.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold-300">
                  {['Imagen', 'Nombre', 'Categoria', 'Precio', 'Nuevo', 'Colores', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-sans text-[0.62rem] tracking-widest uppercase text-taupe-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productos.map(p => (
                  <tr key={p.id} className="border-b border-cream-200 hover:bg-cream-100 transition-colors">
                    <td className="px-4 py-3">
                      {p.imagenes && p.imagenes.length > 0 ? (
                        <img src={p.imagenes[0].url} alt={p.nombre} className="w-14 h-14 object-cover border border-gold-300"/>
                      ) : (
                        <div className="w-14 h-14 bg-cream-200 border border-gold-300 flex items-center justify-center">
                          <span className="font-sans text-[0.6rem] text-taupe-400">Sin imagen</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-serif text-wine-900 text-sm">{p.nombre}</p>
                      <p className="font-sans text-[0.62rem] text-taupe-400 mt-0.5">{p.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600">{p.categoria_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-sans text-sm font-bold text-wine-600">
                        ${p.precio.toLocaleString('es-CO')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-sans text-[0.62rem] tracking-widest uppercase px-2 py-1 ${p.nuevo === 1 ? 'bg-wine-600 text-cream-200' : 'bg-cream-200 text-taupe-400'}`}>
                        {p.nuevo === 1 ? 'Si' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-sans text-[0.75rem] text-taupe-600">
                        {p.colores ? p.colores.length : 0} colores
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => nav(`/admin/productos/${p.id}/editar`)}
                          className="border border-gold-300 text-taupe-600 px-3 py-1.5 font-sans text-[0.6rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(p.id, p.nombre)}
                          disabled={eliminando === p.id}
                          className="border border-red-200 text-red-500 px-3 py-1.5 font-sans text-[0.6rem] tracking-widest uppercase hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          {eliminando === p.id ? 'Eliminando…' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}