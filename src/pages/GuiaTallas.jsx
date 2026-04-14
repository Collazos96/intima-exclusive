import { useNavigate } from 'react-router-dom'

export default function GuiaTallas() {
  const nav = useNavigate()
  return (
    <main className="pt-[70px] min-h-screen">
      <div className="bg-[#F5EDE0] border-b border-[#D9C4A8] text-center py-12 px-8">
        <p className="font-sans text-[0.68rem] tracking-widest uppercase text-[#B09090] mb-3">
          <span onClick={() => nav('/')} className="text-[#7B1A2E] cursor-pointer hover:underline">Inicio</span>
          {' / '}Guía de tallas
        </p>
        <h1 className="font-serif text-[clamp(1.8rem,4vw,3rem)] tracking-widest uppercase text-[#4E0F1C]">
          <em className="text-[#7B1A2E]">Guía de tallas</em>
        </h1>
        <div className="w-14 h-px bg-[#C4A882] mx-auto mt-4"/>
      </div>
      <div className="max-w-2xl mx-auto px-8 py-12 font-sans text-[0.88rem] text-[#7A5A60] leading-relaxed">
        <img src="https://i.ibb.co/5ZNt1P0/guia-talla.png" alt="Guía de tallas" className="w-full border border-[#D9C4A8] mb-8"/>
        <h2 className="font-serif text-[#4E0F1C] text-xl mb-4">¿Cómo saber tu talla?</h2>
        <p className="mb-4">En la parte superior de nuestros brassieres manejamos:</p>
        <img src="https://i.ibb.co/1YNw4rhT/tabla.png" alt="Tabla de tallas" className="w-full border border-[#D9C4A8] mb-6"/>
        <p>La mayoría de nuestros pantys son ajustables, por lo cual se pueden graduar a los lados y se adaptan cómodamente a diferentes tallas.</p>
        <button onClick={() => nav(-1)} className="mt-8 border border-[#7B1A2E] text-[#7B1A2E] px-8 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-[#7B1A2E] hover:text-[#F5EDE0] transition-all">
          ← Volver
        </button>
      </div>
    </main>
  )
}