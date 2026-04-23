import { CONTENIDO_CATEGORIA } from '../data/categoriaContenido'

/**
 * Renderiza contenido editorial + FAQ de una categoría.
 * Si la categoría no tiene contenido, no renderiza nada.
 */
export default function CategoriaContenido({ categoriaId }) {
  const contenido = CONTENIDO_CATEGORIA[categoriaId]
  if (!contenido) return null

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-0 mt-2 mb-10 font-sans text-[0.92rem] text-taupe-600 leading-relaxed">
      <p
        className="text-center"
        dangerouslySetInnerHTML={{ __html: contenido.intro }}
      />

      <div className="mt-10 space-y-8">
        {contenido.bloques.map((b) => (
          <section key={b.titulo}>
            <h2 className="font-serif text-wine-800 text-xl mb-2">{b.titulo}</h2>
            <p>{b.texto}</p>
          </section>
        ))}
      </div>

      {contenido.faqs?.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-wine-800 text-xl mb-4 text-center">
            Preguntas frecuentes sobre esta categoría
          </h2>
          <dl className="space-y-4">
            {contenido.faqs.map((f, i) => (
              <div key={i} className="bg-cream-50 border border-gold-300 p-4">
                <dt className="font-serif text-wine-900 mb-1">{f.pregunta}</dt>
                <dd className="text-[0.88rem]">{f.respuesta}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </article>
  )
}
