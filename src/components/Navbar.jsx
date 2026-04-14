import { Link, useNavigate } from 'react-router-dom'
import { categorias } from '../data/productos'

export default function Navbar() {
  const nav = useNavigate()
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAF5EE]/97 border-b border-[#D9C4A8] backdrop-blur-sm">
      <div className="flex items-center justify-between px-10 py-4 flex-wrap gap-2">
        <Link to="/" className="font-serif text-[#7B1A2E] tracking-widest uppercase font-bold text-lg">
          Íntima Exclusive
        </Link>
        <ul className="flex flex-wrap gap-1">
          <li><Link to="/" className="font-sans text-[0.68rem] tracking-widest uppercase text-[#7A5A60] hover:text-[#7B1A2E] px-3 py-1 block transition-colors">Inicio</Link></li>
          {categorias.map(c => (
            <li key={c.id}>
              <Link to={`/categoria/${c.id}`} className="font-sans text-[0.68rem] tracking-widest uppercase text-[#7A5A60] hover:text-[#7B1A2E] px-3 py-1 block transition-colors">
                {c.nombre}
              </Link>
            </li>
          ))}
        </ul>
        <button
          onClick={() => window.open('https://wa.me/573028556022', '_blank')}
          className="bg-[#7B1A2E] text-[#F5EDE0] px-5 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:bg-[#4E0F1C] transition-colors">
          Comprar ahora
        </button>
      </div>
    </nav>
  )
}