import { Link } from 'react-router-dom'
import Img from './Img'

/**
 * Bento grid asimétrico de categorías. Sets domina a la izquierda,
 * el resto se distribuye a la derecha en una cuadrícula 2x2.
 *
 * Mobile: single column (stack vertical).
 * Desktop: grid-areas bento con Sets 2x2 + 4 categorías en 2x2 a la derecha.
 */
export default function CategoriasBento({ categorias, imagenesPorCategoria }) {
  if (!categorias?.length) return null

  // Orden fijo — define visualmente qué categoría va en cada celda
  const ORDEN = ['sets', 'corsets', 'lenceria', 'bodys', 'accesorios']
  const ordenadas = ORDEN
    .map((id) => categorias.find((c) => c.id === id))
    .filter(Boolean)

  return (
    <div
      className="grid gap-3 sm:gap-4 max-w-6xl mx-auto"
      style={{
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gridTemplateRows: 'auto auto',
      }}
    >
      {ordenadas.map((cat, i) => {
        const imagen = imagenesPorCategoria?.[cat.id]
        // La primera categoría (Sets) ocupa toda la columna izquierda (2 filas)
        const isHero = i === 0
        return (
          <BentoCard
            key={cat.id}
            categoria={cat}
            imagen={imagen}
            className={
              isHero
                ? 'row-span-2 aspect-[3/4] sm:aspect-auto sm:min-h-[520px]'
                : 'aspect-[4/3] sm:aspect-auto sm:min-h-[250px]'
            }
            size={isHero ? 'large' : 'small'}
          />
        )
      })}
    </div>
  )
}

function BentoCard({ categoria, imagen, className = '', size }) {
  return (
    <Link
      to={`/categoria/${categoria.id}`}
      className={`group relative overflow-hidden bg-cream-200 border border-gold-300 hover:border-wine-600 focus-visible:outline-2 focus-visible:outline-wine-600 focus-visible:outline-offset-2 transition-all ${className}`}
      aria-label={`Explorar ${categoria.nombre}`}
    >
      {imagen ? (
        <Img
          src={imagen}
          alt={categoria.nombre}
          w={size === 'large' ? 700 : 400}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-wine-600 to-wine-900" />
      )}

      {/* Overlay gradiente para legibilidad del texto */}
      <div className="absolute inset-0 bg-gradient-to-t from-wine-900/80 via-wine-900/20 to-transparent" />

      {/* Contenido */}
      <div className={`relative z-10 h-full flex flex-col justify-end p-5 ${size === 'large' ? 'sm:p-8' : 'sm:p-6'}`}>
        <span className="block font-body text-[0.6rem] tracking-[4px] uppercase text-gold-300 mb-2">
          Colección
        </span>
        <h3 className={`font-display text-cream-50 mb-1 ${size === 'large' ? 'text-3xl sm:text-5xl' : 'text-xl sm:text-2xl'}`}>
          {categoria.nombre}
        </h3>
        {categoria.sub && (
          <p className={`font-body text-cream-200/80 ${size === 'large' ? 'text-sm sm:text-base max-w-xs' : 'text-xs sm:text-sm'}`}>
            {categoria.sub}
          </p>
        )}
        <span className="mt-3 font-body text-[0.7rem] tracking-widest uppercase text-cream-50 opacity-0 group-hover:opacity-100 transition-opacity">
          Explorar →
        </span>
      </div>
    </Link>
  )
}
