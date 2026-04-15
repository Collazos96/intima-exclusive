import { useNavigate } from 'react-router-dom'
import Carousel from './Carousel'
import { formatPrecio } from '../data/productos'

export default function ProductCard({ producto }) {
  const nav = useNavigate()
  return (
    <div onClick={() => nav(`/producto/${producto.id}`)} className="bg-cream-50 border border-gold-300 overflow-hidden cursor-pointer hover:border-wine-500 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
      <Carousel imagenes={producto.imagenes} nombre={producto.nombre}/>
      <div className="p-4">
        {producto.nuevo && <span className="inline-block bg-wine-600 text-cream-200 font-sans text-[0.55rem] tracking-widest px-2 py-0.5 mb-2 uppercase">Nuevo</span>}
        <span className="block font-sans text-[0.6rem] tracking-widest uppercase text-gold-500 mb-1">Sets</span>
        <h3 className="font-serif text-wine-900 text-base mb-3">{producto.nombre}</h3>
        <div className="flex items-center justify-between">
          <p className="font-sans font-bold text-wine-600">{formatPrecio(producto.precio)}</p>
          <button
            onClick={e=>{e.stopPropagation();nav(`/producto/${producto.id}`)}}
            className="border border-wine-600 text-wine-600 font-sans text-[0.6rem] tracking-widest uppercase px-3 py-1.5 hover:bg-wine-600 hover:text-cream-200 transition-all">
            Ver detalle
          </button>
        </div>
      </div>
    </div>
  )
}