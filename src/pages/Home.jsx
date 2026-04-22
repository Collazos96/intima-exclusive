import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCategorias, getProductos } from '../hooks/useApi'
import { qk } from '../lib/queryClient'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import { ProductGridSkeleton } from '../components/Skeletons'
import NewsletterForm from '../components/NewsletterForm'
import CategoriasBento from '../components/CategoriasBento'
import SocialProof from '../components/SocialProof'
import Reveal from '../components/Reveal'

export default function Home() {
  const nav = useNavigate()
  const { data: categorias = [] } = useQuery({
    queryKey: qk.categorias,
    queryFn: getCategorias,
  })
  const { data: productos = [], isLoading: cargandoProductos } = useQuery({
    queryKey: qk.productos,
    queryFn: getProductos,
  })
  const destacados = productos.filter(p => p.nuevo === 1)

  // Imagen representativa por categoría: primera imagen del primer producto de esa categoría
  const imagenesPorCategoria = categorias.reduce((acc, c) => {
    const prod = productos.find((p) => p.categoria_id === c.id && p.imagenes?.length)
    if (prod) acc[c.id] = prod.imagenes[0]
    return acc
  }, {})

  return (
    <main id="main">
      <Seo
        path="/"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: 'Íntima Exclusive',
            description: 'Lencería íntima premium hecha con amor en Colombia. Sets, corsets, bodys y accesorios. Tallas S a XL.',
            url: 'https://intimaexclusive.com',
            logo: {
              '@type': 'ImageObject',
              url: 'https://images.intimaexclusive.com/LOGO-INTIMA.jpg',
            },
            image: 'https://images.intimaexclusive.com/LOGO-INTIMA.jpg',
            telephone: '+57-302-855-6022',
            priceRange: '$$',
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'CO',
            },
            areaServed: { '@type': 'Country', name: 'Colombia' },
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+57-302-855-6022',
              contactType: 'customer service',
              availableLanguage: ['es'],
              areaServed: 'CO',
            },
            sameAs: ['https://www.instagram.com/intima_exclusive'],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Íntima Exclusive',
            url: 'https://intimaexclusive.com',
            inLanguage: 'es-CO',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://intimaexclusive.com/categoria/{search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          },
        ]}
      />
      {/* HERO — Cinematic Full-bleed */}
      <section className="relative min-h-[calc(100vh-70px)] mt-[70px] overflow-hidden bg-wine-900">
        {/* Video blureado de fondo — solo desktop, rellena costados */}
        <video
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          tabIndex={-1}
          className="hidden md:block absolute inset-0 w-full h-full object-cover blur-3xl scale-110 opacity-70 pointer-events-none"
        >
          <source src="https://images.intimaexclusive.com/hero.mp4" type="video/mp4" />
        </video>
        {/* Video principal — mobile llena, desktop centrado respetando aspecto */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="https://images.intimaexclusive.com/SET-CARMINA-1.jpg"
          aria-label="Íntima Exclusive — Colección 2026"
          className="absolute inset-0 w-full h-full object-cover md:object-contain"
        >
          <source src="https://images.intimaexclusive.com/hero.mp4" type="video/mp4" />
        </video>
        {/* Overlays para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-wine-900/30 via-wine-900/45 to-wine-900/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-wine-900/40 via-transparent to-transparent" />

        <div className="relative z-10 min-h-[calc(100vh-70px)] flex flex-col items-center justify-center text-center px-6 py-20">
          <span className="block font-body text-[0.72rem] tracking-[6px] uppercase text-gold-300 mb-8">
            Nueva colección 2026
          </span>

          <h1 className="font-display text-[clamp(3rem,10vw,8rem)] leading-[0.9] text-cream-50 mb-6 max-w-5xl">
            Delicadeza<br />
            que <em className="font-elegant italic font-light text-gold-300">empodera</em>
          </h1>

          <div className="flex items-center gap-4 justify-center mb-8 flex-wrap">
            <div className="w-12 h-px bg-gold-300 opacity-60" />
            <span className="font-body text-[0.68rem] tracking-[4px] uppercase text-cream-200/80">
              Sets · Corsets · Lencería · Bodys
            </span>
            <div className="w-12 h-px bg-gold-300 opacity-60" />
          </div>

          <p className="font-body text-cream-200/80 text-base lg:text-lg max-w-xl mb-12 leading-relaxed">
            Lencería hecha con amor en Colombia para la mujer que se elige cada día.
          </p>

          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => nav('/categoria/sets')}
              className="bg-cream-50 text-wine-900 px-11 py-4 font-body text-[0.72rem] tracking-[3px] uppercase hover:bg-gold-300 transition-colors"
            >
              Descubrir colección
            </button>
            <button
              onClick={() => document.getElementById('filosofia').scrollIntoView({ behavior: 'smooth' })}
              className="border border-cream-50 text-cream-50 px-11 py-4 font-body text-[0.72rem] tracking-[3px] uppercase hover:bg-cream-50 hover:text-wine-900 transition-all"
            >
              Nuestra historia
            </button>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-pulse">
            <span className="font-body text-[0.62rem] tracking-[4px] uppercase text-cream-50/70">Descubre</span>
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none" className="text-cream-50/70" aria-hidden="true">
              <path d="M8 2V22M8 22L1 15M8 22L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Tag editorial */}
        <div className="absolute top-8 right-8 z-10 hidden sm:block">
          <div className="bg-cream-50/10 backdrop-blur-sm px-4 py-2 border border-cream-50/20">
            <p className="font-body text-[0.6rem] tracking-[3px] uppercase text-cream-50/90">Colección otoño</p>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS — Bento */}
      <section className="py-20 px-4 sm:px-6 bg-cream-50 text-center">
        <Reveal>
          <span className="block font-body text-[0.62rem] tracking-[4px] uppercase text-gold-500 mb-3">Explora</span>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] text-wine-900 mb-1">
            Nuestras <em className="font-elegant italic text-wine-600">categorías</em>
          </h2>
          <div className="w-12 h-px bg-gold-500 mx-auto my-6"/>
        </Reveal>
        <Reveal delay={100}>
          <CategoriasBento categorias={categorias} imagenesPorCategoria={imagenesPorCategoria} />
        </Reveal>
      </section>

      {/* SOCIAL PROOF — solo si hay 3+ reseñas */}
      <SocialProof />

      {/* DESTACADOS */}
      <section className="py-20 px-8 bg-cream-100 text-center">
        <Reveal>
          <span className="block font-body text-[0.62rem] tracking-[4px] uppercase text-gold-500 mb-3">Lo más deseado</span>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] text-wine-900 mb-1">
            Colección <em className="font-elegant italic text-wine-600">destacada</em>
          </h2>
          <div className="w-12 h-px bg-gold-500 mx-auto my-6"/>
        </Reveal>
        {cargandoProductos ? <ProductGridSkeleton count={3} /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {destacados.map((p, i) => (
              <Reveal key={p.id} delay={i * 100}>
                <ProductCard producto={p} priority={i < 3}/>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* FILOSOFÍA */}
      <section id="filosofia" className="py-20 px-8 bg-cream-200 text-center">
        <span className="block font-sans text-[0.62rem] tracking-[4px] uppercase text-gold-500 mb-3">Nuestra esencia</span>
        <h2 className="font-serif text-[clamp(1.4rem,3vw,2.2rem)] text-wine-900 mb-1">Elegirte es un acto de <em className="text-wine-600">amor</em></h2>
        <div className="w-12 h-px bg-gold-500 mx-auto my-6"/>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
          {[['Sensualidad','Diseños que abrazan cada curva con elegancia y confianza.'],
            ['Calidad premium','Encajes de alta gama, suaves al tacto y delicados con tu piel.'],
            ['Diseño cuidado','Cada prenda pensada para el confort, el ajuste y la duración.'],
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
            ['03','Pago seguro','Tarjetas, PSE, Nequi y Bancolombia.'],
            ['04','Atención personal','Te respondemos por WhatsApp con tus dudas de talla o estilo.']
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
            ['🔒','Pago seguro','Tarjetas, PSE, Nequi o Bancolombia'],
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


      {/* NEWSLETTER */}
      <section className="py-20 px-8 bg-wine-600 text-center">
        <span className="block font-sans text-[0.62rem] tracking-[4px] uppercase text-gold-300 mb-3">Únete</span>
        <h2 className="font-serif text-[clamp(1.3rem,3vw,2rem)] tracking-widest text-cream-200 uppercase mb-3">Sé la primera en <em className="text-gold-300">saber</em></h2>
        <p className="font-sans text-[0.85rem] text-cream-200/70 mb-8">Lanzamientos exclusivos, descuentos y contenido para mujeres que se eligen.</p>
        <NewsletterForm />
      </section>
    </main>
  )
}