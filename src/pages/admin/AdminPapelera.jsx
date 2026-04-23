import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getPapelera, restaurarProducto, borrarPermanente } from '../../hooks/useAdmin'

function formatoFecha(iso) {
  try { return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

export default function AdminPapelera() {
  const nav = useNavigate()
  const qc = useQueryClient()

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin', 'papelera'],
    queryFn: getPapelera,
  })

  const restaurar = useMutation({
    mutationFn: restaurarProducto,
    onSuccess: () => {
      toast.success('Producto restaurado')
      qc.invalidateQueries({ queryKey: ['admin', 'papelera'] })
      qc.invalidateQueries({ queryKey: ['admin', 'productos'] })
    },
    onError: (err) => toast.error(err.message || 'No se pudo restaurar'),
  })

  const borrar = useMutation({
    mutationFn: borrarPermanente,
    onSuccess: () => {
      toast.success('Producto eliminado permanentemente')
      qc.invalidateQueries({ queryKey: ['admin', 'papelera'] })
    },
    onError: (err) => toast.error(err.message || 'No se pudo eliminar'),
  })

  return (
    <main className="min-h-screen bg-cream-100 pt-[70px]">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-2xl text-wine-800">Papelera</h1>
            <p className="font-sans text-[0.75rem] text-taupe-600 mt-1">
              Productos eliminados. Puedes restaurarlos o eliminarlos permanentemente.
            </p>
          </div>
          <button
            onClick={() => nav('/admin')}
            className="border border-gold-300 text-taupe-600 px-6 py-2.5 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors"
          >
            ← Volver al panel
          </button>
        </div>

        {isLoading ? (
          <p className="font-serif italic text-gold-500 text-center py-12">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="bg-white border border-gold-300 p-8 text-center">
            <p className="font-sans text-[0.85rem] text-taupe-400 italic">
              La papelera está vacía.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gold-300">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold-300">
                  {['Nombre', 'Categoría', 'Precio', 'Eliminado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-sans text-[0.62rem] tracking-widest uppercase text-taupe-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-cream-200 hover:bg-cream-100 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-serif text-wine-900 text-sm">{p.nombre}</p>
                      <p className="font-sans text-[0.62rem] text-taupe-400 mt-0.5">{p.id}</p>
                    </td>
                    <td className="px-4 py-3 font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600">
                      {p.categoria_id}
                    </td>
                    <td className="px-4 py-3 font-sans text-sm font-bold text-wine-600">
                      ${p.precio.toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3 font-sans text-[0.7rem] text-taupe-600">
                      {formatoFecha(p.deleted_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => restaurar.mutate(p.id)}
                          disabled={restaurar.isPending}
                          className="border border-wine-600 text-wine-600 px-3 py-1.5 font-sans text-[0.6rem] tracking-widest uppercase hover:bg-wine-600 hover:text-cream-200 disabled:opacity-50 transition-colors"
                        >
                          Restaurar
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Eliminar "${p.nombre}" PERMANENTEMENTE? Esta acción no se puede deshacer y borra también sus imágenes del almacenamiento.`)) {
                              borrar.mutate(p.id)
                            }
                          }}
                          disabled={borrar.isPending}
                          className="border border-red-200 text-red-500 px-3 py-1.5 font-sans text-[0.6rem] tracking-widest uppercase hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          Borrar siempre
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
