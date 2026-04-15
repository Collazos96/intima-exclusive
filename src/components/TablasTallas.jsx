import { TALLAS_BRA, TALLAS_PANTY, COMO_MEDIR } from '../data/guiaTallas'

/**
 * Tablas de tallas con HTML semántico y accesible.
 * Indexable por bots y leíble por screen readers.
 *
 * Props:
 *   compact: si es true, oculta secciones largas (para usar en modal)
 *   showImages: si es true, renderiza también las imágenes de referencia
 */
export default function TablasTallas({ compact = false, showImages = false }) {
  return (
    <div className="font-sans text-[0.9rem] text-taupe-600 leading-relaxed space-y-8">
      {/* BRA */}
      <section aria-labelledby="tallas-bra-title">
        <h2 id="tallas-bra-title" className="font-serif text-wine-800 text-xl mb-3">
          Tallas de brassier
        </h2>
        <p className="mb-3">
          Equivalencias entre talla letra, talla numérica y medidas en centímetros.
          La talla se define principalmente por el contorno de la base.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[0.85rem]">
            <caption className="sr-only">Tabla de tallas de brassier en centímetros</caption>
            <thead>
              <tr className="bg-cream-200 text-wine-900 uppercase text-[0.7rem] tracking-widest">
                <th scope="col" className="p-3 text-left border border-gold-300">Talla</th>
                <th scope="col" className="p-3 text-left border border-gold-300">Equivalente</th>
                <th scope="col" className="p-3 text-left border border-gold-300">Contorno busto</th>
                <th scope="col" className="p-3 text-left border border-gold-300">Contorno base</th>
              </tr>
            </thead>
            <tbody>
              {TALLAS_BRA.map((t) => (
                <tr key={t.talla} className="even:bg-cream-50">
                  <th scope="row" className="p-3 border border-gold-300 font-serif text-wine-900">{t.talla}</th>
                  <td className="p-3 border border-gold-300">{t.equivalente}</td>
                  <td className="p-3 border border-gold-300">{t.busto}</td>
                  <td className="p-3 border border-gold-300">{t.base}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showImages && (
          <img
            src="https://images.intimaexclusive.com/tabla.png"
            alt="Tabla visual de medidas para brassier"
            loading="lazy"
            className="w-full border border-gold-300 mt-4"
          />
        )}
      </section>

      {/* PANTY */}
      <section aria-labelledby="tallas-panty-title">
        <h2 id="tallas-panty-title" className="font-serif text-wine-800 text-xl mb-3">
          Tallas de panty
        </h2>
        <p className="mb-3">
          La mayoría de nuestros pantys son ajustables a los lados, así que se
          adaptan cómodamente a varias tallas dentro del mismo rango.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[0.85rem]">
            <caption className="sr-only">Tabla de tallas de panty en centímetros</caption>
            <thead>
              <tr className="bg-cream-200 text-wine-900 uppercase text-[0.7rem] tracking-widest">
                <th scope="col" className="p-3 text-left border border-gold-300">Talla</th>
                <th scope="col" className="p-3 text-left border border-gold-300">Talla jean</th>
                <th scope="col" className="p-3 text-left border border-gold-300">Contorno cadera</th>
              </tr>
            </thead>
            <tbody>
              {TALLAS_PANTY.map((t) => (
                <tr key={t.talla} className="even:bg-cream-50">
                  <th scope="row" className="p-3 border border-gold-300 font-serif text-wine-900">{t.talla}</th>
                  <td className="p-3 border border-gold-300">{t.jean}</td>
                  <td className="p-3 border border-gold-300">{t.cadera}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CÓMO MEDIR */}
      {!compact && (
        <section aria-labelledby="como-medir-title">
          <h2 id="como-medir-title" className="font-serif text-wine-800 text-xl mb-3">
            Cómo medirte
          </h2>
          <p className="mb-3">
            Con una cinta métrica suave, frente al espejo y sobre la piel
            (sin ropa encima):
          </p>
          <dl className="space-y-3">
            {COMO_MEDIR.map((m) => (
              <div key={m.titulo} className="bg-cream-100 border-l-2 border-wine-500 px-4 py-3">
                <dt className="font-serif text-wine-900 mb-1">{m.titulo}</dt>
                <dd>{m.texto}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* TIP */}
      <div className="bg-cream-200 border-l-2 border-wine-500 px-4 py-3">
        <p className="text-wine-900">
          <strong>Tip:</strong> Si estás entre dos tallas, te recomendamos elegir la más
          grande para mayor comodidad. Si tienes dudas, escríbenos por WhatsApp con tus
          medidas y te decimos cuál pedir.
        </p>
      </div>
    </div>
  )
}
