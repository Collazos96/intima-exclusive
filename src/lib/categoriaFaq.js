import { CONTENIDO_CATEGORIA } from '../data/categoriaContenido'

/**
 * Genera el schema FAQPage (JSON-LD) desde el contenido de una categoría.
 * Devuelve null si la categoría no tiene FAQs.
 */
export function buildCategoriaFaqJsonLd(categoriaId) {
  const contenido = CONTENIDO_CATEGORIA[categoriaId]
  if (!contenido?.faqs?.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: contenido.faqs.map((f) => ({
      '@type': 'Question',
      name: f.pregunta,
      acceptedAnswer: { '@type': 'Answer', text: f.respuesta },
    })),
  }
}
