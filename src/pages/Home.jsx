import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCategorias, getProductos } from '../hooks/useApi'
import { qk } from '../lib/queryClient'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'

const iconos = { sets:'🌸', corsets:'🪢', lenceria:'✨', bodys:'🎀', accesorios:'💎' }

export default function Home() {
  const nav = useNavigate()
  const { data: categorias = [], isLoading: cargandoCategorias } = useQuery({
    queryKey: qk.categorias,
    queryFn: getCategorias,
  })
  const { data: productos = [] } = useQuery({
    queryKey: qk.productos,
    queryFn: getProductos,
  })
  const destacados = productos.filter(p => p.nuevo === 1)

  if (cargandoCategorias || !categorias.length) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-200">
      <p className="font-serif italic text-gold-500 text-xl">Cargando...</p>
    </div>
  )

  return (
    <main>
      <Seo
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Store',
          name: 'Íntima Exclusive',
          description: 'Lencería íntima premium hecha en Colombia',
          url: 'https://intimaexclusive.com',
          logo: 'https://images.intimaexclusive.com/LOGO-INTIMA.jpg',
          areaServed: { '@type': 'Country', name: 'Colombia' },
          sameAs: ['https://www.instagram.com/intima_exclusive'],
        }}
      />
      {/* HERO */}
      <section className="min-h-screen flex items-center justify-center text-center relative bg-cream-200 px-8 pt-20 pb-16 overflow-hidden">
        <div className="absolute w-[680px] h-[680px] rounded-full border border-gold-300 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-35 pointer-events-none"/>
        <div className="absolute w-[480px] h-[480px] rounded-full border border-gold-300 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-25 pointer-events-none"/>
        <div className="relative z-10">
          <span className="block font-sans text-[0.65rem] tracking-[5px] uppercase text-gold-500 mb-5">Nueva colección 2026</span>
          <h1 className="font-serif text-[clamp(2rem,6vw,4.5rem)] tracking-widest leading-tight text-wine-800 uppercase mb-3">
            Para la mujer<br/>que se <em className="text-wine-600 normal-case">elige</em><br/>cada día
          </h1>
          <p className="font-serif italic text-taupe-600 text-lg mb-8">Delicadeza que empodera</p>
          <div className="flex items-center gap-4 justify-center mb-8">
            <div className="w-16 h-px bg-gold-300"/>
            <span className="font-sans text-[0.62rem] tracking-[4px] uppercase text-gold-500">Sets · Corsets · Lencería · Bodys · Accesorios</span>
            <div className="w-16 h-px bg-gold-300"/>
          </div>
          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={() => nav('/categoria/sets')} className="bg-wine-600 text-cream-200 px-9 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-wine-800 transition-colors">Ver colección</button>
            <button onClick={() => document.getElementById('filosofia').scrollIntoView({behavior:'smooth'})} className="border border-wine-600 text-wine-600 px-9 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-wine-600 hover:text-cream-200 transition-all">Nuestra historia</button>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="py-20 px-8 bg-cream-50 text-center">
        <span className="block font-sans text-[0.62rem] tracking-[4px] uppercase text-gold-500 mb-3">Explora</span>
        <h2 className="font-serif text-[clamp(1.4rem,3vw,2.2rem)] text-wine-900 mb-1">Nuestras <em className="text-wine-600">categorías</em></h2>
        <div className="w-12 h-px bg-gold-500 mx-auto my-6"/>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
          {categorias.map(c => (
            <div key={c.id} onClick={() => nav(`/categoria/${c.id}`)}
              className="p-8 border border-gold-300 bg-cream-100 cursor-pointer hover:border-wine-600 hover:-translate-y-1 transition-all group">
              <span className="block text-3xl mb-3">{iconos[c.id]}</span>
              <h3 className="font-sans text-[0.75rem] tracking-widest uppercase text-wine-900 mb-1">{c.nombre}</h3>
              <p className="font-sans text-[0.7rem] text-taupe-400">{c.sub}</p>
              <span className="block text-[0.7rem] text-wine-600 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">Ver →</span>
            </div>
          ))}
        </div>
      </section>

      {/* DESTACADOS */}
      <section className="py-20 px-8 bg-cream-100 text-center">
        <span className="block font-sans text-[0.62rem] tracking-[4px] uppercase text-gold-500 mb-3">Lo más deseado</span>
        <h2 className="font-serif text-[clamp(1.4rem,3vw,2.2rem)] text-wine-900 mb-1">Colección <em className="text-wine-600">destacada</em></h2>
        <div className="w-12 h-px bg-gold-500 mx-auto my-6"/>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {destacados.map(p => <ProductCard key={p.id} producto={p}/>)}
        </div>
      </section>

      {/* FILOSOFÍA */}
      <section id="filosofia" className="py-20 px-8 bg-cream-200 text-center">
        <span className="block font-sans text-[0.62rem] tracking-[4px] uppercase text-gold-500 mb-3">Nuestra esencia</span>
        <h2 className="font-serif text-[clamp(1.4rem,3vw,2.2rem)] text-wine-900 mb-1">Elegirte es un acto de <em className="text-wine-600">amor</em></h2>
        <div className="w-12 h-px bg-gold-500 mx-auto my-6"/>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
          {[['Sensualidad','Diseños que abrazan cada curva con elegancia y confianza.'],
            ['Calidad premium','Encajes de alta gama, suaves al tacto y delicados con tu piel.'],
            ['Tallas inclusivas','Toda mujer merece sentirse hermosa. XS hasta 4XL.'],
            ['Empoderamiento','Más que ropa: una actitud. Una forma de empezar el día contigo.']
          ].map(([t,d]) => (
            <div key={t} className="p-7 border border-gold-300 bg-cream-50">
              <h3 className="font-sans text-[0.78rem] tracking-widest uppercase text-wine-600 mb-2">{t}</h3>
              <p className="font-sans text-[0.8rem] text-taupe-600 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="py-20 px-8 bg-cream-50 text-center">
        <span className="block font-sans text-[0.62rem] tracking-[4px] uppercase text-gold-500 mb-3">¿Por qué elegirnos?</span>
        <h2 className="font-serif text-[clamp(1.4rem,3vw,2.2rem)] text-wine-900 mb-1">Íntima, <em className="text-wine-600">siempre contigo</em></h2>
        <div className="w-12 h-px bg-gold-500 mx-auto my-6"/>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
          {[['01','Envío a todo Colombia','Tu pedido empacado con elegancia directo en tu puerta.'],
            ['02','Cambios fáciles','30 días para cambios sin complicaciones.'],
            ['03','Pago seguro','Tarjetas, PSE, Nequi y contra entrega.'],
            ['04','Tallas inclusivas','Desde XS hasta 4XL para toda mujer.']
          ].map(([n,t,d]) => (
            <div key={n} className="p-6 border-t-2 border-wine-500">
              <span className="block font-serif italic text-wine-600 text-2xl mb-2">{n}</span>
              <h4 className="font-sans text-[0.72rem] tracking-widest uppercase text-wine-900 mb-2">{t}</h4>
              <p className="font-sans text-[0.76rem] text-taupe-600 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONFIANZA */}
      <section className="py-16 px-8 bg-cream-200 text-center border-y border-gold-300">
        <span className="block font-sans text-[0.62rem] tracking-[4px] uppercase text-gold-500 mb-3">Tu tranquilidad</span>
        <h2 className="font-serif text-[clamp(1.3rem,2.6vw,1.9rem)] text-wine-900 mb-1">
          Compra con <em className="text-wine-600">confianza</em>
        </h2>
        <div className="w-12 h-px bg-gold-500 mx-auto my-5"/>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            ['🤫','Empaque discreto','Sin logos ni referencias visibles al contenido'],
            ['🔒','Pago seguro','Tarjetas, PSE, Nequi o contra entrega'],
            ['🔄','Cambios 30 días','Cambios por talla o color sin complicaciones'],
            ['💬','Atención real','Te respondemos por WhatsApp en minutos'],
          ].map(([icon, titulo, desc]) => (
            <div key={titulo} className="p-5 bg-cream-50 border border-gold-300">
              <span className="block text-2xl mb-2" aria-hidden="true">{icon}</span>
              <h3 className="font-sans text-[0.72rem] tracking-widest uppercase text-wine-900 mb-1">{titulo}</h3>
              <p className="font-sans text-[0.75rem] text-taupe-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-20 px-8 bg-cream-100 text-center">
        <span className="block font-sans text-[0.62rem] tracking-[4px] uppercase text-gold-500 mb-3">Ellas hablan</span>
        <h2 className="font-serif text-[clamp(1.4rem,3vw,2.2rem)] text-wine-900 mb-1">Lo que dicen nuestras <em className="text-wine-600">clientas</em></h2>
        <div className="w-12 h-px bg-gold-500 mx-auto my-6"/>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {[['La calidad es increíble. Me lo puse y me sentí completamente diferente — más yo que nunca.','Valentina R., Bogotá'],
            ['Finalmente una marca que piensa en todas las tallas. Me queda como si lo hubieran hecho para mí.','Daniela M., Cali'],
            ['El empaque es una obra de arte y la atención al cliente es top. Compré tres veces y cada vez mejor.','Sofía L., Medellín']
          ].map(([t,n]) => (
            <div key={n} className="p-7 border-l-2 border-wine-500 bg-cream-50 text-left">
              <div className="text-wine-600 tracking-widest mb-3">★★★★★</div>
              <p className="font-sans text-[0.82rem] text-taupe-600 leading-relaxed italic mb-3">"{t}"</p>
              <span className="font-sans text-[0.7rem] tracking-widest uppercase text-wine-600">— {n}</span>
            </div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-20 px-8 bg-wine-600 text-center">
        <span className="block font-sans text-[0.62rem] tracking-[4px] uppercase text-gold-300 mb-3">Únete</span>
        <h2 className="font-serif text-[clamp(1.3rem,3vw,2rem)] tracking-widest text-cream-200 uppercase mb-3">Sé la primera en <em className="text-gold-300">saber</em></h2>
        <p className="font-sans text-[0.85rem] text-cream-200/70 mb-8">Lanzamientos exclusivos, descuentos y contenido para mujeres que se eligen.</p>
        <div className="flex max-w-md mx-auto flex-wrap justify-center">
          <input type="email" placeholder="Tu correo electrónico" className="flex-1 min-w-[200px] px-4 py-3 bg-white/10 border border-cream-200/30 text-cream-200 font-sans text-sm placeholder-cream-200/40 outline-none"/>
          <button className="bg-cream-200 text-wine-600 px-6 py-3 font-sans text-[0.7rem] tracking-widest uppercase font-bold hover:opacity-90 transition-opacity">Suscribirme</button>
        </div>
      </section>
    </main>
  )
}