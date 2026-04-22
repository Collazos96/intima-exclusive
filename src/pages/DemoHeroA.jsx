import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

/**
 * DEMO A — Hero "Editorial Magazine"
 * Inspiración: Vogue, Aesop, The Row
 * Split 50/50 en desktop, foto apilada arriba en mobile.
 * Tipografía Playfair Display (display serif) + Inter (sans clean) + Cormorant italic.
 */
export default function DemoHeroA() {
  return (
    <main id="main" className="min-h-screen">
      <Seo title="Demo A — Editorial" path="/demo/a" />

      {/* HERO */}
      <section className="min-h-[calc(100vh-70px)] mt-[70px] bg-cream-50 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] items-stretch">
        {/* Lado izquierdo: texto editorial */}
        <div className="flex items-center px-8 lg:px-16 xl:px-24 py-16 lg:py-0 order-2 lg:order-1">
          <div className="max-w-lg">
            <span className="block font-body text-[0.7rem] tracking-[6px] uppercase text-gold-500 mb-8">
              Colección 2026 · Nuevos ingresos
            </span>

            <h1 className="font-display text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.95] text-wine-900 mb-8">
              Para la mujer<br />
              que se <em className="font-elegant italic font-light text-wine-600">elige</em><br />
              cada día.
            </h1>

            <p className="font-body text-taupe-600 text-base lg:text-lg leading-relaxed mb-10 max-w-md">
              Lencería premium hecha con amor en Colombia. Encajes delicados,
              acabados en oro, tallas S a XL.
            </p>

            <div className="flex gap-3 flex-wrap items-center mb-10">
              <Link
                to="/categoria/sets"
                className="bg-wine-600 text-cream-200 px-9 py-4 font-body text-[0.72rem] tracking-[3px] uppercase hover:bg-wine-800 transition-colors"
              >
                Ver colección
              </Link>
              <Link
                to="/nosotros"
                className="border border-wine-600 text-wine-600 px-9 py-4 font-body text-[0.72rem] tracking-[3px] uppercase hover:bg-wine-600 hover:text-cream-200 transition-all"
              >
                Nuestra historia
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-8 border-t border-gold-300 max-w-md">
              <div className="flex gap-0.5 text-wine-600 text-sm tracking-widest">★★★★★</div>
              <p className="font-body text-[0.8rem] text-taupe-600">
                <strong className="text-wine-900">4.9 / 5</strong>
                <span className="text-taupe-400"> · reseñas verificadas de clientas</span>
              </p>
            </div>
          </div>
        </div>

        {/* Lado derecho: foto editorial */}
        <div className="relative overflow-hidden bg-wine-900 order-1 lg:order-2 min-h-[55vh] lg:min-h-0">
          <img
            src="https://images.intimaexclusive.com/SET-CARMINA.jpg"
            alt="Íntima Exclusive — Set Carmina"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          {/* Etiqueta del producto tipo editorial */}
          <div className="absolute bottom-8 right-8 bg-cream-50/95 backdrop-blur-sm px-5 py-3 shadow-xl">
            <p className="font-body text-[0.6rem] tracking-[3px] uppercase text-gold-500 mb-1">En foto</p>
            <p className="font-display text-wine-900 text-lg">Set Carmina</p>
            <Link
              to="/producto/carmina"
              className="font-body text-[0.68rem] text-wine-600 underline hover:text-wine-800"
            >
              $189.000 — ver pieza →
            </Link>
          </div>
          {/* Marca esquina superior */}
          <div className="absolute top-8 left-8">
            <p className="font-display italic text-cream-50/80 text-sm tracking-widest">Colección 2026</p>
          </div>
        </div>
      </section>

      {/* Nota visible solo en demo */}
      <DemoFooter variante="A — Editorial Magazine" />
    </main>
  )
}

function DemoFooter({ variante }) {
  return (
    <div className="bg-wine-900 text-cream-200 p-6 text-center font-body text-sm">
      <p className="mb-3">
        Vista demo del hero <strong>{variante}</strong>
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link to="/demo/a" className="px-4 py-2 border border-cream-200 text-[0.7rem] tracking-widest uppercase hover:bg-cream-200 hover:text-wine-900 transition-colors">
          Ver diseño A
        </Link>
        <Link to="/demo/b" className="px-4 py-2 border border-cream-200 text-[0.7rem] tracking-widest uppercase hover:bg-cream-200 hover:text-wine-900 transition-colors">
          Ver diseño B
        </Link>
        <Link to="/" className="px-4 py-2 border border-gold-300 text-gold-300 text-[0.7rem] tracking-widest uppercase hover:bg-gold-300 hover:text-wine-900 transition-colors">
          Volver al actual
        </Link>
      </div>
    </div>
  )
}
