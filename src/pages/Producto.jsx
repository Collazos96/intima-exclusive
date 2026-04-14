import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProducto } from '../hooks/useApi'

export default function Producto() {
  const { id } = useParams()
  const nav = useNavigate()
  const [prod, setProd] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mainImg, setMainImg] = useState(0)
  const [colorSel, setColorSel] = useState(null)
  const [tallaSel, setTallaSel] = useState(null)
  const [tab, setTab] = useState('desc')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getProducto(id)
      setProd(data)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="pt-24 min-h-screen flex items-center justify-center">
      <p className="font-serif italic text-[#C4A882] text-xl">Cargando...</p>
    </div>
  )

  if (!prod) return <div className="pt-24 text-center text-[#7A5A60]">Producto no encontrado</div>

  const tallasDisp = colorSel ? (prod.colores.find(c => c.nombre === colorSel)?.tallas || []) : []
  const formatPrecio = (p) => '$' + p.toLocaleString('es-CO')

  function pedir() {
    if (!colorSel) { alert('Por favor selecciona un color.'); return }
    if (!tallaSel) { alert('Por favor selecciona una talla.'); return }
    const msg = `Hola! Me interesa el ${prod.nombre} 🌹\n• Color: ${colorSel}\n• Talla: ${tallaSel}\n• Precio: ${formatPrecio(prod.precio)}\n¿Está disponible?`
    window.open('https://wa.me/573028556022?text=' + encodeURIComponent(msg), '_blank')
  }

  return (
    <main className="pt-[70px] min-h-screen">
      <div className="bg-[#F5EDE0] border-b border-[#D9C4A8] px-8 py-4">
        <p className="font-sans text-[0.68rem] tracking-widest uppercase text-[#B09090]">
          <span onClick={() => nav('/')} className="text-[#7B1A2E] cursor-pointer hover:underline">Inicio</span>
          {' / '}
          <span onClick={() => nav(`/categoria/${prod.categoria_id}`)} className="text-[#7B1A2E] cursor-pointer hover:underline capitalize">{prod.categoria_id}</span>
          {' / '}{prod.nombre}
        </p>
      </div>
      <div className="max-w-5xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-[72px_1fr_1fr] gap-6 items-start">
        <div className="flex lg:flex-col flex-row gap-2 order-2 lg:order-1">
          {prod.imagenes.map((src, i) => (
            <img key={i} src={src} alt={`${prod.nombre} ${i+1}`}
              onClick={() => setMainImg(i)}
              className={`w-16 h-16 object-cover cursor-pointer border-2 transition-all ${mainImg === i ? 'border-[#7B1A2E] opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
            />
          ))}
        </div>
        <div className="order-1 lg:order-2 border border-[#D9C4A8] overflow-hidden bg-[#F5EDE0]">
          <img src={prod.imagenes[mainImg]} alt={prod.nombre} className="w-full aspect-[3/4] object-cover"/>
        </div>
        <div className="order-3">
          {prod.nuevo === 1 && <span className="inline-block bg-[#7B1A2E] text-[#F5EDE0] font-sans text-[0.55rem] tracking-widest px-2 py-0.5 mb-3 uppercase">Nuevo</span>}
          <span className="block font-sans text-[0.6rem] tracking-widest uppercase text-[#C4A882] mb-1 capitalize">{prod.categoria_id}</span>
          <h1 className="font-serif text-[clamp(1.3rem,2.5vw,2rem)] text-[#4E0F1C] mb-2">{prod.nombre}</h1>
          <p className="font-sans font-bold text-[#7B1A2E] text-2xl mb-5">{formatPrecio(prod.precio)}</p>
          <div className="w-full h-px bg-[#D9C4A8] mb-5"/>
          <span className="block font-sans text-[0.66rem] tracking-widest uppercase text-[#7A5A60] mb-2">
            Color — <strong>{colorSel || 'Selecciona un color'}</strong>
          </span>
          <div className="flex gap-2 flex-wrap mb-5">
            {prod.colores.map(c => (
              <button key={c.nombre} onClick={() => { setColorSel(c.nombre); setTallaSel(null) }}
                className={`px-4 py-1.5 font-sans text-[0.72rem] border transition-all ${colorSel === c.nombre ? 'border-[#7B1A2E] bg-[#7B1A2E] text-[#F5EDE0]' : 'border-[#D9C4A8] text-[#3A1A20] hover:border-[#7B1A2E]'}`}>
                {c.nombre}
              </button>
            ))}
          </div>
          <span className="block font-sans text-[0.66rem] tracking-widest uppercase text-[#7A5A60] mb-2">
            Talla — <strong>{tallaSel || 'Selecciona una talla'}</strong>
          </span>
          <div className="flex gap-2 flex-wrap mb-2">
            {['S','M','L','XL'].map(t => {
              const disp = tallasDisp.includes(t)
              return (
                <button key={t} onClick={() => disp && setTallaSel(t)} disabled={!disp}
                  className={`w-11 h-11 font-sans text-[0.78rem] border-2 transition-all flex items-center justify-center
                    ${tallaSel === t ? 'border-[#7B1A2E] bg-[#7B1A2E] text-[#F5EDE0]' :
                    disp ? 'border-[#D9C4A8] text-[#3A1A20] hover:border-[#7B1A2E]' :
                    'border-[#D9C4A8] text-[#B09090] opacity-30 cursor-not-allowed line-through'}`}>
                  {t}
                </button>
              )
            })}
          </div>
          <button onClick={() => nav('/guia-tallas')} className="font-sans text-[0.7rem] text-[#7B1A2E] underline mb-5 block">
            Guía de tallas →
          </button>
          <button onClick={pedir} className="w-full bg-[#7B1A2E] text-[#F5EDE0] py-4 font-sans text-[0.75rem] tracking-widest uppercase hover:bg-[#4E0F1C] transition-colors mb-3">
            Agregar al pedido
          </button>
          <button onClick={pedir} className="w-full bg-[#25D366] text-white py-3.5 font-sans text-[0.72rem] tracking-widest uppercase hover:opacity-90 transition-opacity">
            📲 Pedir por WhatsApp
          </button>
          <div className="mt-7">
            <div className="flex border-b border-[#D9C4A8]">
              {[['desc','Descripción'],['care','Cuidados'],['tallas','Guía de tallas']].map(([k,l]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`font-sans text-[0.65rem] tracking-widest uppercase px-4 py-2.5 border-b-2 transition-all ${tab===k ? 'text-[#7B1A2E] border-[#7B1A2E]' : 'text-[#B09090] border-transparent hover:text-[#7B1A2E]'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="pt-5 font-sans text-[0.82rem] text-[#7A5A60] leading-relaxed">
              {tab === 'desc' && <p>{prod.descripcion}</p>}
              {tab === 'care' && (
                <ul className="space-y-2">
                  {['🖐️ Lavar a mano con agua fría y jabón suave.',
                    '🚫 Evitar blanqueadores o suavizantes.',
                    '🔄 No retorcer. Presionar suavemente con toalla limpia.',
                    '🌬️ Secar al aire libre, a la sombra, en posición horizontal.',
                    '❌ No usar secadora ni plancha.'
                  ].map(c => <li key={c} className="border-b border-[#D9C4A8] pb-2">{c}</li>)}
                  <li className="italic pt-1">¡Tus prendas íntimas merecen un cuidado especial, y tú también!</li>
                </ul>
              )}
              {tab === 'tallas' && (
                <div>
                  <img src="https://images.intimaexclusive.com/GUIA-TALLAS.png" alt="Guía de tallas" className="w-full border border-[#D9C4A8] mb-4"/>
                  <p className="font-bold text-[#3A1A20] mb-2">¿Cómo saber tu talla?</p>
                  <p className="mb-3">En la parte superior de nuestros brassieres manejamos:</p>
                  <img src="https://images.intimaexclusive.com/tabla.png" alt="Tabla de tallas" className="w-full border border-[#D9C4A8] mb-3"/>
                  <p>La mayoría de nuestros pantys son ajustables, se gradúan a los lados y se adaptan a diferentes tallas.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}