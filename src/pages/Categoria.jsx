import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProductosByCategoria, getCategorias } from '../hooks/useApi'
import { qk } from '../lib/queryClient'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import { ProductGridSkeleton } from '../components/Skeletons'

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

  if (!cat && !isLoading) return <div className="pt-24 text-center text-taupe-600">Categoría no encontrada</div>

  return (
    <main id="main" className="pt-[70px] min-h-screen">
      <Seo
        title={`${cat.nombre} — Lencería ${cat.nombre.toLowerCase()}`}
        description={`${cat.nombre}: ${cat.sub}. Envío discreto a toda Colombia, cambios hasta 30 días.`}
        path={`/categoria/${id}`}
      />
      <div className="bg-cream-200 border-b border-gold-300 text-center py-12 px-8">
        <nav aria-label="Breadcrumb" className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-400 mb-3">
          <Link to="/" className="text-wine-600 hover:underline focus-visible:outline-2 focus-visible:outline-wine-600">Inicio</Link>
          {' / '}<span aria-current="page">{cat?.nombre || '...'}</span>
        </nav>
        <h1 className="font-serif text-[clamp(1.8rem,4vw,3rem)] tracking-widest uppercase text-wine-800">
          <em className="text-wine-600">{cat?.nombre || '...'}</em>
        </h1>
        {cat?.sub && <p className="font-sans text-[0.85rem] text-taupe-600 mt-2">{cat.sub}</p>}
        <div className="w-14 h-px bg-gold-500 mx-auto mt-4"/>
      </div>
      <div className="px-8 py-12 max-w-6xl mx-auto">
        {isLoading ? (
          <ProductGridSkeleton count={6} />
        ) : prods.length > 0 ? (
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