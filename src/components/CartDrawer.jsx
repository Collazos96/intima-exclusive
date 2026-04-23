import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useCart, lineKey } from '../lib/cartStore'

const formatPrecio = (p) => '$' + p.toLocaleString('es-CO')

export default function CartDrawer() {
  const nav = useNavigate()
  const { items, isOpen, close, updateCantidad, removeItem, clear, totalItems, totalPrecio } = useCart()

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') close() }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  function irACheckout() {
    if (!items.length) return
    close()
    nav('/checkout')
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={close}
        aria-hidden={!isOpen}
        className={`fixed inset-0 bg-wine-900/60 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-cream-50 z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="px-6 py-5 border-b border-gold-300 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl text-wine-900">Tu selección</h2>
            <p className="font-sans text-[0.7rem] tracking-widest uppercase text-taupe-600">
              {totalItems()} {totalItems() === 1 ? 'prenda' : 'prendas'}
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Cerrar carrito"
            className="w-9 h-9 flex items-center justify-center text-wine-900 hover:bg-cream-200 transition-colors"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-serif text-gold-500 text-3xl mb-3">🌸</p>
              <p className="font-sans text-[0.85rem] text-taupe-600 italic">Tu selección está vacía.</p>
              <p className="font-sans text-[0.75rem] text-taupe-400 mt-1">Añade prendas y pídelas juntas por WhatsApp.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((i) => {
                const key = lineKey(i)
                return (
                  <li key={key} className="flex gap-3 border-b border-gold-300 pb-4">
                    <img
                      src={i.imagen}
                      alt={i.nombre}
                      className="w-20 h-24 object-cover border border-gold-300"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-[0.95rem] text-wine-900 leading-tight truncate">{i.nombre}</p>
                      <p className="font-sans text-[0.7rem] text-taupe-600 mt-1">
                        {i.color} · Talla {i.talla}
                      </p>
                      <p className="font-sans font-bold text-wine-600 text-sm mt-1">
                        {formatPrecio(i.precio)}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-gold-300">
                          <button
                            onClick={() => updateCantidad(key, i.cantidad - 1)}
                            aria-label="Disminuir cantidad"
                            className="w-7 h-7 text-wine-900 hover:bg-cream-200 transition-colors"
                          >−</button>
                          <span className="w-8 text-center font-sans text-sm text-wine-900">{i.cantidad}</span>
                          <button
                            onClick={() => updateCantidad(key, i.cantidad + 1)}
                            aria-label="Aumentar cantidad"
                            className="w-7 h-7 text-wine-900 hover:bg-cream-200 transition-colors"
                          >+</button>
                        </div>
                        <button
                          onClick={() => removeItem(key)}
                          className="ml-auto font-sans text-[0.7rem] text-taupe-600 underline hover:text-wine-600 transition-colors"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-gold-300 px-6 py-4 bg-cream-100">
            <div className="flex items-center justify-between mb-4">
              <span className="font-sans text-[0.7rem] tracking-widest uppercase text-taupe-600">Total</span>
              <span className="font-serif text-xl text-wine-800">{formatPrecio(totalPrecio())}</span>
            </div>
            <button
              onClick={irACheckout}
              className="w-full bg-wine-600 text-cream-200 py-3.5 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-wine-800 transition-colors mb-2 flex items-center justify-center gap-2"
            >
              <Lock size={14} strokeWidth={1.5} aria-hidden="true" />
              Pagar con Wompi
            </button>
            <button
              onClick={clear}
              className="w-full py-2.5 font-sans text-[0.7rem] tracking-widest uppercase text-taupe-600 hover:text-wine-600 transition-colors"
            >
              Vaciar selección
            </button>
            <p className="font-sans text-[0.7rem] text-taupe-400 text-center mt-2 italic">
              Tarjeta · PSE · Nequi · Bancolombia · Envío discreto
            </p>
          </footer>
        )}
      </aside>
    </>
  )
}
