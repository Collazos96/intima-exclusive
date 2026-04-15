import { useQuery } from '@tanstack/react-query'
import { getRelacionados } from '../hooks/useApi'
import { qk } from '../lib/queryClient'
import ProductCard from './ProductCard'

export default function ProductosRelacionados({ productoId }) {
  const { data = [], isLoading } = useQuery({
    queryKey: qk.relacionados(productoId),
    queryFn: () => getRelacionados(productoId),
    enabled: !!productoId,
  })

  if (isLoading || data.length === 0) return null

  return (
    <section className="mt-14 border-t border-gold-300 pt-10" aria-labelledby="relacionados-title">
      <div className="text-center mb-8">
        <span className="block font-sans text-[0.62rem] tracking-[4px] uppercase text-gold-500 mb-2">Podría gustarte</span>
        <h2 id="relacionados-title" className="font-serif text-2xl text-wine-900">
          Completa tu <em className="text-wine-600">look</em>
        </h2>
        <div className="w-12 h-px bg-gold-500 mx-auto my-4"/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {data.map((p) => (
          <ProductCard key={p.id} producto={p} />
        ))}
      </div>
    </section>
  )
}
