import { toast } from 'sonner'
import { useWishlist } from '../lib/wishlistStore'

/**
 * Botón corazón para añadir/quitar de favoritos.
 * Variants:
 *   compact  → ícono solo, ideal para tarjetas (position absolute)
 *   full     → ícono + texto, para páginas de detalle
 */
export default function WishlistButton({ producto, variant = 'compact', onToggle }) {
  const esFavorito = useWishlist((s) => s.has(producto.id))
  const toggle = useWishlist((s) => s.toggle)

  function handleClick(e) {
    e.preventDefault()
    e.stopPropagation()
    const agregado = toggle({
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagenes?.[0] || producto.imagen,
      categoria: producto.categoria_id,
    })
    toast.success(agregado ? 'Añadido a favoritos' : 'Quitado de favoritos')
    onToggle?.(agregado)
  }

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={esFavorito}
        aria-label={esFavorito ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        className={`inline-flex items-center gap-2 px-4 py-2 border font-sans text-[0.7rem] tracking-widest uppercase transition-colors focus-visible:outline-2 focus-visible:outline-wine-600 ${esFavorito
          ? 'border-wine-600 bg-wine-600 text-cream-200'
          : 'border-wine-600 text-wine-600 hover:bg-wine-600 hover:text-cream-200'}`}
      >
        <Heart filled={esFavorito} />
        {esFavorito ? 'En favoritos' : 'Añadir a favoritos'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={esFavorito}
      aria-label={esFavorito ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      className={`absolute top-2 right-2 z-10 w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors focus-visible:outline-2 focus-visible:outline-wine-600 ${esFavorito
        ? 'bg-wine-600/90 text-cream-200'
        : 'bg-cream-50/80 text-wine-600 hover:bg-cream-50'}`}
    >
      <Heart filled={esFavorito} />
    </button>
  )
}

function Heart({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 21s-7.5-4.5-9.5-10.5C1.2 6.4 4 3 7.5 3c2 0 3.5 1 4.5 2.5C13 4 14.5 3 16.5 3 20 3 22.8 6.4 21.5 10.5 19.5 16.5 12 21 12 21z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
