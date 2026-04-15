import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProductosByCategoria, getCategorias } from '../hooks/useApi'
import { qk } from '../lib/queryClient'
import ProductCard from '../components/ProductCard'

export default function Categoria() {
  const { id } = useParams()
  const nav = useNavigate()

  const { data: categorias = [] } = useQuery({
    queryKey: qk.categorias,
    queryFn: getCategorias,
  })
  const { data: prods = [], isLoading } = useQuery({
    queryKey: qk.productosPorCategoria(id),
    queryFn: () => getProductosByCategoria(id),
    enabled: !!id,
  })
  const cat = categorias.find(c => c.id === id)

  if (isLoading) return (
    <div className="pt-24 min-h-screen flex items-center justify-center">
      <p className="font-serif italic text-gold-500 text-xl">Cargando...</p>
    </div>
  )

  if (!cat) return <div className="pt-24 text-center text-taupe-600">Categoría no encontrada</div>

  return (
    <main className="pt-[70px] min-h-screen">
      <div className="bg-cream-200 border-b border-gold-300 text-center py-12 px-8">
        <p className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-400 mb-3">
          <span onClick={() => nav('/')} className="text-wine-600 cursor-pointer hover:underline">Inicio</span>
          {' / '}{cat.nombre}
        </p>
        <h1 className="font-serif text-[clamp(1.8rem,4vw,3rem)] tracking-widest uppercase text-wine-800">
          <em className="text-wine-600">{cat.nombre}</em>
        </h1>
        <p className="font-sans text-[0.85rem] text-taupe-600 mt-2">{cat.sub}</p>
        <div className="w-14 h-px bg-gold-500 mx-auto mt-4"/>
      </div>
      <div className="px-8 py-12 max-w-6xl mx-auto">
        {prods.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {prods.map(p => <ProductCard key={p.id} producto={p}/>)}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-gold-300 max-w-md mx-auto">
            <p className="font-serif text-gold-500 text-2xl mb-3">🌹</p>
            <p className="font-sans text-[0.85rem] text-taupe-400 italic mb-6">Próximamente — Estamos preparando nuestra colección de {cat.nombre.toLowerCase()}.</p>
            <button onClick={() => window.open('https://wa.me/573028556022', '_blank')}
              className="bg-wine-600 text-cream-200 px-8 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-wine-800 transition-colors">
              Preguntar disponibilidad
            </button>
          </div>
        )}
      </div>
    </main>
  )
}