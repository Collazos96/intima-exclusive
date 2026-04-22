import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

/**
 * NOTA: Esta página contiene contenido inicial genérico. Personalízala con:
 * - Nombre de la fundadora / equipo
 * - Ciudad de origen
 * - Año de fundación
 * - Historia real de la marca
 * - Fotos propias
 */
export default function Nosotros() {
  return (
    <main id="main" className="pt-[70px] min-h-screen bg-cream-50">
      <Seo
        title="Nuestra historia"
        description="Íntima Exclusive nace en Colombia con la misión de crear lencería premium que celebre a toda mujer, en todas las tallas."
        path="/nosotros"
      />
      <div className="bg-cream-200 border-b border-gold-300 text-center py-12 px-4 sm:px-8">
        <nav aria-label="Breadcrumb" className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-400 mb-3">
          <Link to="/" className="text-wine-600 hover:underline">Inicio</Link>
          {' / '}<span aria-current="page">Nuestra historia</span>
        </nav>
        <h1 className="font-serif text-[clamp(1.8rem,4vw,3rem)] tracking-widest uppercase text-wine-800">
          Nuestra <em className="text-wine-600">historia</em>
        </h1>
        <div className="w-14 h-px bg-gold-500 mx-auto mt-4"/>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-12 font-sans text-[0.95rem] text-taupe-600 leading-relaxed space-y-8">
        <section>
          <p className="font-serif italic text-wine-600 text-xl mb-6">
            "Creemos que cada mujer merece sentirse hermosa desde adentro — empezando por lo
            que nadie más ve."
          </p>
          <p>
            <strong>Íntima Exclusive</strong> nace en Colombia con una intención clara: crear
            lencería que celebre a toda mujer, sin importar la talla, la edad o el momento de
            la vida. Nos inspira la idea de que lo íntimo es un acto de amor propio — una
            pequeña decisión cotidiana que cambia cómo te sientes.
          </p>
        </section>

        <section aria-labelledby="mision">
          <h2 id="mision" className="font-serif text-wine-800 text-xl mb-3">Nuestra misión</h2>
          <p>
            Diseñar y producir lencería íntima premium, cómoda y sensual, con acabados de alta
            calidad y precios justos. Queremos que cada prenda que sale de nuestro taller sea
            una invitación a elegirte cada día.
          </p>
        </section>

        <section aria-labelledby="valores">
          <h2 id="valores" className="font-serif text-wine-800 text-xl mb-3">Lo que nos mueve</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              ['Ajuste preciso', 'Tallas S, M, L y XL con patrones pensados para el cuerpo real.'],
              ['Calidad', 'Encajes premium, herrajes tono oro, costuras revisadas una por una.'],
              ['Cercanía', 'Te respondemos por WhatsApp. Aquí hay alguien que te escucha.'],
              ['Discreción', 'Todo empaque es discreto. Tu compra es solo tuya.'],
            ].map(([titulo, desc]) => (
              <div key={titulo} className="border border-gold-300 p-4 bg-cream-100">
                <h3 className="font-sans text-[0.75rem] tracking-widest uppercase text-wine-600 mb-1">
                  {titulo}
                </h3>
                <p className="font-sans text-[0.85rem] text-taupe-600">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="hecho-en-colombia">
          <h2 id="hecho-en-colombia" className="font-serif text-wine-800 text-xl mb-3">
            Hecho con amor en Colombia
          </h2>
          <p>
            Nuestras prendas se confeccionan en Colombia, apoyando el trabajo local y
            garantizando acabados que cumplen nuestros estándares. Revisamos cada pieza antes
            de enviarla para que llegue exactamente como la imaginaste.
          </p>
        </section>

        <section aria-labelledby="contacto" className="pt-6 border-t border-gold-300">
          <h2 id="contacto" className="font-serif text-wine-800 text-xl mb-3">Hablemos</h2>
          <p className="mb-4">
            La mejor manera de conocernos es conversando. Escríbenos por WhatsApp con
            cualquier pregunta — sobre un producto, una talla, o lo que se te ocurra.
          </p>
          <a
            href="https://wa.me/573028556022"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-whatsapp-500 text-white px-8 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:opacity-90 transition-opacity"
          >
            📲 Escríbenos por WhatsApp
          </a>
          <p className="mt-4 font-sans text-[0.78rem] text-taupe-600">
            También nos encuentras en{' '}
            <a
              href="https://www.instagram.com/intima_exclusive"
              target="_blank"
              rel="noopener noreferrer"
              className="text-wine-600 hover:underline"
            >
              Instagram
            </a>.
          </p>
        </section>
      </article>
    </main>
  )
}
