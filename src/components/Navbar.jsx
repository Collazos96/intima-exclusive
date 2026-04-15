import { Link, useNavigate } from 'react-router-dom'
import { categorias } from '../data/productos'

export default function Navbar() {
  const nav = useNavigate()
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-100/97 border-b border-gold-300 backdrop-blur-sm">
      <div className="flex items-center justify-between px-10 py-4 flex-wrap gap-2">
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
          onClick={() => window.open('https://wa.me/573028556022', '_blank')}
          className="bg-wine-600 text-cream-200 px-5 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:bg-wine-800 transition-colors">
          Comprar ahora
        </button>
      </div>
    </nav>
  )
}