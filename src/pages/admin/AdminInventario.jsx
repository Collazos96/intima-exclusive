import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getAdminProductos, actualizarStock, isAuthenticated } from '../../hooks/useAdmin'

/**
 * Inventario: stock por color y talla con buscador, filtro por categoría
 * y vista rápida de tallas agotadas.
 */
export default function AdminInventario() {
  const nav = useNavigate()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState({})
  const [exito, setExito] = useState({})
  const [busqueda, setBusqueda] = useState('')
  const [catFiltro, setCatFiltro] = useState('')
  const [soloAgotados, setSoloAgotados] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      nav('/admin/login')
      return
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function cargar() {
    setLoading(true)
    try {
      const data = await getAdminProductos()
      setProductos(data)
    } catch (err) {
      toast.error(err.message || 'No se pudo cargar el inventario')
    } finally {
      setLoading(false)
    }
  }

  async function handleStockChange(colorId, talla, valor) {
    const stock = parseInt(valor)
    if (isNaN(stock) || stock < 0) return

    const key = `${colorId}-${talla}`
    setGuardando(g => ({ ...g, [key]: true }))

    try {
      await actualizarStock(colorId, talla, stock)
      setExito(e => ({ ...e, [key]: true }))
      setTimeout(() => setExito(e => ({ ...e, [key]: false })), 2000)
      setProductos(prev => prev.map(p => ({
        ...p,
        colores: p.colores.map(c => ({
          ...c,
          tallas: c.id === colorId
            ? c.tallas.map(t => t.talla === talla ? { ...t, stock } : t)
            : c.tallas
        }))
      })))
    } catch (err) {
      toast.error(err.message || 'No se pudo actualizar el stock')
    } finally {
      setGuardando(g => ({ ...g, [key]: false }))
    }
  }

  const categoriasDisponibles = useMemo(
    () => Array.from(new Set(productos.map((p) => p.categoria_id))).sort(),
    [productos]
  )

  const filtrados = useMemo(() => {
    let out = productos
    const q = busqueda.trim().toLowerCase()
    if (q) out = out.filter((p) => p.nombre.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
    if (catFiltro) out = out.filter((p) => p.categoria_id === catFiltro)
    if (soloAgotados) {
      out = out.filter((p) => p.colores.some((c) => c.tallas.some((t) => t.stock === 0)))
    }
    return out
  }, [productos, busqueda, catFiltro, soloAgotados])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100">
      <p className="font-serif italic text-gold-500">Cargando inventario...</p>
    </div>
  )

  return (
    <main data-page="inventario-v2" className="min-h-screen bg-cream-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">

        <div className="mb-6">
          <h1 className="font-serif text-2xl text-wine-800">Inventario</h1>
          <p className="font-sans text-[0.75rem] text-taupe-600 tracking-wide mt-1">
            Gestion de stock por color y talla
          </p>
        </div>

        {/* FILTROS */}
        <div className="bg-white border border-gold-300 px-4 sm:px-6 py-4 mb-6 flex items-center gap-3 flex-wrap">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o ID…"
            className="border border-gold-300 px-3 py-2 font-sans text-[0.78rem] text-wine-900 outline-none focus:border-wine-600 w-full sm:w-64"
          />
          <select
            value={catFiltro}
            onChange={(e) => setCatFiltro(e.target.value)}
            className="border border-gold-300 px-3 py-2 font-sans text-[0.78rem] text-wine-900 outline-none focus:border-wine-600 bg-white capitalize">
            <option value="">Todas las categorías</option>
            {categoriasDisponibles.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 font-sans text-[0.72rem] text-taupe-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={soloAgotados}
              onChange={(e) => setSoloAgotados(e.target.checked)}
              className="w-4 h-4 accent-wine-600"
            />
            Solo con tallas agotadas
          </label>
          <span className="ml-auto font-sans text-[0.68rem] text-taupe-400">
            {filtrados.length} de {productos.length} productos
          </span>
        </div>

        {filtrados.length === 0 && (
          <div className="bg-white border border-gold-300 px-6 py-12 text-center">
            <p className="font-sans text-[0.85rem] text-taupe-400 italic">Ningún producto coincide con los filtros.</p>
          </div>
        )}

        <div className="space-y-6">
          {filtrados.map(p => (
            <div key={p.id} className="bg-white border border-gold-300">
              <div className="px-6 py-4 border-b border-gold-300 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-wine-900 text-lg">{p.nombre}</h2>
                  <p className="font-sans text-[0.62rem] tracking-widest uppercase text-taupe-400 mt-0.5">{p.categoria_id}</p>
                </div>
                <span className="font-sans text-sm font-bold text-wine-600">
                  ${p.precio.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="p-6">
                {p.colores.map(color => (
                  <div key={color.id} className="mb-6 last:mb-0">
                    <p className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-600 mb-3">
                      {color.nombre}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                      {color.tallas.map(t => {
                        const key = `${color.id}-${t.talla}`
                        const stockBajo = t.stock <= 3
                        const agotado = t.stock === 0
                        return (
                          <div key={t.talla} className={`border p-3 ${agotado ? 'border-red-200 bg-red-50' : stockBajo ? 'border-amber-200 bg-amber-50' : 'border-gold-300'}`}>
                            <p className="font-sans text-[0.65rem] tracking-widest uppercase text-center mb-2 text-taupe-600">
                              {t.talla}
                            </p>
                            <input
                              type="number"
                              min="0"
                              value={t.stock}
                              onChange={e => handleStockChange(color.id, t.talla, e.target.value)}
                              className={`w-full text-center border px-2 py-1.5 font-sans text-sm outline-none focus:border-wine-600 ${agotado ? 'border-red-200 text-red-600' : stockBajo ? 'border-amber-200 text-amber-600' : 'border-gold-300 text-wine-900'}`}
                            />
                            <p className="font-sans text-[0.55rem] text-center mt-1">
                              {guardando[key] ? (
                                <span className="text-taupe-600">Guardando...</span>
                              ) : exito[key] ? (
                                <span className="text-green-600">Guardado</span>
                              ) : agotado ? (
                                <span className="text-red-500">Agotado</span>
                              ) : stockBajo ? (
                                <span className="text-amber-500">Stock bajo</span>
                              ) : (
                                <span className="text-taupe-400">Unidades</span>
                              )}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}