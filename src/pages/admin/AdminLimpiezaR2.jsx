import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getOrphansR2, cleanupR2 } from '../../hooks/useAdmin'

const IMAGES_BASE = 'https://images.intimaexclusive.com'

function formatBytes(b) {
  if (!b) return '0 B'
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(2)} MB`
}

function formatFecha(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '—' }
}

export default function AdminLimpiezaR2() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const [seleccionadas, setSeleccionadas] = useState(new Set())

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'r2-orphans'],
    queryFn: getOrphansR2,
  })

  const limpiar = useMutation({
    mutationFn: cleanupR2,
    onSuccess: (res) => {
      let msg = `${res.eliminadas} archivo${res.eliminadas === 1 ? '' : 's'} eliminado${res.eliminadas === 1 ? '' : 's'}`
      if (res.protegidas > 0) msg += ` · ${res.protegidas} protegido${res.protegidas === 1 ? '' : 's'}`
      if (res.fallidas > 0) msg += ` · ${res.fallidas} fallaron`
      toast.success(msg)
      setSeleccionadas(new Set())
      qc.invalidateQueries({ queryKey: ['admin', 'r2-orphans'] })
    },
    onError: (err) => toast.error(err.message || 'No se pudo limpiar'),
  })

  const orphans = data?.orphans || []
  const todasSeleccionadas = orphans.length > 0 && seleccionadas.size === orphans.length

  function toggleTodas() {
    if (todasSeleccionadas) setSeleccionadas(new Set())
    else setSeleccionadas(new Set(orphans.map((o) => o.key)))
  }

  function toggleUna(key) {
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function eliminarSeleccionadas() {
    if (seleccionadas.size === 0) return
    if (!confirm(`Eliminar ${seleccionadas.size} archivo${seleccionadas.size === 1 ? '' : 's'} PERMANENTEMENTE de R2? Esta acción no se puede deshacer.`)) return
    const keys = Array.from(seleccionadas).slice(0, 500)
    limpiar.mutate(keys)
  }

  const tamanoSeleccionado = orphans
    .filter((o) => seleccionadas.has(o.key))
    .reduce((s, o) => s + (o.size || 0), 0)

  return (
    <main className="min-h-screen bg-cream-100 pt-[70px]">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-2xl text-wine-800">Limpieza de almacenamiento</h1>
            <p className="font-sans text-[0.75rem] text-taupe-600 mt-1">
              Archivos en R2 que ya no están referenciados por ningún producto.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="border border-gold-300 text-taupe-600 px-4 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 disabled:opacity-50 transition-colors"
            >
              {isFetching ? 'Buscando…' : 'Actualizar'}
            </button>
            <button
              onClick={() => nav('/admin')}
              className="border border-gold-300 text-taupe-600 px-4 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors"
            >
              ← Panel
            </button>
          </div>
        </div>

        {/* Resumen */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gold-300 p-4">
              <p className="font-sans text-[0.6rem] tracking-widest uppercase text-taupe-400 mb-1">En R2</p>
              <p className="font-serif text-2xl text-wine-600">{data.totalR2}</p>
            </div>
            <div className="bg-white border border-gold-300 p-4">
              <p className="font-sans text-[0.6rem] tracking-widest uppercase text-taupe-400 mb-1">Referenciadas</p>
              <p className="font-serif text-2xl text-wine-600">{data.referenciadas}</p>
            </div>
            <div className="bg-white border border-gold-300 p-4">
              <p className="font-sans text-[0.6rem] tracking-widest uppercase text-taupe-400 mb-1">Huérfanas</p>
              <p className="font-serif text-2xl text-wine-600">{orphans.length}</p>
            </div>
            <div className="bg-white border border-gold-300 p-4">
              <p className="font-sans text-[0.6rem] tracking-widest uppercase text-taupe-400 mb-1">Espacio a liberar</p>
              <p className="font-serif text-2xl text-wine-600">{formatBytes(data.totalSize)}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="font-serif italic text-gold-500 text-center py-12">Analizando almacenamiento…</p>
        ) : orphans.length === 0 ? (
          <div className="bg-white border border-gold-300 p-8 text-center">
            <p className="font-serif text-gold-500 text-3xl mb-2" aria-hidden="true">✨</p>
            <p className="font-sans text-[0.88rem] text-taupe-600">
              No hay archivos huérfanos. Tu almacenamiento está limpio.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gold-300 mb-4 px-4 py-3 flex items-center justify-between flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer font-sans text-[0.72rem] text-wine-900">
                <input
                  type="checkbox"
                  checked={todasSeleccionadas}
                  onChange={toggleTodas}
                  className="accent-wine-600 w-4 h-4"
                />
                {todasSeleccionadas ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-sans text-[0.72rem] text-taupe-600">
                  {seleccionadas.size} seleccionada{seleccionadas.size === 1 ? '' : 's'}
                  {seleccionadas.size > 0 && ` · ${formatBytes(tamanoSeleccionado)}`}
                </span>
                <button
                  onClick={eliminarSeleccionadas}
                  disabled={seleccionadas.size === 0 || limpiar.isPending}
                  className="bg-red-500 text-white px-5 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {limpiar.isPending ? 'Eliminando…' : 'Eliminar seleccionadas'}
                </button>
              </div>
            </div>

            <div className="bg-white border border-gold-300 overflow-hidden">
              <ul>
                {orphans.map((o) => (
                  <li key={o.key} className="flex items-center gap-3 px-4 py-2 border-b border-cream-200 last:border-0 hover:bg-cream-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={seleccionadas.has(o.key)}
                      onChange={() => toggleUna(o.key)}
                      aria-label={`Seleccionar ${o.key}`}
                      className="accent-wine-600 w-4 h-4"
                    />
                    <a
                      href={`${IMAGES_BASE}/${o.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 font-mono text-[0.72rem] text-wine-900 hover:text-wine-600 truncate transition-colors"
                    >
                      {o.key}
                    </a>
                    <span className="font-sans text-[0.7rem] text-taupe-600 w-20 text-right shrink-0">
                      {formatBytes(o.size)}
                    </span>
                    <span className="font-sans text-[0.65rem] text-taupe-400 w-24 text-right shrink-0 hidden sm:block">
                      {formatFecha(o.uploaded)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="font-sans text-[0.7rem] text-taupe-400 mt-4 text-center">
              💡 Antes de eliminar, puedes click en cada archivo para previsualizarlo. El servidor verifica antes de borrar que el archivo no esté referenciado por ningún producto (protección contra errores).
            </p>
          </>
        )}
      </div>
    </main>
  )
}
