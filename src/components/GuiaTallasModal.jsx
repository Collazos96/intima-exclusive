import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import TablasTallas from './TablasTallas'

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

        <div className="px-6 py-6">
          <TablasTallas compact />
          <div className="mt-5 text-center">
            <Link
              to="/guia-tallas"
              onClick={onClose}
              className="font-sans text-[0.7rem] tracking-widest uppercase text-wine-600 underline hover:text-wine-800 transition-colors"
            >
              Ver guía completa con instrucciones de medición →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
