import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPedido } from '../hooks/useApi'
import Seo from '../components/Seo'

const formatPrecio = (cop) => '$' + cop.toLocaleString('es-CO')

const STATUS_META = {
  PENDING:  { label: 'Procesando pago',   color: 'amber',  icon: '⏳', mensaje: 'Tu pago se está procesando. En unos segundos actualizamos el estado.' },
  APPROVED: { label: 'Pago aprobado',     color: 'green',  icon: '✅', mensaje: '¡Gracias! Tu pago fue confirmado. Empezamos a preparar tu pedido.' },
  DECLINED: { label: 'Pago rechazado',    color: 'red',    icon: '❌', mensaje: 'Tu pago fue rechazado. Puedes intentar de nuevo con otro medio de pago.' },
  VOIDED:   { label: 'Pago cancelado',    color: 'taupe',  icon: '🚫', mensaje: 'El pago fue cancelado.' },
  ERROR:    { label: 'Error en el pago',  color: 'red',    icon: '⚠️', mensaje: 'Hubo un error procesando tu pago. Intenta de nuevo o escríbenos por WhatsApp.' },
}

export default function PedidoEstado() {
  const { reference } = useParams()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pedido', reference],
    queryFn: () => getPedido(reference),
    enabled: !!reference,
    // Re-consultar cada 4s mientras el estado sea PENDING (webhook puede tardar)
    refetchInterval: (q) => (q.state.data?.status === 'PENDING' ? 4000 : false),
    retry: 2,
  })

  const meta = data ? (STATUS_META[data.status] || STATUS_META.PENDING) : null
  // Centavos -> COP
  const toCop = (c) => Math.round((c || 0) / 100)

  return (
    <main id="main" className="pt-[70px] min-h-screen bg-cream-50">
      <Seo title="Estado de tu pedido" path={`/pedido/${reference}`} />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {isLoading && (
          <p className="text-center font-serif italic text-gold-500 py-12">Consultando tu pedido…</p>
        )}
        {isError && (
          <div className="text-center py-12">
            <p className="text-6xl mb-3" aria-hidden="true">⚠️</p>
            <h1 className="font-serif text-2xl text-wine-900 mb-2">No encontramos el pedido</h1>
            <p className="font-sans text-sm text-taupe-600 mb-6">
              La referencia <code className="font-mono text-xs">{reference}</code> no existe o expiró.
            </p>
            <Link to="/" className="inline-block bg-wine-600 text-cream-200 px-8 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-wine-800 transition-colors">
              Volver al inicio
            </Link>
          </div>
        )}

        {data && meta && (
          <>
            <div className="text-center mb-8">
              <p className="text-6xl mb-3" aria-hidden="true">{meta.icon}</p>
              <h1 className="font-serif text-2xl sm:text-3xl text-wine-900 mb-2">{meta.label}</h1>
              <p className="font-sans text-sm text-taupe-600 max-w-md mx-auto">{meta.mensaje}</p>
              <p className="font-mono text-[0.7rem] text-taupe-400 mt-3">Ref: {data.reference}</p>
            </div>

            <div className="bg-white border border-gold-300 p-5 mb-5">
              <h2 className="font-serif text-wine-900 text-lg mb-3">Tu pedido</h2>
              <ul className="space-y-3 mb-4">
                {data.items?.map((i, idx) => (
                  <li key={idx} className="flex justify-between gap-3 border-b border-gold-300/40 pb-2 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-wine-900 text-[0.92rem] truncate">{i.nombre}</p>
                      <p className="font-sans text-[0.7rem] text-taupe-600">{i.color} · Talla {i.talla} · x{i.cantidad}</p>
                    </div>
                    <p className="font-sans text-sm font-bold text-wine-600 whitespace-nowrap">
                      {formatPrecio(toCop(i.precio_unitario * i.cantidad))}
                    </p>
                  </li>
                ))}
              </ul>

              <dl className="space-y-1 font-sans text-[0.85rem] pt-3 border-t border-gold-300">
                <div className="flex justify-between"><dt className="text-taupe-600">Subtotal</dt><dd className="text-wine-900">{formatPrecio(toCop(data.subtotal))}</dd></div>
                <div className="flex justify-between"><dt className="text-taupe-600">Envío</dt><dd className="text-wine-900">{data.envio === 0 ? <span className="text-green-700 font-bold">GRATIS</span> : formatPrecio(toCop(data.envio))}</dd></div>
                <div className="flex justify-between pt-2 mt-2 border-t border-gold-300/50">
                  <dt className="font-serif text-wine-900 text-base">Total</dt>
                  <dd className="font-serif text-wine-800 text-lg">{formatPrecio(toCop(data.total))}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white border border-gold-300 p-5 mb-5 text-[0.88rem]">
              <h2 className="font-serif text-wine-900 text-lg mb-2">Envío a</h2>
              <p className="text-taupe-600">{data.nombre}</p>
              <p className="text-taupe-600">{data.direccion}, {data.ciudad}</p>
              <p className="text-taupe-600">{data.telefono} · {data.email}</p>
              {data.estado_envio && data.status === 'APPROVED' && (
                <p className="mt-3 font-sans text-[0.75rem] tracking-widest uppercase text-wine-600">
                  Estado de envío: <strong>{data.estado_envio}</strong>
                  {data.guia_envio && <> · Guía: <code className="font-mono">{data.guia_envio}</code></>}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/" className="bg-wine-600 text-cream-200 px-6 py-2.5 font-sans text-[0.7rem] tracking-widest uppercase hover:bg-wine-800 transition-colors">
                Volver al inicio
              </Link>
              <a
                href={`https://wa.me/573028556022?text=${encodeURIComponent(`Hola! Tengo una pregunta sobre mi pedido ${data.reference}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-wine-600 text-wine-600 px-6 py-2.5 font-sans text-[0.7rem] tracking-widest uppercase hover:bg-wine-600 hover:text-cream-200 transition-colors"
              >
                Preguntar por WhatsApp
              </a>
              {data.status === 'PENDING' && (
                <button
                  onClick={() => refetch()}
                  className="font-sans text-[0.7rem] tracking-widest uppercase text-wine-600 underline hover:text-wine-800 transition-colors self-center"
                >
                  Actualizar
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
