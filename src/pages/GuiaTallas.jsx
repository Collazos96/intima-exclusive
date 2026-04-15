import { useNavigate } from 'react-router-dom'
import Seo from '../components/Seo'

export default function GuiaTallas() {
  const nav = useNavigate()
  return (
    <main id="main" className="pt-[70px] min-h-screen">
      <Seo
        title="Guía de tallas"
        description="Cómo elegir tu talla en Íntima Exclusive. Tallas XS a 4XL, guía visual de brassieres y pantys."
        path="/guia-tallas"
      />
      <div className="bg-cream-200 border-b border-gold-300 text-center py-12 px-8">
        <p className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-400 mb-3">
          <span onClick={() => nav('/')} className="text-wine-600 cursor-pointer hover:underline">Inicio</span>
          {' / '}Guía de tallas
        </p>
        <h1 className="font-serif text-[clamp(1.8rem,4vw,3rem)] tracking-widest uppercase text-wine-800">
          <em className="text-wine-600">Guía de tallas</em>
        </h1>
        <div className="w-14 h-px bg-gold-500 mx-auto mt-4"/>
      </div>
      <div className="max-w-2xl mx-auto px-8 py-12 font-sans text-[0.88rem] text-taupe-600 leading-relaxed">
        <img src="https://images.intimaexclusive.com/GUIA-TALLAS.png" alt="Guía de tallas" className="w-full border border-gold-300 mb-8"/>
        <h2 className="font-serif text-wine-800 text-xl mb-4">¿Cómo saber tu talla?</h2>
        <p className="mb-4">En la parte superior de nuestros brassieres manejamos:</p>
        <img src="https://images.intimaexclusive.com/tabla.png" alt="Tabla de tallas" className="w-full border border-gold-300 mb-6"/>
        <p>La mayoría de nuestros pantys son ajustables, por lo cual se pueden graduar a los lados y se adaptan cómodamente a diferentes tallas.</p>
        <button onClick={() => nav(-1)} className="mt-8 border border-wine-600 text-wine-600 px-8 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-wine-600 hover:text-cream-200 transition-all">
          ← Volver
        </button>
      </div>
    </main>
  )
}