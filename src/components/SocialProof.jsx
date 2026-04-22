import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getReviewsRecientes } from '../hooks/useApi'
import Reveal from './Reveal'

/**
 * Prueba social basada en reseñas reales aprobadas.
 * Se oculta si hay < 3 reseñas totales (evita verse vacío).
 */
export default function SocialProof() {
  const { data } = useQuery({
    queryKey: ['reviews', 'recientes'],
    queryFn: getReviewsRecientes,
  })

  if (!data || data.total < 3) return null

  const estrellas = Math.round(data.promedio || 0)

  return (
    <section className="py-20 px-6 bg-cream-100 text-center" aria-labelledby="social-proof-title">
      <Reveal>
        <span className="block font-body text-[0.62rem] tracking-[4px] uppercase text-gold-500 mb-3">Lo que opinan</span>
        <h2 id="social-proof-title" className="font-display text-[clamp(1.6rem,3vw,2.4rem)] text-wine-900 mb-2">
          <em className="font-elegant italic text-wine-600">Clientas</em> reales
        </h2>
        <div className="w-12 h-px bg-gold-500 mx-auto my-5" />
      </Reveal>

      {/* Top stats */}
      <Reveal delay={80}>
        <div className="flex items-center justify-center gap-6 mb-12 flex-wrap">
          <div className="text-wine-600 tracking-widest text-2xl" aria-label={`${estrellas} de 5 estrellas`}>
            {'★'.repeat(estrellas)}<span className="text-taupe-400/30">{'★'.repeat(5 - estrellas)}</span>
          </div>
          <div className="text-left">
            <p className="font-display text-wine-900 text-2xl leading-none">
              {(data.promedio || 0).toFixed(1)}<span className="text-taupe-400 text-base"> / 5</span>
            </p>
            <p className="font-body text-[0.72rem] tracking-widest uppercase text-taupe-600">
              {data.total} reseña{data.total === 1 ? '' : 's'} verificada{data.total === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </Reveal>

      {/* Grid de reseñas recientes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {data.recientes.slice(0, 3).map((r, idx) => (
          <Reveal key={idx} delay={140 + idx * 80}>
            <article className="bg-white border border-gold-300 p-6 text-left h-full flex flex-col hover:border-wine-600 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="text-wine-600 tracking-widest mb-3" aria-label={`${r.rating} de 5 estrellas`}>
                {'★'.repeat(r.rating)}<span className="text-taupe-400/30">{'★'.repeat(5 - r.rating)}</span>
              </div>
              <p className="font-body text-[0.9rem] text-taupe-600 leading-relaxed italic mb-4 flex-1">
                "{r.comentario.length > 140 ? r.comentario.slice(0, 140) + '…' : r.comentario}"
              </p>
              <div>
                <p className="font-body text-[0.72rem] tracking-widest uppercase text-wine-600">
                  — {r.nombre}
                </p>
                {r.producto_nombre && (
                  <Link
                    to={`/producto/${r.producto_id}`}
                    className="font-body text-[0.68rem] text-taupe-400 italic hover:text-wine-600 transition-colors"
                  >
                    sobre {r.producto_nombre}
                  </Link>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      {data.total > 3 && (
        <Reveal delay={400}>
          <p className="font-body text-[0.8rem] text-taupe-600 mt-10">
            Y {data.total - 3} reseña{data.total - 3 === 1 ? '' : 's'} más en las páginas de producto.
          </p>
        </Reveal>
      )}
    </section>
  )
}
