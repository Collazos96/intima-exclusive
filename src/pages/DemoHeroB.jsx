import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

/**
 * DEMO B — Hero "Cinematic Full-bleed"
 * Inspiración: Savage X Fenty, Aritzia, Kim Kardashian Skims
 * Foto full-screen con overlay oscuro + tipografía gigante centrada.
 * Impacto inmediato, muy "fashion campaign".
 */
export default function DemoHeroB() {
  return (
    <main id="main" className="min-h-screen">
      <Seo title="Demo B — Cinematic" path="/demo/b" />

      {/* HERO full-bleed */}
      <section className="relative min-h-[calc(100vh-70px)] mt-[70px] overflow-hidden bg-wine-900">
        {/* Foto de fondo */}
        <img
          src="https://images.intimaexclusive.com/SET-CARMINA-1.jpg"
          alt="Íntima Exclusive — Colección 2026"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        {/* Overlay degradado para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-wine-900/30 via-wine-900/45 to-wine-900/80" />
        {/* Overlay lateral para acentuar izquierda */}
        <div className="absolute inset-0 bg-gradient-to-r from-wine-900/40 via-transparent to-transparent" />

        {/* Contenido */}
        <div className="relative z-10 min-h-[calc(100vh-70px)] flex flex-col items-center justify-center text-center px-6 py-20">
          <span className="block font-body text-[0.72rem] tracking-[6px] uppercase text-gold-300 mb-8">
            Nueva colección 2026
          </span>

          <h1 className="font-display text-[clamp(3rem,10vw,8rem)] leading-[0.9] text-cream-50 mb-6 max-w-5xl">
            Delicadeza<br />
            que <em className="font-elegant italic font-light text-gold-300">empodera</em>
          </h1>

          <div className="flex items-center gap-4 justify-center mb-8">
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
            <Link
              to="/categoria/sets"
              className="bg-cream-50 text-wine-900 px-11 py-4 font-body text-[0.72rem] tracking-[3px] uppercase hover:bg-gold-300 transition-colors"
            >
              Descubrir colección
            </Link>
            <Link
              to="/nosotros"
              className="border border-cream-50 text-cream-50 px-11 py-4 font-body text-[0.72rem] tracking-[3px] uppercase hover:bg-cream-50 hover:text-wine-900 transition-all"
            >
              Nuestra historia
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-pulse">
            <span className="font-body text-[0.62rem] tracking-[4px] uppercase text-cream-50/70">Descubre</span>
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none" className="text-cream-50/70">
              <path d="M8 2V22M8 22L1 15M8 22L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Esquina: tag editorial */}
        <div className="absolute top-8 right-8 z-10 hidden sm:block">
          <div className="bg-cream-50/10 backdrop-blur-sm px-4 py-2 border border-cream-50/20">
            <p className="font-body text-[0.6rem] tracking-[3px] uppercase text-cream-50/90">Colección otoño</p>
          </div>
        </div>
      </section>

      {/* Nota demo */}
      <DemoFooter variante="B — Cinematic Full-bleed" />
    </main>
  )
}

function DemoFooter({ variante }) {
  return (
    <div className="bg-cream-100 text-taupe-600 p-6 text-center font-body text-sm">
      <p className="mb-3">
        Vista demo del hero <strong>{variante}</strong>
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link to="/demo/a" className="px-4 py-2 border border-wine-600 text-wine-600 text-[0.7rem] tracking-widest uppercase hover:bg-wine-600 hover:text-cream-200 transition-colors">
          Ver diseño A
        </Link>
        <Link to="/demo/b" className="px-4 py-2 border border-wine-600 text-wine-600 text-[0.7rem] tracking-widest uppercase hover:bg-wine-600 hover:text-cream-200 transition-colors">
          Ver diseño B
        </Link>
        <Link to="/" className="px-4 py-2 border border-gold-500 text-gold-500 text-[0.7rem] tracking-widest uppercase hover:bg-gold-500 hover:text-wine-900 transition-colors">
          Volver al actual
        </Link>
      </div>
    </div>
  )
}
