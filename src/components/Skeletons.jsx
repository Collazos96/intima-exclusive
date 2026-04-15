/**
 * Skeletons visuales que imitan el layout real mientras carga.
 * Usan animate-pulse de Tailwind y los tokens del sistema de diseño.
 */

function Shimmer({ className = '' }) {
  return <div className={`bg-gold-300/30 animate-pulse ${className}`} aria-hidden="true" />
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-cream-50 border border-gold-300 overflow-hidden">
      <Shimmer className="w-full h-[300px]" />
      <div className="p-4 space-y-3">
        <Shimmer className="h-3 w-12" />
        <Shimmer className="h-5 w-3/4" />
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-7 w-24" />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
      aria-busy="true"
      aria-live="polite"
      aria-label="Cargando productos"
    >
      {Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  )
}

export function CategoryGridSkeleton() {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto"
      aria-busy="true"
      aria-label="Cargando categorías"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="p-8 border border-gold-300 bg-cream-100 space-y-3">
          <Shimmer className="w-10 h-10 mx-auto rounded" />
          <Shimmer className="h-3 w-3/4 mx-auto" />
          <Shimmer className="h-2 w-1/2 mx-auto" />
        </div>
      ))}
    </div>
  )
}

export function ProductoDetalleSkeleton() {
  return (
    <div
      className="max-w-5xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-[72px_1fr_1fr] gap-6 items-start"
      aria-busy="true"
      aria-label="Cargando producto"
    >
      <div className="flex lg:flex-col flex-row gap-2 order-2 lg:order-1">
        {Array.from({ length: 4 }, (_, i) => <Shimmer key={i} className="w-16 h-16" />)}
      </div>
      <div className="order-1 lg:order-2">
        <Shimmer className="w-full aspect-[3/4]" />
      </div>
      <div className="order-3 space-y-4">
        <Shimmer className="h-3 w-16" />
        <Shimmer className="h-8 w-3/4" />
        <Shimmer className="h-6 w-1/3" />
        <Shimmer className="h-px w-full" />
        <Shimmer className="h-3 w-20" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }, (_, i) => <Shimmer key={i} className="h-9 w-20" />)}
        </div>
        <Shimmer className="h-3 w-20 mt-3" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, i) => <Shimmer key={i} className="w-11 h-11" />)}
        </div>
        <Shimmer className="h-12 w-full mt-5" />
        <Shimmer className="h-11 w-full" />
      </div>
    </div>
  )
}
