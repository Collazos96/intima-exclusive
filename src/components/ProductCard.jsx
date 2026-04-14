import { useNavigate } from 'react-router-dom'
import Carousel from './Carousel'
import { formatPrecio } from '../data/productos'

export default function ProductCard({ producto }) {
  const nav = useNavigate()
  return (
    <div onClick={() => nav(`/producto/${producto.id}`)} className="bg-[#FFFDF9] border border-[#D9C4A8] overflow-hidden cursor-pointer hover:border-[#A03048] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
      <Carousel imagenes={producto.imagenes} nombre={producto.nombre}/>
      <div className="p-4">
        {producto.nuevo && <span className="inline-block bg-[#7B1A2E] text-[#F5EDE0] font-sans text-[0.55rem] tracking-widest px-2 py-0.5 mb-2 uppercase">Nuevo</span>}
        <span className="block font-sans text-[0.6rem] tracking-widest uppercase text-[#C4A882] mb-1">Sets</span>
        <h3 className="font-serif text-[#3A1A20] text-base mb-3">{producto.nombre}</h3>
        <div className="flex items-center justify-between">
          <p className="font-sans font-bold text-[#7B1A2E]">{formatPrecio(producto.precio)}</p>
          <button
            onClick={e=>{e.stopPropagation();nav(`/producto/${producto.id}`)}}
            className="border border-[#7B1A2E] text-[#7B1A2E] font-sans text-[0.6rem] tracking-widest uppercase px-3 py-1.5 hover:bg-[#7B1A2E] hover:text-[#F5EDE0] transition-all">
            Ver detalle
          </button>
        </div>
      </div>
    </div>
  )
}