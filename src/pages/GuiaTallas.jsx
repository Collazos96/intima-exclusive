import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import TablasTallas from '../components/TablasTallas'

export default function GuiaTallas() {
  return (
    <main id="main" className="pt-[70px] min-h-screen bg-cream-50">
      <Seo
        title="Guía de tallas"
        description="Tabla de tallas de brassier y panty en centímetros. Equivalencias S/32, M/34, L/36, XL/38. Cómo medirte para acertar tu talla en lencería."
        path="/guia-tallas"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://intimaexclusive.com/' },
              { '@type': 'ListItem', position: 2, name: 'Guía de tallas' },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Guía de tallas — Íntima Exclusive',
            description: 'Tablas de tallas en centímetros y guía de medición para brassieres y pantys.',
            inLanguage: 'es-CO',
            url: 'https://intimaexclusive.com/guia-tallas',
          },
        ]}
      />
      <div className="bg-cream-200 border-b border-gold-300 text-center py-12 px-4 sm:px-8">
        <nav aria-label="Breadcrumb" className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-400 mb-3">
          <Link to="/" className="text-wine-600 hover:underline">Inicio</Link>
          {' / '}<span aria-current="page">Guía de tallas</span>
        </nav>
        <h1 className="font-serif text-[clamp(1.8rem,4vw,3rem)] tracking-widest uppercase text-wine-800">
          Guía de <em className="text-wine-600">tallas</em>
        </h1>
        <p className="font-sans text-[0.85rem] text-taupe-600 mt-2 max-w-xl mx-auto">
          Encuentra tu talla exacta con nuestras tablas de medidas y la guía
          paso a paso para medirte.
        </p>
        <div className="w-14 h-px bg-gold-500 mx-auto mt-4"/>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <TablasTallas showImages />

        <div className="mt-10 text-center">
          <a
            href="https://wa.me/573028556022"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-whatsapp-500 text-white px-8 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:opacity-90 transition-opacity"
          >
            📲 Consultar mi talla por WhatsApp
          </a>
        </div>
      </div>
    </main>
  )
}
