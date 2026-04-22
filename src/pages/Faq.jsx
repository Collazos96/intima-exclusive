import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

const FAQS = [
  {
    pregunta: '¿Cómo sé cuál es mi talla?',
    respuesta: 'En la página de cada producto tienes un botón "Guía de tallas →" que abre nuestra tabla visual y numérica. Manejamos tallas S, M, L y XL. Si estás entre dos tallas, te recomendamos elegir la más grande para mayor comodidad. Si tienes dudas, escríbenos por WhatsApp con tus medidas (contorno de busto y cintura) y te decimos exactamente cuál pedir.',
  },
  {
    pregunta: '¿El empaque es discreto?',
    respuesta: 'Sí, totalmente. Enviamos en caja o bolsa opaca sin ningún logo ni referencia al contenido. Ni el repartidor ni quien reciba el paquete puede saber qué hay dentro. Es ideal si vives con familia, compañeros o quieres sorprender.',
  },
  {
    pregunta: '¿Cuánto tarda en llegar mi pedido?',
    respuesta: 'Preparamos tu pedido en 1 a 2 días hábiles y la transportadora lo entrega en 2 a 5 días hábiles dependiendo de tu ciudad. A Bogotá, Medellín, Cali y Barranquilla llega más rápido. A municipios pequeños puede tomar un día extra.',
  },
  {
    pregunta: '¿Puedo cambiar la talla si no me queda?',
    respuesta: 'Sí, aceptamos cambios por talla o color dentro de los 30 días posteriores a tu pedido, siempre que la prenda esté sin uso, en su empaque original y con etiquetas. Escríbenos por WhatsApp con tu número de pedido y coordinamos la recogida. Por razones de higiene, los pantys y accesorios íntimos no tienen cambio.',
  },
  {
    pregunta: '¿Cómo pago?',
    respuesta: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard), PSE, Nequi, Daviplata y contra entrega en las principales ciudades. Procesamos el pago por WhatsApp para confirmar disponibilidad antes del cobro.',
  },
  {
    pregunta: '¿Envían a todo Colombia?',
    respuesta: 'Sí, llegamos a todo el país por transportadora nacional. Si tu pedido supera $300.000 COP, el envío es gratis.',
  },
  {
    pregunta: '¿De qué materiales están hechas las prendas?',
    respuesta: 'Usamos encajes de alta calidad, elásticos suaves y herrajes en tono oro. Cada producto detalla su composición. La mayoría combinan poliamida y elastano para dar elasticidad sin perder forma.',
  },
  {
    pregunta: '¿Cómo lavo mis prendas para que duren más?',
    respuesta: 'Lava a mano con agua fría y jabón suave. No uses blanqueador ni suavizante. No retuerzas — presiona suavemente con una toalla limpia y seca al aire libre, a la sombra, en posición horizontal. Nada de secadora ni plancha directa sobre el encaje.',
  },
  {
    pregunta: '¿Hacen envíos a otros países?',
    respuesta: 'Por ahora enviamos únicamente dentro de Colombia. Si estás en el exterior y quieres que te enviemos a una dirección colombiana, con gusto lo coordinamos por WhatsApp.',
  },
  {
    pregunta: '¿Puedo pedir un diseño personalizado o una talla que no tienen disponible?',
    respuesta: 'Depende del diseño. Escríbenos por WhatsApp con la prenda que te interesa y te decimos si es posible. Algunas piezas se pueden hacer bajo medida con un plazo adicional.',
  },
]

export default function Faq() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.pregunta,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.respuesta,
      },
    })),
  }

  return (
    <main id="main" className="pt-[70px] min-h-screen bg-cream-50">
      <Seo
        title="Preguntas frecuentes"
        description="Resolvemos las dudas más comunes sobre tallas, envío discreto, cambios, pagos y cuidado de tus prendas íntimas."
        path="/faq"
        jsonLd={faqJsonLd}
      />
      <div className="bg-cream-200 border-b border-gold-300 text-center py-12 px-8">
        <nav aria-label="Breadcrumb" className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-400 mb-3">
          <Link to="/" className="text-wine-600 hover:underline">Inicio</Link>
          {' / '}<span aria-current="page">Preguntas frecuentes</span>
        </nav>
        <h1 className="font-serif text-[clamp(1.8rem,4vw,3rem)] tracking-widest uppercase text-wine-800">
          Preguntas <em className="text-wine-600">frecuentes</em>
        </h1>
        <p className="font-sans text-[0.85rem] text-taupe-600 mt-2 max-w-xl mx-auto">
          Todo lo que necesitas saber antes de comprar.
        </p>
        <div className="w-14 h-px bg-gold-500 mx-auto mt-4"/>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <dl className="space-y-6">
          {FAQS.map((f, i) => (
            <div key={i} className="bg-white border border-gold-300 p-5">
              <dt className="font-serif text-wine-800 text-lg mb-2">{f.pregunta}</dt>
              <dd className="font-sans text-[0.9rem] text-taupe-600 leading-relaxed">{f.respuesta}</dd>
            </div>
          ))}
        </dl>

        <div className="bg-cream-200 border-l-2 border-wine-500 px-5 py-4 mt-10">
          <p className="text-wine-900 font-sans text-sm">
            <strong>¿No encontraste tu respuesta?</strong> Escríbenos por WhatsApp al
            <a href="https://wa.me/573028556022" className="text-wine-600 hover:underline mx-1">+57 302 855 6022</a>
            y te respondemos en minutos.
          </p>
        </div>
      </div>
    </main>
  )
}
