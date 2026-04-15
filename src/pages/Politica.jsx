import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

export default function Politica() {
  return (
    <main id="main" className="pt-[70px] min-h-screen bg-cream-50">
      <Seo
        title="Política de envíos, cambios y devoluciones"
        description="Políticas de envío discreto, cambios hasta 30 días, métodos de pago y garantía en Íntima Exclusive. Compra con total tranquilidad."
        path="/politica"
      />
      <div className="bg-cream-200 border-b border-gold-300 text-center py-12 px-8">
        <nav aria-label="Breadcrumb" className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-400 mb-3">
          <Link to="/" className="text-wine-600 hover:underline">Inicio</Link>
          {' / '}<span aria-current="page">Políticas</span>
        </nav>
        <h1 className="font-serif text-[clamp(1.8rem,4vw,3rem)] tracking-widest uppercase text-wine-800">
          Nuestras <em className="text-wine-600">políticas</em>
        </h1>
        <p className="font-sans text-[0.85rem] text-taupe-600 mt-2 max-w-xl mx-auto">
          Transparencia total sobre envíos, cambios, pagos y privacidad.
        </p>
        <div className="w-14 h-px bg-gold-500 mx-auto mt-4"/>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-12 font-sans text-[0.92rem] text-taupe-600 leading-relaxed space-y-10">
        <section aria-labelledby="envio">
          <h2 id="envio" className="font-serif text-wine-800 text-xl mb-3">Envío</h2>
          <p className="mb-3">
            Realizamos envíos a <strong>todo Colombia</strong> por transportadora nacional.
            El empaque es <strong>completamente discreto</strong>: sin logos ni referencias
            al contenido, para que solo tú sepas qué hay dentro.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Tiempo de preparación: 1 a 2 días hábiles</li>
            <li>Tiempo de tránsito: 2 a 5 días hábiles (según ciudad)</li>
            <li>Envío gratis en compras superiores a $250.000 COP</li>
            <li>Opción de contra entrega disponible en principales ciudades</li>
          </ul>
        </section>

        <section aria-labelledby="cambios">
          <h2 id="cambios" className="font-serif text-wine-800 text-xl mb-3">Cambios y devoluciones</h2>
          <p className="mb-3">
            Aceptamos cambios por <strong>talla o color dentro de los primeros 30 días</strong>
            después de recibir tu pedido, siempre que la prenda esté en su empaque original,
            con etiquetas y sin uso.
          </p>
          <p className="mb-3">
            Por razones de higiene, <strong>no aceptamos devoluciones en pantys ni accesorios
            íntimos</strong>. Para sets, corsets y bodys, el cambio es sencillo: escríbenos por
            WhatsApp al <a href="https://wa.me/573028556022" className="text-wine-600 hover:underline">+57 302 855 6022</a>
            {' '}con tu número de pedido y te coordinamos la recolección.
          </p>
          <p>
            Si la prenda llega con algún defecto de fabricación, la reponemos sin costo dentro
            de los 60 días posteriores.
          </p>
        </section>

        <section aria-labelledby="pago">
          <h2 id="pago" className="font-serif text-wine-800 text-xl mb-3">Métodos de pago</h2>
          <p className="mb-3">Aceptamos varias formas de pago, todas seguras:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Tarjetas de crédito y débito (Visa, Mastercard)</li>
            <li>PSE (transferencia bancaria directa)</li>
            <li>Nequi y Daviplata</li>
            <li>Contra entrega (efectivo al recibir)</li>
          </ul>
          <p className="mt-3">
            Procesamos los pagos directamente por WhatsApp para confirmar disponibilidad y
            tallas antes del cobro — así nunca pagas algo que no podamos enviarte.
          </p>
        </section>

        <section aria-labelledby="privacidad">
          <h2 id="privacidad" className="font-serif text-wine-800 text-xl mb-3">Privacidad</h2>
          <p className="mb-3">
            Respetamos tu privacidad. Solo pedimos la información necesaria para enviarte tu
            pedido: nombre, dirección, teléfono y correo (opcional para confirmación).
          </p>
          <p className="mb-3">
            <strong>No compartimos tus datos con terceros</strong> más allá de la transportadora
            para la entrega. No enviamos publicidad sin tu autorización.
          </p>
          <p>
            Si quieres que eliminemos tu información, escríbenos por WhatsApp y lo hacemos
            en menos de 48 horas.
          </p>
        </section>

        <section aria-labelledby="cuidado">
          <h2 id="cuidado" className="font-serif text-wine-800 text-xl mb-3">Cuidado de tus prendas</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Lava a mano con agua fría y jabón suave</li>
            <li>Evita blanqueadores y suavizantes</li>
            <li>No retuerzas — presiona con toalla limpia</li>
            <li>Seca al aire libre, a la sombra, en posición horizontal</li>
            <li>No uses secadora ni plancha directa</li>
          </ul>
        </section>

        <div className="bg-cream-200 border-l-2 border-wine-500 px-5 py-4 mt-8">
          <p className="text-wine-900">
            <strong>¿Dudas?</strong> Escríbenos por WhatsApp al
            <a href="https://wa.me/573028556022" className="text-wine-600 hover:underline mx-1">+57 302 855 6022</a>
            y te respondemos en minutos.
          </p>
        </div>
      </article>
    </main>
  )
}
