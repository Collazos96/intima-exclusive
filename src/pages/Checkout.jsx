import { useState, useEffect, useRef } from 'react' // useEffect ya importado
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { useCart } from '../lib/cartStore'
import { crearPedido, getConfig, validarCuponApi } from '../hooks/useApi'
import Seo from '../components/Seo'
import Img from '../components/Img'

const WOMPI_WIDGET_SRC = 'https://checkout.wompi.co/widget.js'
const ENVIO_GRATIS_DESDE_DEFAULT = 250_000
const TARIFA_ENVIO_DEFAULT = 15_000

const formatPrecio = (cop) => '$' + cop.toLocaleString('es-CO')

/**
 * Carga el script del widget de Wompi una sola vez.
 */
function useWompiWidget() {
  const [ready, setReady] = useState(() => typeof window !== 'undefined' && !!window.WidgetCheckout)
  useEffect(() => {
    if (ready) return
    if (typeof window === 'undefined') return
    const existing = document.querySelector(`script[src="${WOMPI_WIDGET_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => setReady(true))
      return
    }
    const script = document.createElement('script')
    script.src = WOMPI_WIDGET_SRC
    script.async = true
    script.onload = () => setReady(true)
    document.body.appendChild(script)
  }, [ready])
  return ready
}

export default function Checkout() {
  const nav = useNavigate()
  const items = useCart((s) => s.items)
  const totalItems = useCart((s) => s.totalItems())
  const totalPrecio = useCart((s) => s.totalPrecio())
  const clear = useCart((s) => s.clear)
  const widgetReady = useWompiWidget()

  // Config de envío desde backend (permite cambiar sin rebuild del frontend)
  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
    staleTime: 5 * 60_000,
  })
  const ENVIO_GRATIS_DESDE = config?.envio?.gratis_desde ?? ENVIO_GRATIS_DESDE_DEFAULT
  const TARIFA_ENVIO = config?.envio?.tarifa ?? TARIFA_ENVIO_DEFAULT

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    documento_tipo: 'CC',
    documento_numero: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    codigo_postal: '',
    notas: '',
  })
  const [enviando, setEnviando] = useState(false)
  const submittedRef = useRef(false)

  // Cupón
  const [cuponInput, setCuponInput] = useState('')
  const [cuponAplicado, setCuponAplicado] = useState(null)
  const [cuponValidando, setCuponValidando] = useState(false)
  const [cuponError, setCuponError] = useState('')

  const subtotal = totalPrecio
  const descuento = cuponAplicado ? Math.round(cuponAplicado.descuento / 100) : 0
  const subtotalConDescuento = Math.max(0, subtotal - descuento)
  const envio = items.length === 0 ? 0
    : subtotalConDescuento >= ENVIO_GRATIS_DESDE ? 0 : TARIFA_ENVIO
  const total = subtotalConDescuento + envio

  async function aplicarCupon() {
    setCuponError('')
    const code = cuponInput.trim().toUpperCase()
    if (!code) return
    if (!form.email.trim()) {
      setCuponError('Primero ingresa tu correo arriba.')
      return
    }
    setCuponValidando(true)
    try {
      const res = await validarCuponApi({
        codigo: code,
        subtotal: subtotal * 100, // centavos
        email: form.email.trim(),
      })
      if (res.valido) {
        setCuponAplicado(res)
        toast.success(`Cupón ${res.codigo} aplicado`)
      } else {
        setCuponAplicado(null)
        setCuponError(res.motivo || 'Cupón inválido.')
      }
    } catch (err) {
      setCuponError(err.message || 'No se pudo validar el cupón.')
    } finally {
      setCuponValidando(false)
    }
  }

  function quitarCupon() {
    setCuponAplicado(null)
    setCuponInput('')
    setCuponError('')
  }

  // Si cambia el email después de aplicar cupón, re-valida (por email_requerido/primera compra)
  useEffect(() => {
    if (!cuponAplicado) return
    const code = cuponAplicado.codigo
    validarCuponApi({
      codigo: code,
      subtotal: subtotal * 100,
      email: form.email.trim() || null,
    })
      .then((res) => {
        if (res.valido) {
          setCuponAplicado(res)
          setCuponError('')
        } else {
          setCuponAplicado(null)
          setCuponError(res.motivo || 'Cupón ya no es válido con este correo.')
        }
      })
      .catch(() => { /* silencioso */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.email])

  function update(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submittedRef.current) return
    if (items.length === 0) {
      toast.error('Tu selección está vacía.')
      return
    }
    if (!widgetReady) {
      toast.error('Widget de pagos aún cargando. Espera un segundo.')
      return
    }

    submittedRef.current = true
    setEnviando(true)
    try {
      // 1) Crear pedido en backend, obtener reference + signature
      const payload = {
        cliente: {
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          telefono: form.telefono.trim(),
          documento_tipo: form.documento_tipo,
          documento_numero: form.documento_numero.trim() || null,
          direccion: form.direccion.trim(),
          ciudad: form.ciudad.trim(),
          departamento: form.departamento.trim() || null,
          codigo_postal: form.codigo_postal.trim() || null,
          notas: form.notas.trim() || null,
        },
        items: items.map((i) => ({
          productoId: i.productoId,
          color: i.color,
          talla: i.talla,
          cantidad: i.cantidad,
        })),
        cupon_codigo: cuponAplicado?.codigo || null,
      }

      const res = await crearPedido(payload)

      // 2) Abrir widget de Wompi con los datos devueltos
      const checkout = new window.WidgetCheckout({
        currency: res.currency,
        amountInCents: res.amountInCents,
        reference: res.reference,
        publicKey: res.publicKey,
        signature: { integrity: res.signature },
        redirectUrl: `${window.location.origin}/pedido/${res.reference}`,
        customerData: {
          email: form.email.trim(),
          fullName: form.nombre.trim(),
          phoneNumber: form.telefono.trim(),
          phoneNumberPrefix: '+57',
          legalId: form.documento_numero.trim() || undefined,
          legalIdType: form.documento_tipo,
        },
        shippingAddress: {
          addressLine1: form.direccion.trim(),
          city: form.ciudad.trim(),
          region: form.departamento.trim() || form.ciudad.trim(),
          country: 'CO',
          phoneNumber: form.telefono.trim(),
          name: form.nombre.trim(),
        },
      })

      checkout.open((result) => {
        // result.transaction puede ser undefined si el usuario cerró el widget
        if (result?.transaction) {
          clear()
          nav(`/pedido/${res.reference}`, { replace: true })
        } else {
          setEnviando(false)
          submittedRef.current = false
          toast.message('Pago cancelado. Puedes intentar de nuevo.')
        }
      })
    } catch (err) {
      setEnviando(false)
      submittedRef.current = false
      toast.error(err.message || 'No se pudo iniciar el pago.')
    }
  }

  if (items.length === 0) {
    return (
      <main id="main" className="pt-[70px] min-h-screen bg-cream-50">
        <Seo title="Checkout" path="/checkout" />
        <div className="max-w-md mx-auto px-6 py-20 text-center">
          <p className="font-serif text-gold-500 text-3xl mb-3" aria-hidden="true">🌸</p>
          <h1 className="font-serif text-2xl text-wine-900 mb-2">Tu selección está vacía</h1>
          <p className="font-sans text-sm text-taupe-600 mb-6">Agrega prendas antes de pagar.</p>
          <Link
            to="/"
            className="inline-block bg-wine-600 text-cream-200 px-8 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-wine-800 transition-colors"
          >
            Explorar colección
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main id="main" className="pt-[70px] min-h-screen bg-cream-50">
      <Seo
        title="Checkout"
        description="Finaliza tu compra en Íntima Exclusive con pago seguro por tarjeta, PSE, Nequi o Bancolombia."
        path="/checkout"
      />
      <div className="bg-cream-200 border-b border-gold-300 text-center py-10 px-8">
        <nav aria-label="Breadcrumb" className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-400 mb-3">
          <Link to="/" className="text-wine-600 hover:underline">Inicio</Link>
          {' / '}<span aria-current="page">Checkout</span>
        </nav>
        <h1 className="font-serif text-[clamp(1.5rem,3.5vw,2.3rem)] tracking-widest uppercase text-wine-800">
          Finalizar <em className="text-wine-600">compra</em>
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-4 sm:px-8 py-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* DATOS DEL CLIENTE */}
        <div className="space-y-6">
          <section aria-labelledby="datos-contacto">
            <h2 id="datos-contacto" className="font-serif text-wine-800 text-lg mb-3">Datos de contacto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nombre completo *" value={form.nombre} onChange={(v) => update('nombre', v)} maxLength={100} required />
              <Field label="Correo electrónico *" type="email" value={form.email} onChange={(v) => update('email', v)} maxLength={120} required />
              <Field label="Teléfono / WhatsApp *" type="tel" value={form.telefono} onChange={(v) => update('telefono', v)} required placeholder="+57 3XX XXX XXXX" />
              <div className="grid grid-cols-[90px_1fr] gap-2">
                <label className="block">
                  <span className="font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600 block mb-1">Doc</span>
                  <select
                    value={form.documento_tipo}
                    onChange={(e) => update('documento_tipo', e.target.value)}
                    className="w-full border border-gold-300 bg-cream-50 px-2 py-2 font-sans text-sm text-wine-900 focus-visible:outline-2 focus-visible:outline-wine-600"
                  >
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="NIT">NIT</option>
                    <option value="PP">PP</option>
                  </select>
                </label>
                <Field label="Número documento" value={form.documento_numero} onChange={(v) => update('documento_numero', v)} maxLength={30} />
              </div>
            </div>
          </section>

          <section aria-labelledby="datos-envio">
            <h2 id="datos-envio" className="font-serif text-wine-800 text-lg mb-3">Dirección de envío</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field className="sm:col-span-2" label="Dirección completa *" value={form.direccion} onChange={(v) => update('direccion', v)} maxLength={200} required placeholder="Calle, carrera, número, apto/casa…" />
              <Field label="Ciudad *" value={form.ciudad} onChange={(v) => update('ciudad', v)} maxLength={80} required />
              <Field label="Departamento" value={form.departamento} onChange={(v) => update('departamento', v)} maxLength={80} />
              <Field label="Código postal" value={form.codigo_postal} onChange={(v) => update('codigo_postal', v)} maxLength={20} />
            </div>
          </section>

          <section aria-labelledby="notas">
            <h2 id="notas" className="font-serif text-wine-800 text-lg mb-3">Notas (opcional)</h2>
            <label className="block">
              <textarea
                value={form.notas}
                onChange={(e) => update('notas', e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Referencia adicional, hora de entrega preferida…"
                className="w-full border border-gold-300 bg-cream-50 px-3 py-2 font-sans text-sm text-wine-900 focus-visible:outline-2 focus-visible:outline-wine-600 resize-y"
              />
            </label>
          </section>

          <div className="bg-cream-100 border border-gold-300 p-4 text-[0.78rem] text-taupe-600 font-sans">
            <p>🔒 El pago lo procesa <strong>Wompi</strong>, una plataforma de Bancolombia. Tus datos de tarjeta NUNCA pasan por nuestros servidores.</p>
          </div>
        </div>

        {/* RESUMEN */}
        <aside aria-label="Resumen del pedido" className="bg-white border border-gold-300 p-5 h-fit lg:sticky lg:top-[90px]">
          <h2 className="font-serif text-wine-900 text-lg mb-3">Tu pedido</h2>
          <ul className="space-y-3 mb-4 max-h-80 overflow-y-auto">
            {items.map((i) => (
              <li key={`${i.productoId}-${i.color}-${i.talla}`} className="flex gap-3 border-b border-gold-300/50 pb-3 last:border-0">
                <Img src={i.imagen} alt={i.nombre} w={128} className="w-14 h-16 object-cover border border-gold-300" />
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-[0.88rem] text-wine-900 truncate">{i.nombre}</p>
                  <p className="font-sans text-[0.65rem] text-taupe-600">{i.color} · Talla {i.talla}</p>
                  <p className="font-sans text-[0.7rem] text-taupe-600">Cantidad: {i.cantidad}</p>
                </div>
                <p className="font-sans text-sm font-bold text-wine-600 whitespace-nowrap">
                  {formatPrecio(i.precio * i.cantidad)}
                </p>
              </li>
            ))}
          </ul>

          {/* CUPÓN */}
          <div className="mb-4 border border-gold-300 p-3 bg-cream-100">
            <p className="font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600 mb-2">
              ¿Tienes un cupón?
            </p>
            {cuponAplicado ? (
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-wine-900 text-[0.82rem]">{cuponAplicado.codigo}</span>
                <button
                  type="button"
                  onClick={quitarCupon}
                  className="font-sans text-[0.68rem] text-wine-600 underline hover:text-wine-800"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cuponInput}
                  onChange={(e) => { setCuponInput(e.target.value.toUpperCase()); setCuponError('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); aplicarCupon() } }}
                  placeholder="CÓDIGO"
                  maxLength={32}
                  className="flex-1 border border-gold-300 bg-cream-50 px-3 py-2 font-mono text-sm text-wine-900 focus-visible:outline-2 focus-visible:outline-wine-600"
                />
                <button
                  type="button"
                  onClick={aplicarCupon}
                  disabled={cuponValidando || !cuponInput.trim()}
                  className="bg-wine-600 text-cream-200 px-4 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:bg-wine-800 disabled:opacity-50 transition-colors"
                >
                  {cuponValidando ? '...' : 'Aplicar'}
                </button>
              </div>
            )}
            {cuponError && (
              <p className="font-sans text-[0.7rem] text-red-600 mt-2" role="alert">{cuponError}</p>
            )}
          </div>

          <dl className="space-y-2 font-sans text-[0.85rem] mb-5">
            <div className="flex justify-between">
              <dt className="text-taupe-600">Subtotal ({totalItems})</dt>
              <dd className="text-wine-900">{formatPrecio(subtotal)}</dd>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between">
                <dt className="text-taupe-600">Descuento {cuponAplicado?.codigo}</dt>
                <dd className="text-green-700 font-bold">-{formatPrecio(descuento)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-taupe-600">Envío</dt>
              <dd className="text-wine-900">
                {envio === 0 ? <span className="text-green-700 font-bold">GRATIS</span> : formatPrecio(envio)}
              </dd>
            </div>
            {subtotalConDescuento < ENVIO_GRATIS_DESDE && subtotalConDescuento > 0 && (
              <p className="font-sans text-[0.7rem] text-taupe-400 italic">
                Agrega {formatPrecio(ENVIO_GRATIS_DESDE - subtotalConDescuento)} más para envío gratis.
              </p>
            )}
            <div className="flex justify-between pt-2 border-t border-gold-300">
              <dt className="font-serif text-wine-900 text-lg">Total</dt>
              <dd className="font-serif text-wine-800 text-xl">{formatPrecio(total)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={enviando || !widgetReady}
            className="w-full bg-wine-600 text-cream-200 py-4 font-sans text-[0.75rem] tracking-widest uppercase hover:bg-wine-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {enviando ? 'Procesando…' : !widgetReady ? 'Cargando pagos…' : '🔒 Pagar con Wompi'}
          </button>

          <Link
            to="/"
            className="block text-center mt-3 font-sans text-[0.7rem] tracking-widest uppercase text-taupe-600 hover:text-wine-600 transition-colors"
          >
            ← Seguir comprando
          </Link>

          <p className="font-sans text-[0.65rem] text-taupe-400 text-center mt-3">
            Tarjeta · PSE · Nequi · Bancolombia
          </p>
        </aside>
      </form>
    </main>
  )
}

function Field({ label, value, onChange, className = '', ...rest }) {
  return (
    <label className={`block ${className}`}>
      <span className="font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600 block mb-1">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gold-300 bg-cream-50 px-3 py-2 font-sans text-sm text-wine-900 focus-visible:outline-2 focus-visible:outline-wine-600"
        {...rest}
      />
    </label>
  )
}
