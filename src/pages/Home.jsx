import { useNavigate } from 'react-router-dom'
import { categorias, productos, formatPrecio } from '../data/productos'
import ProductCard from '../components/ProductCard'

const iconos = { sets:'🌸', corsets:'🪢', lenceria:'✨', bodys:'🎀', accesorios:'💎' }

export default function Home() {
  const nav = useNavigate()
  const destacados = productos.filter(p => p.nuevo)

  return (
    <main>
      {/* HERO */}
      <section className="min-h-screen flex items-center justify-center text-center relative bg-[#F5EDE0] px-8 pt-20 pb-16 overflow-hidden">
        <div className="absolute w-[680px] h-[680px] rounded-full border border-[#D9C4A8] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-35 pointer-events-none"/>
        <div className="absolute w-[480px] h-[480px] rounded-full border border-[#D9C4A8] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-25 pointer-events-none"/>
        <div className="relative z-10">
          <span className="block font-sans text-[0.65rem] tracking-[5px] uppercase text-[#C4A882] mb-5">Nueva colección 2026</span>
          <h1 className="font-serif text-[clamp(2rem,6vw,4.5rem)] tracking-widest leading-tight text-[#4E0F1C] uppercase mb-3">
            Para la mujer<br/>que se <em className="text-[#7B1A2E] normal-case">elige</em><br/>cada día
          </h1>
          <p className="font-serif italic text-[#7A5A60] text-lg mb-8">Delicadeza que empodera</p>
          <div className="flex items-center gap-4 justify-center mb-8">
            <div className="w-16 h-px bg-[#D9C4A8]"/>
            <span className="font-sans text-[0.62rem] tracking-[4px] uppercase text-[#C4A882]">Sets · Corsets · Lencería · Bodys · Accesorios</span>
            <div className="w-16 h-px bg-[#D9C4A8]"/>
          </div>
          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={() => nav('/categoria/sets')} className="bg-[#7B1A2E] text-[#F5EDE0] px-9 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-[#4E0F1C] transition-colors">Ver colección</button>
            <button onClick={() => document.getElementById('filosofia').scrollIntoView({behavior:'smooth'})} className="border border-[#7B1A2E] text-[#7B1A2E] px-9 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-[#7B1A2E] hover:text-[#F5EDE0] transition-all">Nuestra historia</button>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="py-20 px-8 bg-[#FFFDF9] text-center">
        <span className="block font-sans text-[0.62rem] tracking-[4px] uppercase text-[#C4A882] mb-3">Explora</span>
        <h2 className="font-serif text-[clamp(1.4rem,3vw,2.2rem)] text-[#3A1A20] mb-1">Nuestras <em className="text-[#7B1A2E]">categorías</em></h2>
        <div className="w-12 h-px bg-[#C4A882] mx-auto my-6"/>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
          {categorias.map(c => (
            <div key={c.id} onClick={() => nav(`/categoria/${c.id}`)}
              className="p-8 border border-[#D9C4A8] bg-[#FAF5EE] cursor-pointer hover:border-[#7B1A2E] hover:-translate-y-1 transition-all group">
              <span className="block text-3xl mb-3">{iconos[c.id]}</span>
              <h3 className="font-sans text-[0.75rem] tracking-widest uppercase text-[#3A1A20] mb-1">{c.nombre}</h3>
              <p className="font-sans text-[0.7rem] text-[#B09090]">{c.sub}</p>
              <span className="block text-[0.7rem] text-[#7B1A2E] mt-3 opacity-0 group-hover:opacity-100 transition-opacity">Ver →</span>
            </div>
          ))}
        </div>
      </section>

      {/* DESTACADOS */}
      <section className="py-20 px-8 bg-[#FAF5EE] text-center">
        <span className="block font-sans text-[0.62rem] tracking-[4px] uppercase text-[#C4A882] mb-3">Lo más deseado</span>
        <h2 className="font-serif text-[clamp(1.4rem,3vw,2.2rem)] text-[#3A1A20] mb-1">Colección <em className="text-[#7B1A2E]">destacada</em></h2>
        <div className="w-12 h-px bg-[#C4A882] mx-auto my-6"/>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {destacados.map(p => <ProductCard key={p.id} producto={p}/>)}
        </div>
      </section>

      {/* FILOSOFÍA */}
      <section id="filosofia" className="py-20 px-8 bg-[#F5EDE0] text-center">
        <span className="block font-sans text-[0.62rem] tracking-[4px] uppercase text-[#C4A882] mb-3">Nuestra esencia</span>
        <h2 className="font-serif text-[clamp(1.4rem,3vw,2.2rem)] text-[#3A1A20] mb-1">Elegirte es un acto de <em className="text-[#7B1A2E]">amor</em></h2>
        <div className="w-12 h-px bg-[#C4A882] mx-auto my-6"/>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
          {[['Sensualidad','Diseños que abrazan cada curva con elegancia y confianza.'],
            ['Calidad premium','Encajes de alta gama, suaves al tacto y delicados con tu piel.'],
            ['Tallas inclusivas','Toda mujer merece sentirse hermosa. XS hasta 4XL.'],
            ['Empoderamiento','Más que ropa: una actitud. Una forma de empezar el día contigo.']
          ].map(([t,d]) => (
            <div key={t} className="p-7 border border-[#D9C4A8] bg-[#FFFDF9]">
              <h3 className="font-sans text-[0.78rem] tracking-widest uppercase text-[#7B1A2E] mb-2">{t}</h3>
              <p className="font-sans text-[0.8rem] text-[#7A5A60] leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="py-20 px-8 bg-[#FFFDF9] text-center">
        <span className="block font-sans text-[0.62rem] tracking-[4px] uppercase text-[#C4A882] mb-3">¿Por qué elegirnos?</span>
        <h2 className="font-serif text-[clamp(1.4rem,3vw,2.2rem)] text-[#3A1A20] mb-1">Íntima, <em className="text-[#7B1A2E]">siempre contigo</em></h2>
        <div className="w-12 h-px bg-[#C4A882] mx-auto my-6"/>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
          {[['01','Envío a todo Colombia','Tu pedido empacado con elegancia directo en tu puerta.'],
            ['02','Cambios fáciles','30 días para cambios sin complicaciones.'],
            ['03','Pago seguro','Tarjetas, PSE, Nequi y contra entrega.'],
            ['04','Tallas inclusivas','Desde XS hasta 4XL para toda mujer.']
          ].map(([n,t,d]) => (
            <div key={n} className="p-6 border-t-2 border-[#A03048]">
              <span className="block font-serif italic text-[#7B1A2E] text-2xl mb-2">{n}</span>
              <h4 className="font-sans text-[0.72rem] tracking-widest uppercase text-[#3A1A20] mb-2">{t}</h4>
              <p className="font-sans text-[0.76rem] text-[#7A5A60] leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-20 px-8 bg-[#FAF5EE] text-center">
        <span className="block font-sans text-[0.62rem] tracking-[4px] uppercase text-[#C4A882] mb-3">Ellas hablan</span>
        <h2 className="font-serif text-[clamp(1.4rem,3vw,2.2rem)] text-[#3A1A20] mb-1">Lo que dicen nuestras <em className="text-[#7B1A2E]">clientas</em></h2>
        <div className="w-12 h-px bg-[#C4A882] mx-auto my-6"/>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {[['La calidad es increíble. Me lo puse y me sentí completamente diferente — más yo que nunca.','Valentina R., Bogotá'],
            ['Finalmente una marca que piensa en todas las tallas. Me queda como si lo hubieran hecho para mí.','Daniela M., Cali'],
            ['El empaque es una obra de arte y la atención al cliente es top. Compré tres veces y cada vez mejor.','Sofía L., Medellín']
          ].map(([t,n]) => (
            <div key={n} className="p-7 border-l-2 border-[#A03048] bg-[#FFFDF9] text-left">
              <div className="text-[#7B1A2E] tracking-widest mb-3">★★★★★</div>
              <p className="font-sans text-[0.82rem] text-[#7A5A60] leading-relaxed italic mb-3">"{t}"</p>
              <span className="font-sans text-[0.7rem] tracking-widest uppercase text-[#7B1A2E]">— {n}</span>
            </div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-20 px-8 bg-[#7B1A2E] text-center">
        <span className="block font-sans text-[0.62rem] tracking-[4px] uppercase text-[#D9C4A8] mb-3">Únete</span>
        <h2 className="font-serif text-[clamp(1.3rem,3vw,2rem)] tracking-widest text-[#F5EDE0] uppercase mb-3">Sé la primera en <em className="text-[#D9C4A8]">saber</em></h2>
        <p className="font-sans text-[0.85rem] text-[#F5EDE0]/70 mb-8">Lanzamientos exclusivos, descuentos y contenido para mujeres que se eligen.</p>
        <div className="flex max-w-md mx-auto flex-wrap justify-center">
          <input type="email" placeholder="Tu correo electrónico" className="flex-1 min-w-[200px] px-4 py-3 bg-white/10 border border-[#F5EDE0]/30 text-[#F5EDE0] font-sans text-sm placeholder-[#F5EDE0]/40 outline-none"/>
          <button className="bg-[#F5EDE0] text-[#7B1A2E] px-6 py-3 font-sans text-[0.7rem] tracking-widest uppercase font-bold hover:opacity-90 transition-opacity">Suscribirme</button>
        </div>
      </section>
    </main>
  )
}