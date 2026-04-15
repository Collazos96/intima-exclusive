import { Link } from 'react-router-dom'
import { categorias } from '../data/productos'
import { useCart } from '../lib/cartStore'
import { useWishlist } from '../lib/wishlistStore'

export default function Navbar() {
  const openCart = useCart((s) => s.open)
  const cartCount = useCart((s) => s.totalItems())
  const favCount = useWishlist((s) => s.count())

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-100/97 border-b border-gold-300 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 sm:px-10 py-4 flex-wrap gap-2">
        <Link to="/" className="font-serif text-wine-600 tracking-widest uppercase font-bold text-lg">
          Íntima Exclusive
        </Link>
        <ul className="flex flex-wrap gap-1">
          <li><Link to="/" className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-600 hover:text-wine-600 px-3 py-1 block transition-colors">Inicio</Link></li>
          {categorias.map(c => (
            <li key={c.id}>
              <Link to={`/categoria/${c.id}`} className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-600 hover:text-wine-600 px-3 py-1 block transition-colors">
                {c.nombre}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Link
            to="/favoritos"
            aria-label={`Mis favoritos, ${favCount} ${favCount === 1 ? 'prenda' : 'prendas'}`}
            className="relative w-10 h-10 flex items-center justify-center text-wine-600 hover:bg-cream-200 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-wine-600"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M12 21s-7.5-4.5-9.5-10.5C1.2 6.4 4 3 7.5 3c2 0 3.5 1 4.5 2.5C13 4 14.5 3 16.5 3 20 3 22.8 6.4 21.5 10.5 19.5 16.5 12 21 12 21z"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            {favCount > 0 && (
              <span aria-hidden="true" className="absolute -top-1 -right-1 bg-gold-500 text-wine-900 text-[0.6rem] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {favCount > 99 ? '99+' : favCount}
              </span>
            )}
          </Link>
          <button
            onClick={openCart}
            aria-label={`Abrir carrito, ${cartCount} ${cartCount === 1 ? 'prenda' : 'prendas'}`}
            className="relative bg-wine-600 text-cream-200 px-4 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:bg-wine-800 transition-colors flex items-center gap-2"
          >
            <span aria-hidden="true">🛍</span>
            <span>Mi selección</span>
            {cartCount > 0 && (
              <span aria-hidden="true" className="absolute -top-2 -right-2 bg-gold-500 text-wine-900 text-[0.6rem] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}
