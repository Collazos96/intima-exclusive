import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getProducto, getReviews, registrarVisita } from '../hooks/useApi'
import { qk } from '../lib/queryClient'
import { useCart } from '../lib/cartStore'
import GuiaTallasModal from '../components/GuiaTallasModal'
import Seo from '../components/Seo'
import Img from '../components/Img'
import Reviews from '../components/Reviews'
import { ProductoDetalleSkeleton } from '../components/Skeletons'
import WishlistButton from '../components/WishlistButton'
import ProductosRelacionados from '../components/ProductosRelacionados'
import { useSwipe } from '../lib/useSwipe'

export default function Producto() {
  const { id } = useParams()
  const addItem = useCart((s) => s.addItem)
  const openCart = useCart((s) => s.open)
  const [mainImg, setMainImg] = useState(0)
  const [colorSel, setColorSel] = useState(null)
  const [tallaSel, setTallaSel] = useState(null)
  const [tab, setTab] = useState('desc')
  const [guiaAbierta, setGuiaAbierta] = useState(false)

  const { data: prod, isLoading, isError } = useQuery({
    queryKey: qk.producto(id),
    queryFn: () => getProducto(id),
    enabled: !!id,
  })

  const totalImgs = prod?.imagenes?.length ?? 1
  const swipeMain = useSwipe({
    onSwipeLeft: () => setMainImg((i) => (i + 1) % totalImgs),
    onSwipeRight: () => setMainImg((i) => (i - 1 + totalImgs) % totalImgs),
  })

  // Pre-cargamos reseñas para poder incluir aggregateRating en el JSON-LD
  const { data: reviewsData } = useQuery({
    queryKey: qk.reviews(id),
    queryFn: () => getReviews(id),
    enabled: !!id,
  })

  useEffect(() => {
    if (id && prod) registrarVisita(id)
  }, [id, prod])

  if (isLoading) return (
    <main id="main" className="pt-[70px] min-h-screen">
      <ProductoDetalleSkeleton />
    </main>
  )

  if (isError || !prod) return <div className="pt-24 text-center text-taupe-600">Producto no encontrado</div>

    const tallasDisp = colorSel
    ? (prod.colores.find(c => c.nombre === colorSel)?.tallas || [])
    : []

    function stockDeTalla(talla) {
    if (!colorSel) return 0
    const color = prod.colores.find(c => c.nombre === colorSel)
    if (!color) return 0
    const t = color.tallas.find(t => t.talla === talla)
    return t ? t.stock : 0
    }

    function tallaDisponible(talla) {
    if (!colorSel) return false
    const color = prod.colores.find(c => c.nombre === colorSel)
    if (!color) return false
    const t = color.tallas.find(t => t.talla === talla)
    return t && t.stock > 0
    }
  const formatPrecio = (p) => '$' + p.toLocaleString('es-CO')

  function validarSeleccion() {
    if (!colorSel) { toast.error('Por favor selecciona un color.'); return false }
    if (!tallaSel) { toast.error('Por favor selecciona una talla.'); return false }
    return true
  }

  function agregarAlCarrito() {
    if (!validarSeleccion()) return
    addItem({
      productoId: prod.id,
      nombre: prod.nombre,
      precio: prod.precio,
      color: colorSel,
      talla: tallaSel,
      cantidad: 1,
      imagen: prod.imagenes[0],
    })
    toast.success('Añadido a tu selección', {
      action: { label: 'Ver selección', onClick: () => openCart() },
    })
  }

  const stockTotal = prod.colores.reduce(
    (sum, c) => sum + c.tallas.reduce((s, t) => s + (t.stock || 0), 0),
    0,
  )

  return (
    <main id="main" className="pt-[70px] min-h-screen">
      <link rel="preload" as="image" href={prod.imagenes[0]} />
      <Seo
        title={prod.nombre}
        description={prod.descripcion ? prod.descripcion.slice(0, 160) : `${prod.nombre} — Íntima Exclusive.`}
        image={prod.imagenes[0]}
        path={`/producto/${prod.id}`}
        type="product"
        jsonLd={(() => {
          const next = new Date()
          next.setFullYear(next.getFullYear() + 1)
          const priceValidUntil = next.toISOString().split('T')[0]
          const productLd = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: prod.nombre,
            description: prod.descripcion,
            image: prod.imagenes,
            sku: prod.id,
            brand: { '@type': 'Brand', name: 'Íntima Exclusive' },
            category: prod.categoria_id,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'COP',
              price: prod.precio,
              priceValidUntil,
              availability: stockTotal > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
              itemCondition: 'https://schema.org/NewCondition',
              url: `https://intimaexclusive.com/producto/${prod.id}`,
              seller: { '@type': 'Organization', name: 'Íntima Exclusive' },
              hasMerchantReturnPolicy: {
                '@type': 'MerchantReturnPolicy',
                applicableCountry: 'CO',
                returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
                merchantReturnDays: 30,
                returnMethod: 'https://schema.org/ReturnByMail',
                returnFees: 'https://schema.org/FreeReturn',
              },
              shippingDetails: {
                '@type': 'OfferShippingDetails',
                shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'CO' },
                shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'COP' },
                deliveryTime: {
                  '@type': 'ShippingDeliveryTime',
                  handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
                  transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' },
                },
              },
            },
          }
          if (reviewsData?.total > 0 && reviewsData.promedio) {
            productLd.aggregateRating = {
              '@type': 'AggregateRating',
              ratingValue: reviewsData.promedio,
              reviewCount: reviewsData.total,
              bestRating: 5,
              worstRating: 1,
            }
          }
          const breadcrumbLd = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://intimaexclusive.com/' },
              { '@type': 'ListItem', position: 2, name: prod.categoria_id, item: `https://intimaexclusive.com/categoria/${prod.categoria_id}` },
              { '@type': 'ListItem', position: 3, name: prod.nombre },
            ],
          }
          return [productLd, breadcrumbLd]
        })()}
      />
      <div className="bg-cream-200 border-b border-gold-300 px-4 sm:px-8 py-4">
        <nav aria-label="Breadcrumb" className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-400">
          <Link to="/" className="text-wine-600 hover:underline focus-visible:outline-2 focus-visible:outline-wine-600">Inicio</Link>
          {' / '}
          <Link to={`/categoria/${prod.categoria_id}`} className="text-wine-600 hover:underline capitalize focus-visible:outline-2 focus-visible:outline-wine-600">{prod.categoria_id}</Link>
          {' / '}<span aria-current="page">{prod.nombre}</span>
        </nav>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 grid grid-cols-1 lg:grid-cols-[72px_1fr_1fr] gap-6 items-start">
        <div className="flex lg:flex-col flex-row gap-2 order-2 lg:order-1">
          {prod.imagenes.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setMainImg(i)}
              aria-label={`Ver foto ${i + 1} de ${prod.imagenes.length}`}
              aria-current={mainImg === i}
              className={`block border-2 transition-all focus-visible:outline-2 focus-visible:outline-wine-600 focus-visible:outline-offset-2 ${mainImg === i ? 'border-wine-600 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <Img
                src={src}
                alt={`${prod.nombre} — miniatura ${i + 1}`}
                w={128}
                q={70}
                className="w-16 h-16 object-cover"
              />
            </button>
          ))}
        </div>
        <div
          className="order-1 lg:order-2 border border-gold-300 overflow-hidden bg-cream-200 relative"
          style={{ touchAction: 'pan-y' }}
          {...swipeMain}
        >
          <Img
            src={prod.imagenes[mainImg]}
            alt={prod.nombre}
            priority
            widths={[600, 900, 1200]}
            sizes="(min-width: 1024px) 45vw, 100vw"
            w={900}
            className="w-full aspect-[3/4] object-cover"
          />
          {prod.imagenes.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
              {prod.imagenes.map((_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={`w-2 h-2 rounded-full transition-colors ${i === mainImg ? 'bg-wine-600' : 'bg-wine-600/30'}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="order-3">
          {prod.nuevo === 1 && <span className="inline-block bg-wine-600 text-cream-200 font-sans text-[0.55rem] tracking-widest px-2 py-0.5 mb-3 uppercase">Nuevo</span>}
          <span className="block font-sans text-[0.6rem] tracking-widest uppercase text-gold-500 mb-1 capitalize">{prod.categoria_id}</span>
          <h1 className="font-serif text-[clamp(1.3rem,2.5vw,2rem)] text-wine-800 mb-2">{prod.nombre}</h1>
          <p className="font-sans font-bold text-wine-600 text-2xl mb-5">{formatPrecio(prod.precio)}</p>
          <div className="w-full h-px bg-gold-300 mb-5"/>
          <span className="block font-sans text-[0.66rem] tracking-widest uppercase text-taupe-600 mb-2">
            Color — <strong>{colorSel || 'Selecciona un color'}</strong>
          </span>
          <div className="flex gap-2 flex-wrap mb-5">
            {prod.colores.map(c => (
              <button key={c.nombre} onClick={() => { setColorSel(c.nombre); setTallaSel(null) }}
                className={`px-4 py-1.5 font-sans text-[0.72rem] border transition-all ${colorSel === c.nombre ? 'border-wine-600 bg-wine-600 text-cream-200' : 'border-gold-300 text-wine-900 hover:border-wine-600'}`}>
                {c.nombre}
              </button>
            ))}
          </div>
          <span className="block font-sans text-[0.66rem] tracking-widest uppercase text-taupe-600 mb-2">
            Talla — <strong>{tallaSel || 'Selecciona una talla'}</strong>
          </span>
          <div className="flex gap-2 flex-wrap mb-2">
            {['S','M','L','XL'].map(t => {
                const existe = tallasDisp.some(td => (typeof td === 'string' ? td : td.talla) === t)
                const disponible = tallaDisponible(t)
                const stock = stockDeTalla(t)
                if (!existe) return null
                return (
                <button key={t}
                    onClick={() => disponible && setTallaSel(t)}
                    disabled={!disponible}
                    title={disponible ? `${stock} unidades disponibles` : 'Agotado'}
                    className={`w-11 h-11 font-sans text-[0.78rem] border-2 transition-all flex items-center justify-center relative
                    ${tallaSel === t ? 'border-wine-600 bg-wine-600 text-cream-200' :
                    disponible ? 'border-gold-300 text-wine-900 hover:border-wine-600' :
                    'border-gold-300 text-taupe-400 opacity-30 cursor-not-allowed line-through'}`}>
                    {t}
                    {disponible && stock <= 3 && tallaSel !== t && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"></span>
                    )}
                </button>
                )
            })}
            </div>
            {tallaSel && stockDeTalla(tallaSel) <= 3 && stockDeTalla(tallaSel) > 0 && (
            <p className="font-sans text-[0.7rem] text-amber-600 mb-2">
                Quedan pocas unidades de esta talla.
            </p>
            )}
          <button onClick={() => setGuiaAbierta(true)} className="font-sans text-[0.7rem] text-wine-600 underline mb-5 block">
            Guía de tallas →
          </button>
          <button onClick={agregarAlCarrito} className="w-full bg-wine-600 text-cream-200 py-4 font-sans text-[0.75rem] tracking-widest uppercase hover:bg-wine-800 transition-colors mb-3">
            Añadir a mi selección
          </button>
          <div className="flex justify-center">
            <WishlistButton producto={prod} variant="full" />
          </div>
          <ul className="grid grid-cols-3 gap-2 mt-4 font-sans text-[0.65rem] text-taupe-600">
            <li className="flex flex-col items-center text-center gap-1 p-2 bg-cream-100 border border-gold-300">
              <span aria-hidden="true">🤫</span><span>Empaque discreto</span>
            </li>
            <li className="flex flex-col items-center text-center gap-1 p-2 bg-cream-100 border border-gold-300">
              <span aria-hidden="true">🔄</span><span>Cambios 30 días</span>
            </li>
            <li className="flex flex-col items-center text-center gap-1 p-2 bg-cream-100 border border-gold-300">
              <span aria-hidden="true">🚚</span><span>Envío nacional</span>
            </li>
          </ul>
          <div className="mt-7">
            <div className="flex border-b border-gold-300">
              {[['desc','Descripción'],['care','Cuidados'],['tallas','Guía de tallas']].map(([k,l]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`font-sans text-[0.65rem] tracking-widest uppercase px-4 py-2.5 border-b-2 transition-all ${tab===k ? 'text-wine-600 border-wine-600' : 'text-taupe-400 border-transparent hover:text-wine-600'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="pt-5 font-sans text-[0.82rem] text-taupe-600 leading-relaxed">
              {tab === 'desc' && <p>{prod.descripcion}</p>}
              {tab === 'care' && (
                <ul className="space-y-2">
                  {['🖐️ Lavar a mano con agua fría y jabón suave.',
                    '🚫 Evitar blanqueadores o suavizantes.',
                    '🔄 No retorcer. Presionar suavemente con toalla limpia.',
                    '🌬️ Secar al aire libre, a la sombra, en posición horizontal.',
                    '❌ No usar secadora ni plancha.'
                  ].map(c => <li key={c} className="border-b border-gold-300 pb-2">{c}</li>)}
                  <li className="italic pt-1">¡Tus prendas íntimas merecen un cuidado especial, y tú también!</li>
                </ul>
              )}
              {tab === 'tallas' && (
                <div>
                  <img src="https://images.intimaexclusive.com/GUIA-TALLAS.png" alt="Guía de tallas" className="w-full border border-gold-300 mb-4"/>
                  <p className="font-bold text-wine-900 mb-2">¿Cómo saber tu talla?</p>
                  <p className="mb-3">En la parte superior de nuestros brassieres manejamos:</p>
                  <img src="https://images.intimaexclusive.com/tabla.png" alt="Tabla de tallas" className="w-full border border-gold-300 mb-3"/>
                  <p>La mayoría de nuestros pantys son ajustables, se gradúan a los lados y se adaptan a diferentes tallas.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pb-16">
        <ProductosRelacionados productoId={prod.id} />
        <Reviews productoId={prod.id} />
      </div>
      <GuiaTallasModal open={guiaAbierta} onClose={() => setGuiaAbierta(false)} />
    </main>
  )
}