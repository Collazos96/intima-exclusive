import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getReviews, crearReview } from '../hooks/useApi'
import { qk } from '../lib/queryClient'

function Stars({ value, onChange, size = 'md', ariaLabel }) {
  const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' }
  const activo = (i) => i <= value
  const interactivo = typeof onChange === 'function'
  return (
    <div
      className={`inline-flex tracking-widest ${sizes[size]}`}
      role={interactivo ? 'radiogroup' : 'img'}
      aria-label={ariaLabel || `${value} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((i) =>
        interactivo ? (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            aria-label={`${i} ${i === 1 ? 'estrella' : 'estrellas'}`}
            aria-checked={activo(i)}
            role="radio"
            className={`px-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-wine-600 ${activo(i) ? 'text-wine-600' : 'text-taupe-400 hover:text-wine-600'}`}
          >★</button>
        ) : (
          <span key={i} aria-hidden="true" className={activo(i) ? 'text-wine-600' : 'text-taupe-400/40'}>★</span>
        )
      )}
    </div>
  )
}

function formatoFecha(iso) {
  try { return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return '' }
}

export default function Reviews({ productoId }) {
  const qc = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: qk.reviews(productoId),
    queryFn: () => getReviews(productoId),
    enabled: !!productoId,
  })

  const [nombre, setNombre] = useState('')
  const [rating, setRating] = useState(0)
  const [comentario, setComentario] = useState('')

  const crear = useMutation({
    mutationFn: (payload) => crearReview(productoId, payload),
    onSuccess: (res) => {
      toast.success(res?.mensaje || 'Tu reseña fue enviada. Será publicada tras revisión.')
      setNombre('')
      setRating(0)
      setComentario('')
      qc.invalidateQueries({ queryKey: qk.reviews(productoId) })
    },
    onError: (err) => toast.error(err.message || 'No se pudo enviar la reseña.'),
  })

  function submit(e) {
    e.preventDefault()
    if (nombre.trim().length < 2) { toast.error('Escribe tu nombre (mín. 2 caracteres).'); return }
    if (rating < 1) { toast.error('Elige una calificación de 1 a 5 estrellas.'); return }
    if (comentario.trim().length < 10) { toast.error('Tu comentario debe tener al menos 10 caracteres.'); return }
    crear.mutate({ nombre: nombre.trim(), rating, comentario: comentario.trim() })
  }

  return (
    <section className="mt-12 border-t border-gold-300 pt-10" aria-labelledby="reviews-title">
      <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
        <h2 id="reviews-title" className="font-serif text-2xl text-wine-900">
          Opiniones de <em className="text-wine-600">clientas</em>
        </h2>
        {data?.total > 0 && (
          <div className="flex items-center gap-2">
            <Stars value={Math.round(data.promedio)} />
            <span className="font-sans text-[0.85rem] text-taupe-600">
              {data.promedio} — {data.total} {data.total === 1 ? 'reseña' : 'reseñas'}
            </span>
          </div>
        )}
      </div>

      {/* Listado */}
      {isLoading ? (
        <p className="font-sans text-sm text-taupe-600">Cargando reseñas…</p>
      ) : isError ? (
        <p className="font-sans text-sm text-taupe-600">No se pudieron cargar las reseñas.</p>
      ) : data?.reviews?.length === 0 ? (
        <p className="font-sans text-sm text-taupe-600 italic mb-8">
          Sé la primera en compartir tu opinión sobre esta prenda.
        </p>
      ) : (
        <ul className="space-y-5 mb-10">
          {data.reviews.map((r) => (
            <li key={r.id} className="border-l-2 border-gold-300 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <Stars value={r.rating} size="sm" />
                <span className="font-sans text-[0.75rem] tracking-widest uppercase text-wine-600">
                  {r.nombre}
                </span>
                <span className="font-sans text-[0.7rem] text-taupe-400">· {formatoFecha(r.fecha)}</span>
              </div>
              <p className="font-sans text-[0.88rem] text-taupe-600 leading-relaxed">{r.comentario}</p>
            </li>
          ))}
        </ul>
      )}

      {/* Formulario */}
      <form onSubmit={submit} className="bg-cream-100 border border-gold-300 p-6 max-w-2xl" aria-label="Dejar una reseña">
        <h3 className="font-serif text-lg text-wine-900 mb-1">Comparte tu experiencia</h3>
        <p className="font-sans text-[0.75rem] text-taupe-600 mb-5">
          Tu reseña pasará por una revisión breve antes de publicarse. Solo texto — no subimos imágenes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <label className="block">
            <span className="font-sans text-[0.7rem] tracking-widest uppercase text-taupe-600 block mb-1">Tu nombre</span>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={60}
              required
              className="w-full border border-gold-300 bg-cream-50 px-3 py-2 font-sans text-sm text-wine-900 focus-visible:outline-2 focus-visible:outline-wine-600"
            />
          </label>
          <div>
            <span className="font-sans text-[0.7rem] tracking-widest uppercase text-taupe-600 block mb-1">Calificación</span>
            <Stars value={rating} onChange={setRating} size="lg" ariaLabel="Elige una calificación de 1 a 5 estrellas" />
          </div>
        </div>

        <label className="block mb-4">
          <span className="font-sans text-[0.7rem] tracking-widest uppercase text-taupe-600 block mb-1">Tu opinión</span>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={4}
            minLength={10}
            maxLength={2000}
            required
            className="w-full border border-gold-300 bg-cream-50 px-3 py-2 font-sans text-sm text-wine-900 focus-visible:outline-2 focus-visible:outline-wine-600 resize-y"
            placeholder="Cuéntanos cómo te quedó la talla, qué te pareció la tela, la atención…"
          />
          <span className="font-sans text-[0.65rem] text-taupe-400 mt-1 block">
            {comentario.length}/2000
          </span>
        </label>

        <button
          type="submit"
          disabled={crear.isPending}
          className="bg-wine-600 text-cream-200 px-6 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-wine-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {crear.isPending ? 'Enviando…' : 'Enviar reseña'}
        </button>
      </form>
    </section>
  )
}
