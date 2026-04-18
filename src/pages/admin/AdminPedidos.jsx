import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getAdminPedidos, getAdminPedido, actualizarEnvio } from '../../hooks/useAdmin'
import { downloadCsv } from '../../lib/csvExport'

const formatCop = (cents) => '$' + Math.round(cents / 100).toLocaleString('es-CO')

function fecha(iso) {
  try {
    return new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

const STATUS_STYLES = {
  PENDING:  'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  DECLINED: 'bg-red-100 text-red-800',
  VOIDED:   'bg-gray-100 text-gray-800',
  ERROR:    'bg-red-100 text-red-800',
}
const ENVIO_ESTADOS = ['preparando', 'enviado', 'entregado', 'cancelado']

export default function AdminPedidos() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [envioFilter, setEnvioFilter] = useState('all')
  const [detalleRef, setDetalleRef] = useState(null)

  const { data: pedidos = [], isLoading, refetch } = useQuery({
    queryKey: ['admin', 'pedidos', statusFilter, envioFilter],
    queryFn: () => getAdminPedidos({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      estado_envio: envioFilter !== 'all' ? envioFilter : undefined,
    }),
    refetchInterval: 60_000, // refresca cada minuto
  })

  const approvedCount = pedidos.filter((p) => p.status === 'APPROVED').length
  const pendingCount = pedidos.filter((p) => p.status === 'PENDING').length

  function exportar() {
    downloadCsv(
      `pedidos-${new Date().toISOString().split('T')[0]}.csv`,
      [
        { key: 'reference', label: 'Referencia' },
        { key: 'creado_at', label: 'Fecha' },
        { key: 'nombre', label: 'Cliente' },
        { key: 'email', label: 'Email' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'ciudad', label: 'Ciudad' },
        { key: 'status', label: 'Estado pago' },
        { key: 'estado_envio', label: 'Estado envío' },
        { key: 'total_formatted', label: 'Total' },
      ],
      pedidos.map((p) => ({ ...p, total_formatted: formatCop(p.total) })),
    )
  }

  return (
    <main className="min-h-screen bg-cream-100 pt-[70px]">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl text-wine-800">Pedidos</h1>
            <p className="font-sans text-[0.75rem] text-taupe-600 mt-1">
              {approvedCount} aprobados · {pendingCount} pendientes · {pedidos.length} en vista
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportar} className="border border-gold-300 text-taupe-600 px-4 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
              Exportar CSV
            </button>
            <button onClick={() => refetch()} className="border border-gold-300 text-taupe-600 px-4 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
              Actualizar
            </button>
            <button onClick={() => nav('/admin')} className="border border-gold-300 text-taupe-600 px-4 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
              ← Panel
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-5 flex-wrap font-sans text-[0.7rem]">
          <label className="flex items-center gap-2">
            <span className="tracking-widest uppercase text-taupe-600">Pago:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gold-300 bg-white px-3 py-1.5 text-wine-900"
            >
              <option value="all">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="APPROVED">Aprobado</option>
              <option value="DECLINED">Rechazado</option>
              <option value="VOIDED">Cancelado</option>
              <option value="ERROR">Error</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="tracking-widest uppercase text-taupe-600">Envío:</span>
            <select
              value={envioFilter}
              onChange={(e) => setEnvioFilter(e.target.value)}
              className="border border-gold-300 bg-white px-3 py-1.5 text-wine-900"
            >
              <option value="all">Todos</option>
              {ENVIO_ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </label>
        </div>

        {isLoading ? (
          <p className="font-serif italic text-gold-500 text-center py-12">Cargando…</p>
        ) : pedidos.length === 0 ? (
          <div className="bg-white border border-gold-300 p-8 text-center">
            <p className="font-sans text-[0.85rem] text-taupe-400 italic">Sin pedidos en esta vista.</p>
          </div>
        ) : (
          <div className="bg-white border border-gold-300 overflow-x-auto">
            <table className="w-full text-[0.8rem]">
              <thead>
                <tr className="border-b border-gold-300 text-left">
                  {['Ref', 'Fecha', 'Cliente', 'Ciudad', 'Total', 'Pago', 'Envío', ''].map((h) => (
                    <th key={h} className="px-3 py-2 font-sans text-[0.6rem] tracking-widest uppercase text-taupe-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.reference} className="border-b border-cream-200 hover:bg-cream-100 transition-colors">
                    <td className="px-3 py-2 font-mono text-[0.7rem] text-wine-900">{p.reference.slice(0, 18)}…</td>
                    <td className="px-3 py-2 text-taupe-600">{fecha(p.creado_at)}</td>
                    <td className="px-3 py-2">
                      <p className="font-serif text-wine-900">{p.nombre}</p>
                      <p className="font-sans text-[0.65rem] text-taupe-400">{p.email}</p>
                    </td>
                    <td className="px-3 py-2 text-taupe-600">{p.ciudad}</td>
                    <td className="px-3 py-2 font-sans font-bold text-wine-600">{formatCop(p.total)}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-0.5 text-[0.6rem] tracking-widest uppercase ${STATUS_STYLES[p.status] || ''}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 capitalize text-taupe-600">{p.estado_envio}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => setDetalleRef(p.reference)} className="border border-wine-600 text-wine-600 px-3 py-1 font-sans text-[0.6rem] tracking-widest uppercase hover:bg-wine-600 hover:text-cream-200 transition-colors">
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {detalleRef && <PedidoDetalle reference={detalleRef} onClose={() => setDetalleRef(null)} qc={qc} />}
      </div>
    </main>
  )
}

function PedidoDetalle({ reference, onClose, qc }) {
  const { data: pedido, isLoading } = useQuery({
    queryKey: ['admin', 'pedido', reference],
    queryFn: () => getAdminPedido(reference),
  })

  const actualizar = useMutation({
    mutationFn: (data) => actualizarEnvio(reference, data),
    onSuccess: () => {
      toast.success('Envío actualizado')
      qc.invalidateQueries({ queryKey: ['admin', 'pedidos'] })
      qc.invalidateQueries({ queryKey: ['admin', 'pedido', reference] })
    },
    onError: (err) => toast.error(err.message),
  })

  const [guia, setGuia] = useState('')

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-wine-900/70" aria-hidden="true" />
      <div className="relative bg-cream-50 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <header className="sticky top-0 bg-cream-50 border-b border-gold-300 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg text-wine-900">Pedido</h2>
            <p className="font-mono text-[0.7rem] text-taupe-400">{reference}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="w-9 h-9 flex items-center justify-center text-wine-900 hover:bg-cream-200 transition-colors">✕</button>
        </header>
        {isLoading ? (
          <p className="text-center py-10 font-serif italic text-gold-500">Cargando…</p>
        ) : pedido && (
          <div className="px-6 py-5 space-y-5 font-sans text-[0.85rem] text-taupe-600">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className={`inline-block px-2 py-1 text-[0.6rem] tracking-widest uppercase ${STATUS_STYLES[pedido.status] || ''}`}>{pedido.status}</span>
              <span className="text-wine-900 font-bold text-base">{formatCop(pedido.total)}</span>
            </div>
            <section>
              <h3 className="font-serif text-wine-800 text-base mb-2">Cliente</h3>
              <p>{pedido.nombre}</p>
              <p>{pedido.email} · {pedido.telefono}</p>
              <p>{pedido.direccion}, {pedido.ciudad}</p>
            </section>
            <section>
              <h3 className="font-serif text-wine-800 text-base mb-2">Items</h3>
              <ul className="space-y-2">
                {pedido.items?.map((i, idx) => (
                  <li key={idx} className="flex justify-between border-b border-gold-300/50 pb-2">
                    <div>
                      <p className="text-wine-900 font-serif">{i.nombre}</p>
                      <p className="text-[0.7rem] text-taupe-600">{i.color} · Talla {i.talla} · x{i.cantidad}</p>
                    </div>
                    <p className="font-bold text-wine-600">{formatCop(i.precio_unitario * i.cantidad)}</p>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="font-serif text-wine-800 text-base mb-2">Envío</h3>
              <p className="mb-3">Estado actual: <strong className="capitalize">{pedido.estado_envio}</strong>{pedido.guia_envio && <> · Guía: <code className="font-mono text-xs">{pedido.guia_envio}</code></>}</p>
              <div className="bg-cream-100 border border-gold-300 p-3 space-y-2">
                <input
                  type="text"
                  placeholder="Número de guía (opcional)"
                  value={guia}
                  onChange={(e) => setGuia(e.target.value)}
                  className="w-full border border-gold-300 bg-cream-50 px-3 py-2 text-sm text-wine-900 focus-visible:outline-2 focus-visible:outline-wine-600"
                />
                <div className="flex gap-2 flex-wrap">
                  {ENVIO_ESTADOS.map((e) => (
                    <button
                      key={e}
                      disabled={actualizar.isPending}
                      onClick={() => actualizar.mutate({ estado_envio: e, guia_envio: guia || pedido.guia_envio || null })}
                      className="border border-wine-600 text-wine-600 px-3 py-1 font-sans text-[0.65rem] tracking-widest uppercase hover:bg-wine-600 hover:text-cream-200 disabled:opacity-50 transition-colors capitalize"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </section>
            <section className="pt-3 border-t border-gold-300">
              <a
                href={`https://wa.me/${pedido.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${pedido.nombre}, te contacto por tu pedido ${reference} en Íntima Exclusive.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-whatsapp-500 text-white px-4 py-2 font-sans text-[0.65rem] tracking-widest uppercase hover:opacity-90 transition-opacity"
              >
                📲 Contactar cliente
              </a>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
