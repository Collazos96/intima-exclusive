import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAdminSuscriptores } from '../../hooks/useAdmin'
import { downloadCsv } from '../../lib/csvExport'

function fecha(iso) {
  try { return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '—' }
}

export default function AdminSuscriptores() {
  const nav = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'suscriptores'],
    queryFn: getAdminSuscriptores,
  })
  const lista = data?.suscriptores || []

  function exportar() {
    const activos = lista.filter((s) => s.activo)
    downloadCsv(
      `suscriptores-${new Date().toISOString().split('T')[0]}.csv`,
      [
        { key: 'email', label: 'Email' },
        { key: 'suscrito_at', label: 'Fecha suscripción' },
        { key: 'fuente', label: 'Fuente' },
        { key: 'cupon_codigo', label: 'Cupón' },
      ],
      activos,
    )
  }

  return (
    <main className="min-h-screen bg-cream-100 pt-[70px]">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl text-wine-800">Suscriptores</h1>
            <p className="font-sans text-[0.75rem] text-taupe-600 mt-1">
              {data?.activos ?? 0} activos · {data?.total ?? 0} total
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportar} disabled={!lista.some((s) => s.activo)} className="border border-gold-300 text-taupe-600 px-4 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 disabled:opacity-50 transition-colors">
              Exportar CSV (activos)
            </button>
            <button onClick={() => nav('/admin')} className="border border-gold-300 text-taupe-600 px-4 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
              ← Panel
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="font-serif italic text-gold-500 text-center py-10">Cargando…</p>
        ) : lista.length === 0 ? (
          <div className="bg-white border border-gold-300 p-8 text-center">
            <p className="font-serif text-gold-500 text-3xl mb-3" aria-hidden="true">💌</p>
            <p className="font-sans text-[0.85rem] text-taupe-600">
              Aún no hay suscriptoras. Cuando alguien se suscriba desde la home, aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gold-300 overflow-x-auto">
            <table className="w-full text-[0.82rem]">
              <thead>
                <tr className="border-b border-gold-300 text-left">
                  {['Email', 'Fecha', 'Fuente', 'Cupón', 'Estado'].map((h) => (
                    <th key={h} className="px-3 py-2 font-sans text-[0.6rem] tracking-widest uppercase text-taupe-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map((s) => (
                  <tr key={s.email} className="border-b border-cream-200 hover:bg-cream-100 transition-colors">
                    <td className="px-3 py-2 font-mono text-[0.78rem] text-wine-900">{s.email}</td>
                    <td className="px-3 py-2 text-taupe-600">{fecha(s.suscrito_at)}</td>
                    <td className="px-3 py-2 text-taupe-600">{s.fuente || '—'}</td>
                    <td className="px-3 py-2 font-mono text-[0.75rem] text-taupe-600">{s.cupon_codigo || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-0.5 text-[0.6rem] tracking-widest uppercase ${s.activo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        {s.activo ? 'Activo' : 'Dado de baja'}
                      </span>
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
