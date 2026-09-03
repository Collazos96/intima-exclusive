import { useState, useEffect, useMemo, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { getAdminProductos, getAdminPedidos, eliminarProducto, isAuthenticated } from '../../hooks/useAdmin'
import { categorias as CATS } from '../../data/productos'

// Mapa id de categoría -> nombre visible (para mostrar el nombre en vez del id).
const CAT_NOMBRE = Object.fromEntries(CATS.map((c) => [c.id, c.nombre]))
const nombreCat = (id) => CAT_NOMBRE[id] || id

const fmt = (p) => '$' + p.toLocaleString('es-CO')

// Orden de categorías para el listado del admin, según el orden en que están
// lanzadas en la tienda. Las categorías que NO estén aquí se muestran al final,
// alfabéticamente. Para cambiar el orden, edita solo este array.
const ORDEN_CATEGORIAS = [
  'corsets',     // Corsets
  'croptops',    // Croptops
  'bodys',       // Bodys
  'sets',        // Sets
  'lenceria',    // Básicos / Lencería
  'babydolls',   // Baby Dolls
  'tangas',      // Tangas
  'pijamas',     // Levantadoras (id 'pijamas')
  'accesorios',  // Accesorios
  'promociones', // Promociones / Últimas unidades
]
// Índice de una categoría en el orden (las no listadas van al final).
const ordenCat = (id) => {
  const i = ORDEN_CATEGORIAS.indexOf(id)
  return i === -1 ? ORDEN_CATEGORIAS.length : i
}

// Stock total de un producto sumando todas sus tallas
function stockTotal(p) {
  return (p.colores || []).reduce(
    (acc, c) => acc + (c.tallas || []).reduce((a, t) => a + (t.stock ?? 0), 0),
    0
  )
}

export default function AdminPanel() {
  const nav = useNavigate()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eliminando, setEliminando] = useState(null)

  // Filtros de la tabla
  const [busqueda, setBusqueda] = useState('')
  const [catFiltro, setCatFiltro] = useState('')
  const [vistaFiltro, setVistaFiltro] = useState('') // '' | 'agotados' | 'oferta'

  // Pedidos para las métricas (por enviar + ventas del mes)
  const { data: pedidosData } = useQuery({
    queryKey: ['admin', 'pedidos-dashboard'],
    queryFn: () => getAdminPedidos({ vista: 'todos' }),
    staleTime: 60_000,
    retry: false,
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      nav('/admin/login')
      return
    }
    cargarProductos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ===== Métricas =====
  const porEnviar = pedidosData?.counts?.activos ?? 0
  const ventasMes = useMemo(() => {
    const pedidos = pedidosData?.pedidos || []
    const ahora = new Date()
    return pedidos
      .filter((p) => {
        if (p.status !== 'APPROVED') return false
        const f = new Date(p.creado_at)
        return f.getFullYear() === ahora.getFullYear() && f.getMonth() === ahora.getMonth()
      })
      .reduce((acc, p) => acc + (p.total ?? 0), 0) / 100 // centavos → pesos
  }, [pedidosData])

  const agotados = useMemo(() => productos.filter((p) => stockTotal(p) === 0), [productos])
  const enOferta = useMemo(() => productos.filter((p) => p.precio_oferta != null), [productos])

  // Categorías presentes (para el select de filtro), en el orden definido.
  const categoriasDisponibles = useMemo(
    () => Array.from(new Set(productos.map((p) => p.categoria_id)))
      .sort((a, b) => ordenCat(a) - ordenCat(b) || a.localeCompare(b)),
    [productos]
  )

  // ===== Tabla filtrada + ordenada por categoría =====
  const filtrados = useMemo(() => {
    let out = productos
    const q = busqueda.trim().toLowerCase()
    if (q) out = out.filter((p) => p.nombre.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
    if (catFiltro) out = out.filter((p) => p.categoria_id === catFiltro)
    if (vistaFiltro === 'agotados') out = out.filter((p) => stockTotal(p) === 0)
    if (vistaFiltro === 'oferta') out = out.filter((p) => p.precio_oferta != null)
    // Agrupa por categoría (en el orden definido) y, dentro, alfabético por nombre.
    return [...out].sort((a, b) => {
      const d = ordenCat(a.categoria_id) - ordenCat(b.categoria_id)
      if (d !== 0) return d
      const c = a.categoria_id.localeCompare(b.categoria_id)
      if (c !== 0) return c
      return a.nombre.localeCompare(b.nombre)
    })
  }, [productos, busqueda, catFiltro, vistaFiltro])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100">
      <p className="font-serif italic text-gold-500">Cargando productos...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-cream-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-8">
          <div>
            <h1 className="font-serif text-2xl text-wine-800">Panel de administracion</h1>
            <p className="font-sans text-[0.75rem] text-taupe-600 tracking-wide mt-1">Gestion de productos - Intima Exclusive</p>
          </div>
          <button
            onClick={() => nav('/admin/productos/nuevo')}
            className="bg-wine-600 text-cream-200 px-6 py-2.5 font-sans text-[0.68rem] tracking-widest uppercase hover:bg-wine-800 transition-colors">
            + Nuevo producto
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 font-sans text-sm px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* MÉTRICAS OPERATIVAS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => nav('/admin/pedidos')}
            className={`text-left bg-white border p-5 transition-colors hover:border-wine-600 ${porEnviar > 0 ? 'border-wine-600' : 'border-gold-300'}`}>
            <p className="font-sans text-[0.62rem] tracking-widest uppercase text-taupe-400 mb-1">Pedidos por enviar</p>
            <p className={`font-serif text-3xl ${porEnviar > 0 ? 'text-wine-600' : 'text-taupe-400'}`}>{porEnviar}</p>
          </button>
          <div className="bg-white border border-gold-300 p-5">
            <p className="font-sans text-[0.62rem] tracking-widest uppercase text-taupe-400 mb-1">Ventas del mes</p>
            <p className="font-serif text-2xl text-wine-600 leading-[1.4]">{fmt(ventasMes)}</p>
          </div>
          <button
            onClick={() => setVistaFiltro(vistaFiltro === 'agotados' ? '' : 'agotados')}
            className={`text-left bg-white border p-5 transition-colors hover:border-wine-600 ${vistaFiltro === 'agotados' ? 'border-wine-600 ring-1 ring-wine-600' : agotados.length > 0 ? 'border-red-300' : 'border-gold-300'}`}>
            <p className="font-sans text-[0.62rem] tracking-widest uppercase text-taupe-400 mb-1">Agotados</p>
            <p className={`font-serif text-3xl ${agotados.length > 0 ? 'text-red-500' : 'text-taupe-400'}`}>{agotados.length}</p>
          </button>
          <button
            onClick={() => setVistaFiltro(vistaFiltro === 'oferta' ? '' : 'oferta')}
            className={`text-left bg-white border p-5 transition-colors hover:border-wine-600 ${vistaFiltro === 'oferta' ? 'border-wine-600 ring-1 ring-wine-600' : 'border-gold-300'}`}>
            <p className="font-sans text-[0.62rem] tracking-widest uppercase text-taupe-400 mb-1">En oferta</p>
            <p className="font-serif text-3xl text-gold-500">{enOferta.length}</p>
          </button>
        </div>

        {/* TABLA DE PRODUCTOS */}
        <div className="bg-white border border-gold-300">
          <div className="px-4 sm:px-6 py-4 border-b border-gold-300 flex items-center gap-3 flex-wrap">
            <h2 className="font-sans text-[0.72rem] tracking-widest uppercase text-taupe-600 mr-auto">
              Productos ({filtrados.length}{filtrados.length !== productos.length ? ` de ${productos.length}` : ''})
            </h2>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o ID…"
              className="border border-gold-300 px-3 py-2 font-sans text-[0.78rem] text-wine-900 outline-none focus:border-wine-600 w-full sm:w-56"
            />
            <select
              value={catFiltro}
              onChange={(e) => setCatFiltro(e.target.value)}
              className="border border-gold-300 px-3 py-2 font-sans text-[0.78rem] text-wine-900 outline-none focus:border-wine-600 bg-white capitalize">
              <option value="">Todas las categorías</option>
              {categoriasDisponibles.map((c) => (
                <option key={c} value={c} className="capitalize">{nombreCat(c)}</option>
              ))}
            </select>
            {(busqueda || catFiltro || vistaFiltro) && (
              <button
                onClick={() => { setBusqueda(''); setCatFiltro(''); setVistaFiltro('') }}
                className="font-sans text-[0.65rem] tracking-widest uppercase text-taupe-400 hover:text-wine-600 transition-colors">
                Limpiar ✕
              </button>
            )}
          </div>
          {filtrados.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-sans text-[0.85rem] text-taupe-400 italic">
                {productos.length === 0 ? 'No hay productos registrados.' : 'Ningún producto coincide con los filtros.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-gold-300">
                    {['Imagen', 'Nombre', 'Categoria', 'Precio', 'Stock', 'Nuevo', 'Acciones'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-sans text-[0.62rem] tracking-widest uppercase text-taupe-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p, i) => {
                    const stock = stockTotal(p)
                    // Encabezado de grupo cuando cambia la categoría respecto a la fila anterior.
                    const nuevaCategoria = i === 0 || filtrados[i - 1].categoria_id !== p.categoria_id
                    return (
                      <Fragment key={p.id}>
                      {nuevaCategoria && (
                        <tr className="bg-cream-200/70">
                          <td colSpan={7} className="px-4 py-2 border-y border-gold-300 font-sans text-[0.64rem] font-bold tracking-widest uppercase text-wine-700 capitalize">
                            {nombreCat(p.categoria_id)}
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-cream-200 hover:bg-cream-100 transition-colors">
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
                          <span className="font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600">{nombreCat(p.categoria_id)}</span>
                        </td>
                        <td className="px-4 py-3">
                          {p.precio_oferta != null ? (
                            <>
                              <span className="block font-sans text-[0.68rem] text-taupe-400 line-through">{fmt(p.precio)}</span>
                              <span className="font-sans text-sm font-bold text-wine-600">{fmt(p.precio_oferta)}</span>
                              <span className="ml-1 font-sans text-[0.58rem] tracking-wide uppercase bg-gold-500 text-wine-900 px-1.5 py-0.5">Oferta</span>
                            </>
                          ) : (
                            <span className="font-sans text-sm font-bold text-wine-600">{fmt(p.precio)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {stock === 0 ? (
                            <span className="font-sans text-[0.62rem] tracking-widest uppercase px-2 py-1 bg-red-100 text-red-600">Agotado</span>
                          ) : stock <= 3 ? (
                            <span className="font-sans text-[0.62rem] tracking-widest uppercase px-2 py-1 bg-amber-100 text-amber-700">{stock} — poco</span>
                          ) : (
                            <span className="font-sans text-[0.75rem] text-taupe-600">{stock} und.</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-sans text-[0.62rem] tracking-widest uppercase px-2 py-1 ${p.nuevo === 1 ? 'bg-wine-600 text-cream-200' : 'bg-cream-200 text-taupe-400'}`}>
                            {p.nuevo === 1 ? 'Si' : 'No'}
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
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
