import { Link } from 'react-router-dom'
import { categorias } from '../data/productos'
import { useCart } from '../lib/cartStore'

export default function Navbar() {
  const { open, totalItems } = useCart()
  const count = totalItems()

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
        <button
          onClick={open}
          aria-label={`Abrir carrito, ${count} ${count === 1 ? 'prenda' : 'prendas'}`}
          className="relative bg-wine-600 text-cream-200 px-4 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:bg-wine-800 transition-colors flex items-center gap-2"
        >
          <span aria-hidden="true">🛍</span>
          <span>Mi selección</span>
          {count > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-2 -right-2 bg-gold-500 text-wine-900 text-[0.6rem] font-bold rounded-full w-5 h-5 flex items-center justify-center"
            >
              {count > 99 ? '99+' : count}
            </span>
          )}
        </button>
      </div>
    </nav>
  )
}
