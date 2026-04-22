import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useWishlist } from '../lib/wishlistStore'
import { useCart } from '../lib/cartStore'
import Seo from '../components/Seo'
import Img from '../components/Img'

const formatPrecio = (p) => '$' + p.toLocaleString('es-CO')

export default function Favoritos() {
  const items = useWishlist((s) => s.items)
  const remove = useWishlist((s) => s.remove)
  const clear = useWishlist((s) => s.clear)
  const openCart = useCart((s) => s.open)

  return (
    <main id="main" className="pt-[70px] min-h-screen">
      <Seo title="Favoritos" path="/favoritos" />
      <div className="bg-cream-200 border-b border-gold-300 text-center py-12 px-4 sm:px-8">
        <nav aria-label="Breadcrumb" className="font-sans text-[0.68rem] tracking-widest uppercase text-taupe-400 mb-3">
          <Link to="/" className="text-wine-600 hover:underline">Inicio</Link>
          {' / '}<span aria-current="page">Favoritos</span>
        </nav>
        <h1 className="font-serif text-[clamp(1.8rem,4vw,3rem)] tracking-widest uppercase text-wine-800">
          Mis <em className="text-wine-600">favoritos</em>
        </h1>
        <p className="font-sans text-[0.85rem] text-taupe-600 mt-2">
          {items.length === 0
            ? 'Guarda las prendas que te encantan para verlas después'
            : `${items.length} ${items.length === 1 ? 'prenda guardada' : 'prendas guardadas'}`}
        </p>
        <div className="w-14 h-px bg-gold-500 mx-auto mt-4"/>
      </div>

      <div className="px-4 sm:px-8 py-12 max-w-5xl mx-auto">
        {items.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gold-300 max-w-md mx-auto">
            <p className="font-serif text-gold-500 text-3xl mb-3" aria-hidden="true">♡</p>
            <p className="font-sans text-[0.88rem] text-taupe-600 italic mb-6">
              Aún no tienes prendas guardadas.
            </p>
            <Link
              to="/"
              className="inline-block bg-wine-600 text-cream-200 px-8 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-wine-800 transition-colors"
            >
              Explorar colección
            </Link>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item) => (
                <li key={item.productoId} className="bg-cream-50 border border-gold-300 overflow-hidden flex flex-col">
                  <Link to={`/producto/${item.productoId}`} className="block aspect-[3/4] overflow-hidden bg-cream-200 focus-visible:outline-2 focus-visible:outline-wine-600">
                    <Img
                      src={item.imagen}
                      alt={item.nombre}
                      w={500}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </Link>
                  <div className="p-4 flex-1 flex flex-col">
                    {item.categoria && (
                      <span className="block font-sans text-[0.6rem] tracking-widest uppercase text-gold-500 mb-1 capitalize">
                        {item.categoria}
                      </span>
                    )}
                    <h2 className="font-serif text-wine-900 text-base mb-2">
                      <Link to={`/producto/${item.productoId}`} className="hover:text-wine-600 transition-colors">
                        {item.nombre}
                      </Link>
                    </h2>
                    <p className="font-sans font-bold text-wine-600 mb-4">{formatPrecio(item.precio)}</p>
                    <div className="mt-auto flex gap-2">
                      <Link
                        to={`/producto/${item.productoId}`}
                        className="flex-1 bg-wine-600 text-cream-200 py-2 text-center font-sans text-[0.65rem] tracking-widest uppercase hover:bg-wine-800 transition-colors"
                      >
                        Ver prenda
                      </Link>
                      <button
                        onClick={() => {
                          remove(item.productoId)
                          toast.success('Quitado de favoritos')
                        }}
                        aria-label={`Quitar ${item.nombre} de favoritos`}
                        className="border border-gold-300 text-taupe-600 px-3 py-2 font-sans text-[0.65rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3 justify-center">
              <button
                onClick={openCart}
                className="bg-wine-600 text-cream-200 px-8 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-wine-800 transition-colors"
              >
                Ver mi selección
              </button>
              <button
                onClick={() => {
                  if (confirm('¿Vaciar todos los favoritos?')) clear()
                }}
                className="border border-gold-300 text-taupe-600 px-8 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors"
              >
                Vaciar favoritos
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
