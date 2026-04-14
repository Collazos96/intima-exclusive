import { useParams, useNavigate } from 'react-router-dom'
import { categorias, productos } from '../data/productos'
import ProductCard from '../components/ProductCard'

export default function Categoria() {
  const { id } = useParams()
  const nav = useNavigate()
  const cat = categorias.find(c => c.id === id)
  const prods = productos.filter(p => p.categoria === id)

  if (!cat) return <div className="pt-24 text-center text-[#7A5A60]">Categoría no encontrada</div>

  return (
    <main className="pt-[70px] min-h-screen">
      {/* HEADER */}
      <div className="bg-[#F5EDE0] border-b border-[#D9C4A8] text-center py-12 px-8">
        <p className="font-sans text-[0.68rem] tracking-widest uppercase text-[#B09090] mb-3">
          <span onClick={() => nav('/')} className="text-[#7B1A2E] cursor-pointer hover:underline">Inicio</span>
          {' / '}{cat.nombre}
        </p>
        <h1 className="font-serif text-[clamp(1.8rem,4vw,3rem)] tracking-widest uppercase text-[#4E0F1C]">
          <em className="text-[#7B1A2E]">{cat.nombre}</em>
        </h1>
        <p className="font-sans text-[0.85rem] text-[#7A5A60] mt-2">{cat.sub}</p>
        <div className="w-14 h-px bg-[#C4A882] mx-auto mt-4"/>
      </div>

      {/* PRODUCTOS */}
      <div className="px-8 py-12 max-w-6xl mx-auto">
        {prods.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {prods.map(p => <ProductCard key={p.id} producto={p}/>)}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-[#D9C4A8] max-w-md mx-auto">
            <p className="font-serif text-[#C4A882] text-2xl mb-3">🌹</p>
            <p className="font-sans text-[0.85rem] text-[#B09090] italic mb-6">Próximamente — Estamos preparando nuestra colección de {cat.nombre.toLowerCase()}.</p>
            <button
              onClick={() => window.open('https://wa.me/573028556022', '_blank')}
              className="bg-[#7B1A2E] text-[#F5EDE0] px-8 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-[#4E0F1C] transition-colors">
              Preguntar disponibilidad
            </button>
          </div>
        )}
      </div>
    </main>
  )
}