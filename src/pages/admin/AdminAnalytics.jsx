import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts'
import { getAnalytics } from '../../hooks/useAdmin'
import { downloadCsv } from '../../lib/csvExport'

const RANGOS = [
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: '90d', label: '90 días' },
]

const COLORS_DONUT = ['#7B1A2E', '#C4A882', '#A03048', '#D9C4A8', '#4E0F1C']

function formatFecha(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function KpiCard({ label, valor, comparacion, signo }) {
  const color = comparacion > 0 ? 'text-green-700' : comparacion < 0 ? 'text-red-600' : 'text-taupe-400'
  const flecha = comparacion > 0 ? '▲' : comparacion < 0 ? '▼' : '—'
  return (
    <div className="bg-white border border-gold-300 p-5">
      <p className="font-sans text-[0.62rem] tracking-widest uppercase text-taupe-400 mb-1">{label}</p>
      <p className="font-serif text-3xl text-wine-600">{valor.toLocaleString('es-CO')}</p>
      {comparacion !== undefined && (
        <p className={`font-sans text-[0.7rem] mt-1 ${color}`}>
          <span aria-hidden="true">{flecha}</span> {Math.abs(comparacion)}% {signo || 'vs período anterior'}
        </p>
      )}
    </div>
  )
}

export default function AdminAnalytics() {
  const nav = useNavigate()
  const [rango, setRango] = useState('30d')

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'analytics', rango],
    queryFn: () => getAnalytics(rango),
    refetchInterval: 600_000, // 10 min
  })

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100">
      <p className="font-serif italic text-gold-500">Cargando analytics…</p>
    </div>
  )
  if (!data) return null

  const visitasDia = data.visitasPorDia.map((d) => ({ fecha: d.fecha, label: formatFecha(d.fecha), total: d.total }))
  const totalDispositivos = data.visitasPorDispositivo.reduce((s, d) => s + d.total, 0)

  function exportarVisitas() {
    downloadCsv(
      `visitas-${rango}-${new Date().toISOString().split('T')[0]}.csv`,
      [{ key: 'fecha', label: 'Fecha' }, { key: 'total', label: 'Visitas' }],
      data.visitasPorDia,
    )
  }

  function exportarTopProductos() {
    downloadCsv(
      `top-productos-${rango}-${new Date().toISOString().split('T')[0]}.csv`,
      [
        { key: 'id', label: 'ID' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'categoria_id', label: 'Categoría' },
        { key: 'visitas', label: 'Visitas' },
      ],
      data.productosMasVistos,
    )
  }

  function exportarCategorias() {
    downloadCsv(
      `visitas-categorias-${rango}-${new Date().toISOString().split('T')[0]}.csv`,
      [{ key: 'categoria', label: 'Categoría' }, { key: 'total', label: 'Visitas' }],
      data.visitasPorCategoria,
    )
  }

  return (
    <main className="min-h-screen bg-cream-100 pt-[70px]">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl text-wine-800">Analytics</h1>
            <p className="font-sans text-[0.75rem] text-taupe-600 tracking-wide mt-1">
              Visitas y comportamiento de tus clientas
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex border border-gold-300" role="tablist" aria-label="Rango de fechas">
              {RANGOS.map((r) => (
                <button
                  key={r.value}
                  role="tab"
                  aria-selected={rango === r.value}
                  onClick={() => setRango(r.value)}
                  className={`px-4 py-2 font-sans text-[0.68rem] tracking-widest uppercase transition-colors ${rango === r.value
                    ? 'bg-wine-600 text-cream-200'
                    : 'text-taupe-600 hover:text-wine-600'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="border border-gold-300 text-taupe-600 px-4 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 disabled:opacity-50 transition-colors"
            >
              {isFetching ? 'Actualizando…' : 'Actualizar'}
            </button>
            <button
              onClick={() => nav('/admin')}
              className="border border-gold-300 text-taupe-600 px-4 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors"
            >
              ← Panel
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard label="Visitas totales" valor={data.totalVisitas} />
          <KpiCard label="Visitas hoy" valor={data.visitasHoy} />
          <KpiCard
            label={`Visitas ${rango}`}
            valor={data.visitasRango}
            comparacion={data.cambioPorcentual}
          />
          <KpiCard label="Productos con visitas" valor={data.productosMasVistos.filter((p) => p.visitas > 0).length} />
        </div>

        {/* Visitas por día — gráfica de área */}
        <section className="bg-white border border-gold-300 mb-6">
          <div className="px-6 py-4 border-b border-gold-300 flex items-center justify-between">
            <h2 className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-600">
              Visitas por día
            </h2>
            <button
              onClick={exportarVisitas}
              className="font-sans text-[0.6rem] tracking-widest uppercase text-wine-600 hover:text-wine-800 transition-colors"
            >
              Exportar a Excel
            </button>
          </div>
          <div className="p-4">
            {visitasDia.length === 0 ? (
              <p className="font-sans text-[0.82rem] text-taupe-400 italic text-center py-12">Sin datos aún.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={visitasDia} margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                  <defs>
                    <linearGradient id="wineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7B1A2E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7B1A2E" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D9C4A8" />
                  <XAxis dataKey="label" tick={{ fill: '#7A5A60', fontSize: 11 }} stroke="#D9C4A8" />
                  <YAxis tick={{ fill: '#7A5A60', fontSize: 11 }} stroke="#D9C4A8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#FFFDF9', border: '1px solid #D9C4A8', fontFamily: 'inherit', fontSize: '0.8rem' }}
                    labelStyle={{ color: '#3A1A20' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#7B1A2E"
                    strokeWidth={2}
                    fill="url(#wineGradient)"
                    name="Visitas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top productos — barras horizontales */}
          <section className="bg-white border border-gold-300">
            <div className="px-6 py-4 border-b border-gold-300 flex items-center justify-between">
              <h2 className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-600">
                Productos más vistos
              </h2>
              <button
                onClick={exportarTopProductos}
                className="font-sans text-[0.6rem] tracking-widest uppercase text-wine-600 hover:text-wine-800 transition-colors"
              >
                Exportar
              </button>
            </div>
            <div className="p-4">
              {data.productosMasVistos.length === 0 || data.productosMasVistos.every((p) => p.visitas === 0) ? (
                <p className="font-sans text-[0.82rem] text-taupe-400 italic text-center py-8">Sin visitas en este período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(240, data.productosMasVistos.length * 32)}>
                  <BarChart
                    layout="vertical"
                    data={data.productosMasVistos.filter((p) => p.visitas > 0).slice(0, 10)}
                    margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#D9C4A8" />
                    <XAxis type="number" tick={{ fill: '#7A5A60', fontSize: 11 }} stroke="#D9C4A8" allowDecimals={false} />
                    <YAxis type="category" dataKey="nombre" tick={{ fill: '#3A1A20', fontSize: 11 }} stroke="#D9C4A8" width={110} />
                    <Tooltip
                      contentStyle={{ background: '#FFFDF9', border: '1px solid #D9C4A8', fontFamily: 'inherit', fontSize: '0.8rem' }}
                    />
                    <Bar dataKey="visitas" fill="#7B1A2E" name="Visitas" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Dispositivos — donut */}
          <section className="bg-white border border-gold-300">
            <div className="px-6 py-4 border-b border-gold-300">
              <h2 className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-600">
                Dispositivos
              </h2>
            </div>
            <div className="p-4">
              {data.visitasPorDispositivo.length === 0 ? (
                <p className="font-sans text-[0.82rem] text-taupe-400 italic text-center py-8">Sin datos.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={data.visitasPorDispositivo}
                      dataKey="total"
                      nameKey="dispositivo"
                      cx="50%" cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      label={(e) => `${e.dispositivo} (${Math.round((e.total / totalDispositivos) * 100)}%)`}
                      labelLine={false}
                    >
                      {data.visitasPorDispositivo.map((_, i) => (
                        <Cell key={i} fill={COLORS_DONUT[i % COLORS_DONUT.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#FFFDF9', border: '1px solid #D9C4A8', fontFamily: 'inherit', fontSize: '0.8rem' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </div>

        {/* Categorías */}
        <section className="bg-white border border-gold-300">
          <div className="px-6 py-4 border-b border-gold-300 flex items-center justify-between">
            <h2 className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-600">
              Visitas por categoría
            </h2>
            <button
              onClick={exportarCategorias}
              className="font-sans text-[0.6rem] tracking-widest uppercase text-wine-600 hover:text-wine-800 transition-colors"
            >
              Exportar
            </button>
          </div>
          <div className="p-4">
            {data.visitasPorCategoria.length === 0 ? (
              <p className="font-sans text-[0.82rem] text-taupe-400 italic text-center py-8">Sin datos en este período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.visitasPorCategoria} margin={{ top: 10, right: 20, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D9C4A8" />
                  <XAxis dataKey="categoria" tick={{ fill: '#3A1A20', fontSize: 11 }} stroke="#D9C4A8" />
                  <YAxis tick={{ fill: '#7A5A60', fontSize: 11 }} stroke="#D9C4A8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#FFFDF9', border: '1px solid #D9C4A8', fontFamily: 'inherit', fontSize: '0.8rem' }}
                  />
                  <Bar dataKey="total" fill="#C4A882" name="Visitas" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
