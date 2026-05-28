import { Link } from 'react-router-dom'
import Img from './Img'

/**
 * Bento grid de categorías.
 * Desktop (3 cols): 3 filas de 3 + Promociones banner full-width. Sin espacios.
 * Mobile  (2 cols): 4 filas de 2 + Pijamas full-width + Promociones banner.
 */
export default function CategoriasBento({ categorias, imagenesPorCategoria }) {
  if (!categorias?.length) return null

  const ORDEN = ['sets', 'corsets', 'croptops', 'lenceria', 'bodys', 'babydolls', 'tangas', 'accesorios', 'pijamas', 'promociones']
  const ordenadas = ORDEN
    .map((id) => categorias.find((c) => c.id === id))
    .filter(Boolean)

  // Cantidad de tarjetas normales (sin el banner final)
  const totalRegulares = ordenadas.length - 1
  // Si el total de tarjetas regulares es impar, la última queda sola en mobile → hacerla ancha
  const hayHuerfana = totalRegulares % 2 !== 0

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-6xl mx-auto">
      {ordenadas.map((cat, i) => {
        const imagen = imagenesPorCategoria?.[cat.id]
        const isHero   = i === 0
        const isBanner = i === ordenadas.length - 1
        // Última tarjeta regular en mobile cuando el total es impar → ocupa las 2 columnas
        const isHuerfana = hayHuerfana && i === ordenadas.length - 2

        return (
          <BentoCard
            key={cat.id}
            categoria={cat}
            imagen={imagen}
            className={
              isBanner
                ? 'col-span-2 sm:col-span-3 aspect-[21/9] sm:aspect-[32/9] sm:min-h-[200px]'
                : isHuerfana
                  ? 'col-span-2 sm:col-span-1 aspect-[21/9] sm:aspect-auto sm:min-h-[250px]'
                  : isHero
                    ? 'aspect-[4/3] sm:aspect-auto sm:min-h-[380px]'
                    : 'aspect-[4/3] sm:aspect-auto sm:min-h-[250px]'
            }
            size={isHero ? 'large' : isBanner || isHuerfana ? 'wide' : 'small'}
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
      className={`group relative overflow-hidden border border-gold-300 hover:border-wine-600 focus-visible:outline-2 focus-visible:outline-wine-600 focus-visible:outline-offset-2 transition-all ${className}`}
      aria-label={`Explorar ${categoria.nombre}`}
    >
      {/* Fondo: imagen o gradiente vino */}
      {imagen ? (
        <Img
          src={imagen}
          alt={categoria.nombre}
          w={size === 'large' ? 700 : 400}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-wine-700 to-wine-950" />
      )}

      {/* Overlay para legibilidad del texto */}
      <div className={`absolute inset-0 ${imagen ? 'bg-gradient-to-t from-wine-900/85 via-wine-900/25 to-transparent' : 'bg-gradient-to-t from-wine-950/60 to-transparent'}`} />

      {/* Contenido */}
      <div className={`relative z-10 h-full flex flex-col justify-end p-4 ${size === 'large' ? 'sm:p-8' : size === 'wide' ? 'sm:p-8' : 'sm:p-6'}`}>
        <span className="block font-body text-[0.6rem] tracking-[4px] uppercase text-gold-300 mb-1.5">
          Colección
        </span>
        <h3 className={`font-display text-cream-50 mb-1 ${size === 'large' ? 'text-3xl sm:text-5xl' : size === 'wide' ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}>
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
