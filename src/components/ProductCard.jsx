import { Link } from 'react-router-dom'
import Carousel from './Carousel'
import WishlistButton from './WishlistButton'
import { formatPrecio } from '../data/productos'

export default function ProductCard({ producto, priority = false }) {
  return (
    <div className="relative group bg-cream-50 border border-gold-300 overflow-hidden hover:border-wine-500 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
      <WishlistButton producto={producto} />
      <Carousel imagenes={producto.imagenes} nombre={producto.nombre} priority={priority}/>
      <Link
        to={`/producto/${producto.id}`}
        aria-label={`Ver detalle de ${producto.nombre}`}
        className="block p-4 focus-visible:outline-2 focus-visible:outline-wine-600 focus-visible:outline-offset-2"
      >
        {producto.nuevo === 1 && (
          <span className="inline-block bg-wine-600 text-cream-200 font-sans text-[0.55rem] tracking-widest px-2 py-0.5 mb-2 uppercase">Nuevo</span>
        )}
        <span className="block font-sans text-[0.6rem] tracking-widest uppercase text-gold-500 mb-1 capitalize">
          {producto.categoria_id || 'Íntima'}
        </span>
        <h3 className="font-serif text-wine-900 text-base mb-3">{producto.nombre}</h3>
        <div className="flex items-center justify-between">
          <p className="font-sans font-bold text-wine-600">{formatPrecio(producto.precio)}</p>
          <span
            aria-hidden="true"
            className="border border-wine-600 text-wine-600 font-sans text-[0.6rem] tracking-widest uppercase px-3 py-1.5 group-hover:bg-wine-600 group-hover:text-cream-200 transition-all"
          >
            Ver detalle
          </span>
        </div>
      </Link>
    </div>
  )
}
