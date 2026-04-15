import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAnalytics, isAuthenticated } from '../../hooks/useAdmin'

export default function AdminAnalytics() {
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      nav('/admin/login')
      return
    }
    async function cargar() {
      const resultado = await getAnalytics()
      setData(resultado)
      setLoading(false)
    }
    cargar()
    const intervalo = setInterval(cargar, 600000) // Actualizar cada 10 minutos (600,000 ms)

    return () => clearInterval(intervalo)
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100">
      <p className="font-serif italic text-gold-500">Cargando analytics...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-cream-100 pt-[70px]">
      <div className="max-w-6xl mx-auto px-8 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl text-wine-800">Analytics</h1>
            <p className="font-sans text-[0.75rem] text-taupe-600 tracking-wide mt-1">Visitas y productos mas vistos</p>
          </div>
          <button
            onClick={() => nav('/admin')}
            className="border border-gold-300 text-taupe-600 px-5 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
            Volver al panel
          </button>
        </div>

        {/* STATS GENERALES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            ['Total visitas', data.totalVisitas],
            ['Visitas hoy', data.visitasHoy],
            ['Productos', data.productosMasVistos.length],
            ['Dispositivos', data.visitasPorDispositivo.length],
          ].map(([label, valor]) => (
            <div key={label} className="bg-white border border-gold-300 p-5">
              <p className="font-sans text-[0.62rem] tracking-widest uppercase text-taupe-400 mb-1">{label}</p>
              <p className="font-serif text-3xl text-wine-600">{valor}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* PRODUCTOS MAS VISTOS */}
          <div className="bg-white border border-gold-300">
            <div className="px-6 py-4 border-b border-gold-300">
              <h2 className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-600">Productos mas vistos</h2>
            </div>
            <div className="divide-y divide-cream-200">
              {data.productosMasVistos.length === 0 ? (
                <p className="px-6 py-8 font-sans text-[0.82rem] text-taupe-400 italic text-center">Sin datos aun.</p>
              ) : (
                data.productosMasVistos.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-gold-500 text-lg w-6">{i + 1}</span>
                      <div>
                        <p className="font-serif text-wine-900 text-sm">{p.nombre}</p>
                        <p className="font-sans text-[0.62rem] tracking-widest uppercase text-taupe-400">{p.categoria_id}</p>
                      </div>
                    </div>
                    <span className="font-sans text-sm font-bold text-wine-600">{p.visitas} visitas</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* VISITAS POR DISPOSITIVO */}
          <div className="bg-white border border-gold-300">
            <div className="px-6 py-4 border-b border-gold-300">
              <h2 className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-600">Visitas por dispositivo</h2>
            </div>
            <div className="divide-y divide-cream-200">
              {data.visitasPorDispositivo.length === 0 ? (
                <p className="px-6 py-8 font-sans text-[0.82rem] text-taupe-400 italic text-center">Sin datos aun.</p>
              ) : (
                data.visitasPorDispositivo.map(d => (
                  <div key={d.dispositivo} className="flex items-center justify-between px-6 py-4">
                    <span className="font-sans text-[0.72rem] tracking-widest uppercase text-taupe-600 capitalize">{d.dispositivo}</span>
                    <span className="font-sans text-sm font-bold text-wine-600">{d.total} visitas</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* VISITAS POR DIA */}
        <div className="bg-white border border-gold-300">
          <div className="px-6 py-4 border-b border-gold-300">
            <h2 className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-600">Visitas por dia - ultimos 30 dias</h2>
          </div>
          <div className="px-6 py-4">
            {data.visitasPorDia.length === 0 ? (
              <p className="font-sans text-[0.82rem] text-taupe-400 italic text-center py-8">Sin datos aun.</p>
            ) : (
              <div className="space-y-2">
                {data.visitasPorDia.map(d => {
                  const max = Math.max(...data.visitasPorDia.map(x => x.total))
                  const pct = Math.round((d.total / max) * 100)
                  return (
                    <div key={d.fecha} className="flex items-center gap-4">
                      <span className="font-sans text-[0.65rem] text-taupe-400 w-24 shrink-0">{d.fecha}</span>
                      <div className="flex-1 bg-cream-200 h-5">
                        <div className="bg-wine-600 h-5 transition-all" style={{ width: `${pct}%` }}/>
                      </div>
                      <span className="font-sans text-[0.72rem] font-bold text-wine-600 w-8 text-right">{d.total}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}