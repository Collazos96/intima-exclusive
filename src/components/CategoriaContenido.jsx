import { CONTENIDO_CATEGORIA } from '../data/categoriaContenido'

/**
 * Renderiza contenido editorial de una categoría (intro + bloques).
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
    </article>
  )
}
