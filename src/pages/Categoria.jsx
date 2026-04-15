import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProductosByCategoria, getCategorias } from '../hooks/useApi'
import { qk } from '../lib/queryClient'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import { ProductGridSkeleton } from '../components/Skeletons'
import CategoriaFilters, { filtrarYOrdenar } from '../components/CategoriaFilters'
import CategoriaContenido, { buildCategoriaFaqJsonLd } from '../components/CategoriaContenido'

const filtrosIniciales = { colores: [], soloNuevos: false, precioMax: 0, orden: 'nuevo' }

export default function Categoria() {
  const { id } = useParams()
  const [filtros, setFiltros] = useState(filtrosIniciales)

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

  const productosFiltrados = useMemo(
    () => filtrarYOrdenar(prods, filtros),
    [prods, filtros],
  )

  if (!cat && !isLoading) return <div className="pt-24 text-center text-taupe-600">Categoría no encontrada</div>

  return (
    <main id="main" className="pt-[70px] min-h-screen">
      <Seo
        title={`${cat?.nombre || 'Categoría'} — Lencería`}
        description={cat ? `${cat.nombre}: ${cat.sub}. Envío discreto a toda Colombia, cambios hasta 30 días.` : undefined}
        path={`/categoria/${id}`}
        jsonLd={cat ? [
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://intimaexclusive.com/' },
              { '@type': 'ListItem', position: 2, name: cat.nombre },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${cat.nombre} — Íntima Exclusive`,
            description: cat.sub,
            url: `https://intimaexclusive.com/categoria/${id}`,
            inLanguage: 'es-CO',
            isPartOf: { '@type': 'WebSite', url: 'https://intimaexclusive.com' },
          },
          ...(buildCategoriaFaqJsonLd(id) ? [buildCategoriaFaqJsonLd(id)] : []),
        ] : undefined}
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
        {cat && <CategoriaContenido categoriaId={id} />}
        {isLoading ? (
          <ProductGridSkeleton count={6} />
        ) : prods.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gold-300 max-w-md mx-auto">
            <p className="font-serif text-gold-500 text-2xl mb-3" aria-hidden="true">🌹</p>
            <p className="font-sans text-[0.85rem] text-taupe-400 italic mb-6">
              Próximamente — Estamos preparando nuestra colección de {cat.nombre.toLowerCase()}.
            </p>
            <button
              onClick={() => window.open('https://wa.me/573028556022', '_blank')}
              className="bg-wine-600 text-cream-200 px-8 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-wine-800 transition-colors"
            >
              Preguntar disponibilidad
            </button>
          </div>
        ) : (
          <>
            <CategoriaFilters
              productos={prods}
              filtros={filtros}
              setFiltros={setFiltros}
              totalResultados={productosFiltrados.length}
            />
            {productosFiltrados.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productosFiltrados.map(p => <ProductCard key={p.id} producto={p}/>)}
              </div>
            ) : (
              <div className="text-center py-14 border border-dashed border-gold-300">
                <p className="font-sans text-[0.85rem] text-taupe-600 mb-4">
                  Ninguna prenda coincide con los filtros actuales.
                </p>
                <button
                  onClick={() => setFiltros(filtrosIniciales)}
                  className="border border-wine-600 text-wine-600 px-6 py-2 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-wine-600 hover:text-cream-200 transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
