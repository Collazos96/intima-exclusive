import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminProductos, actualizarStock, isAuthenticated } from '../../hooks/useAdmin'

export default function AdminInventario() {
  const nav = useNavigate()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState({})
  const [exito, setExito] = useState({})

  useEffect(() => {
    if (!isAuthenticated()) {
      nav('/admin/login')
      return
    }
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)
    const data = await getAdminProductos()
    setProductos(data)
    setLoading(false)
  }

  async function handleStockChange(colorId, talla, valor) {
    const stock = parseInt(valor)
    if (isNaN(stock) || stock < 0) return

    const key = `${colorId}-${talla}`
    setGuardando(g => ({ ...g, [key]: true }))

    await actualizarStock(colorId, talla, stock)

    setGuardando(g => ({ ...g, [key]: false }))
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
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF5EE]">
      <p className="font-serif italic text-[#C4A882]">Cargando inventario...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#FAF5EE] pt-[70px]">
      <div className="max-w-6xl mx-auto px-8 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl text-[#4E0F1C]">Inventario</h1>
            <p className="font-sans text-[0.75rem] text-[#7A5A60] tracking-wide mt-1">
              Gestion de stock por color y talla
            </p>
          </div>
          <button
            onClick={() => nav('/admin')}
            className="border border-[#D9C4A8] text-[#7A5A60] px-5 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:border-[#7B1A2E] hover:text-[#7B1A2E] transition-colors">
            Volver al panel
          </button>
        </div>

        <div className="space-y-6">
          {productos.map(p => (
            <div key={p.id} className="bg-white border border-[#D9C4A8]">
              <div className="px-6 py-4 border-b border-[#D9C4A8] flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-[#3A1A20] text-lg">{p.nombre}</h2>
                  <p className="font-sans text-[0.62rem] tracking-widest uppercase text-[#B09090] mt-0.5">{p.categoria_id}</p>
                </div>
                <span className="font-sans text-sm font-bold text-[#7B1A2E]">
                  ${p.precio.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="p-6">
                {p.colores.map(color => (
                  <div key={color.id} className="mb-6 last:mb-0">
                    <p className="font-sans text-[0.68rem] tracking-widest uppercase text-[#7A5A60] mb-3">
                      {color.nombre}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                      {color.tallas.map(t => {
                        const key = `${color.id}-${t.talla}`
                        const stockBajo = t.stock <= 3
                        const agotado = t.stock === 0
                        return (
                          <div key={t.talla} className={`border p-3 ${agotado ? 'border-red-200 bg-red-50' : stockBajo ? 'border-amber-200 bg-amber-50' : 'border-[#D9C4A8]'}`}>
                            <p className="font-sans text-[0.65rem] tracking-widest uppercase text-center mb-2 text-[#7A5A60]">
                              {t.talla}
                            </p>
                            <input
                              type="number"
                              min="0"
                              value={t.stock}
                              onChange={e => handleStockChange(color.id, t.talla, e.target.value)}
                              className={`w-full text-center border px-2 py-1.5 font-sans text-sm outline-none focus:border-[#7B1A2E] ${agotado ? 'border-red-200 text-red-600' : stockBajo ? 'border-amber-200 text-amber-600' : 'border-[#D9C4A8] text-[#3A1A20]'}`}
                            />
                            <p className="font-sans text-[0.55rem] text-center mt-1">
                              {guardando[key] ? (
                                <span className="text-[#7A5A60]">Guardando...</span>
                              ) : exito[key] ? (
                                <span className="text-green-600">Guardado</span>
                              ) : agotado ? (
                                <span className="text-red-500">Agotado</span>
                              ) : stockBajo ? (
                                <span className="text-amber-500">Stock bajo</span>
                              ) : (
                                <span className="text-[#B09090]">Unidades</span>
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