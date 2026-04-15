import { useEffect, useRef } from 'react'

export default function GuiaTallasModal({ open, onClose }) {
  const closeBtnRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()

    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guia-tallas-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-wine-900/70"
      />
      <div className="relative bg-cream-50 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <header className="sticky top-0 bg-cream-50 border-b border-gold-300 px-6 py-4 flex items-center justify-between">
          <h2 id="guia-tallas-title" className="font-serif text-xl text-wine-900">
            Guía de <em className="text-wine-600">tallas</em>
          </h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Cerrar guía de tallas"
            className="w-9 h-9 flex items-center justify-center text-wine-900 hover:bg-cream-200 transition-colors"
          >
            ✕
          </button>
        </header>

        <div className="px-6 py-6 font-sans text-[0.88rem] text-taupe-600 leading-relaxed">
          <img
            src="https://images.intimaexclusive.com/GUIA-TALLAS.png"
            alt="Guía visual de tallas"
            loading="lazy"
            className="w-full border border-gold-300 mb-6"
          />

          <h3 className="font-serif text-wine-800 text-lg mb-2">¿Cómo saber tu talla?</h3>
          <p className="mb-3">En la parte superior de nuestros brassieres manejamos:</p>
          <img
            src="https://images.intimaexclusive.com/tabla.png"
            alt="Tabla de tallas"
            loading="lazy"
            className="w-full border border-gold-300 mb-4"
          />
          <p className="mb-6">
            La mayoría de nuestros pantys son ajustables: se gradúan a los lados y
            se adaptan cómodamente a distintas tallas.
          </p>

          <div className="bg-cream-200 border-l-2 border-wine-500 px-4 py-3">
            <p className="font-sans text-[0.8rem] text-wine-900">
              <strong>Tip:</strong> Si estás entre dos tallas, te recomendamos elegir la más grande
              para mayor comodidad. ¿Dudas? Escríbenos por WhatsApp y te ayudamos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
