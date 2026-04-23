import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getAdminReviews, aprobarReview, eliminarReview } from '../../hooks/useAdmin'
import { qk } from '../../lib/queryClient'

function formatoFecha(iso) {
  try { return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return '' }
}

export default function AdminReviews() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const [estado, setEstado] = useState('pendientes')

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: qk.adminReviews(estado),
    queryFn: () => getAdminReviews(estado === 'todas' ? undefined : estado),
  })

  const aprobar = useMutation({
    mutationFn: ({ id, aprobada }) => aprobarReview(id, aprobada),
    onSuccess: (_, vars) => {
      toast.success(vars.aprobada ? 'Reseña aprobada' : 'Reseña oculta')
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      qc.invalidateQueries({ queryKey: ['reviews'] })
    },
    onError: (err) => toast.error(err.message || 'No se pudo actualizar'),
  })

  const borrar = useMutation({
    mutationFn: eliminarReview,
    onSuccess: () => {
      toast.success('Reseña eliminada')
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    },
    onError: (err) => toast.error(err.message || 'No se pudo eliminar'),
  })

  return (
    <main className="min-h-screen bg-cream-100 pt-[70px]">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-2xl text-wine-800">Moderación de reseñas</h1>
            <p className="font-sans text-[0.75rem] text-taupe-600 mt-1">
              Aprueba o rechaza opiniones enviadas por clientas.
            </p>
          </div>
          <button
            onClick={() => nav('/admin')}
            className="border border-gold-300 text-taupe-600 px-6 py-2.5 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors"
          >
            ← Volver al panel
          </button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap" role="tablist" aria-label="Filtros de estado">
          {[
            ['pendientes', 'Pendientes'],
            ['aprobadas', 'Aprobadas'],
            ['todas', 'Todas'],
          ].map(([v, l]) => (
            <button
              key={v}
              role="tab"
              aria-selected={estado === v}
              onClick={() => setEstado(v)}
              className={`px-4 py-2 font-sans text-[0.68rem] tracking-widest uppercase transition-colors ${estado === v
                ? 'bg-wine-600 text-cream-200'
                : 'border border-gold-300 text-taupe-600 hover:border-wine-600 hover:text-wine-600'}`}
            >
              {l}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="font-serif italic text-gold-500 text-center py-12">Cargando…</p>
        ) : reviews.length === 0 ? (
          <div className="bg-white border border-gold-300 p-8 text-center">
            <p className="font-sans text-[0.85rem] text-taupe-400 italic">
              No hay reseñas {estado !== 'todas' ? estado : ''}.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="bg-white border border-gold-300 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <p className="font-serif text-wine-900">
                      {r.producto_nombre || <span className="italic text-taupe-400">Producto eliminado</span>}
                    </p>
                    <p className="font-sans text-[0.7rem] text-taupe-400 mt-0.5">
                      {r.nombre} · {formatoFecha(r.fecha)} ·
                      <span className={`ml-1 font-bold ${r.aprobada ? 'text-green-700' : 'text-amber-700'}`}>
                        {r.aprobada ? 'Aprobada' : 'Pendiente'}
                      </span>
                    </p>
                  </div>
                  <div className="text-wine-600 text-lg tracking-widest" aria-label={`${r.rating} de 5 estrellas`}>
                    {'★'.repeat(r.rating)}<span className="text-taupe-400/40">{'★'.repeat(5 - r.rating)}</span>
                  </div>
                </div>

                <p className="font-sans text-[0.88rem] text-taupe-600 leading-relaxed whitespace-pre-wrap mb-4">
                  {r.comentario}
                </p>

                <div className="flex gap-2 flex-wrap">
                  {!r.aprobada && (
                    <button
                      onClick={() => aprobar.mutate({ id: r.id, aprobada: true })}
                      disabled={aprobar.isPending}
                      className="bg-wine-600 text-cream-200 px-4 py-1.5 font-sans text-[0.65rem] tracking-widest uppercase hover:bg-wine-800 transition-colors"
                    >
                      Aprobar
                    </button>
                  )}
                  {r.aprobada && (
                    <button
                      onClick={() => aprobar.mutate({ id: r.id, aprobada: false })}
                      disabled={aprobar.isPending}
                      className="border border-gold-300 text-taupe-600 px-4 py-1.5 font-sans text-[0.65rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors"
                    >
                      Ocultar
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar esta reseña? No se podrá recuperar.')) borrar.mutate(r.id)
                    }}
                    disabled={borrar.isPending}
                    className="border border-red-200 text-red-500 px-4 py-1.5 font-sans text-[0.65rem] tracking-widest uppercase hover:bg-red-50 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
