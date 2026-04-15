/**
 * Filtros client-side para la lista de productos de una categoría.
 * Recibe productos y devuelve los filtrados + controles de UI.
 */

export function filtrarYOrdenar(productos, filtros) {
  const { colores = [], soloNuevos, precioMax, orden } = filtros
  let out = productos

  if (colores.length) {
    const set = new Set(colores)
    out = out.filter((p) => (p.colores || []).some((c) => set.has(c)))
  }
  if (soloNuevos) {
    out = out.filter((p) => p.nuevo === 1)
  }
  if (typeof precioMax === 'number' && precioMax > 0) {
    out = out.filter((p) => p.precio <= precioMax)
  }
  if (orden === 'precio-asc') out = [...out].sort((a, b) => a.precio - b.precio)
  else if (orden === 'precio-desc') out = [...out].sort((a, b) => b.precio - a.precio)
  else if (orden === 'nuevo') out = [...out].sort((a, b) => (b.nuevo ?? 0) - (a.nuevo ?? 0))

  return out
}

export default function CategoriaFilters({
  productos,
  filtros,
  setFiltros,
  totalResultados,
}) {
  // Unión de colores presentes en los productos
  const coloresDisponibles = Array.from(
    new Set(productos.flatMap((p) => p.colores || []))
  ).sort()

  const precios = productos.map((p) => p.precio).filter(Boolean)
  const precioMin = precios.length ? Math.min(...precios) : 0
  const precioMax = precios.length ? Math.max(...precios) : 0

  function toggleColor(color) {
    const actual = filtros.colores || []
    const nuevo = actual.includes(color)
      ? actual.filter((c) => c !== color)
      : [...actual, color]
    setFiltros((f) => ({ ...f, colores: nuevo }))
  }

  function resetear() {
    setFiltros({ colores: [], soloNuevos: false, precioMax: 0, orden: 'nuevo' })
  }

  const algunoActivo =
    (filtros.colores?.length || 0) > 0 ||
    filtros.soloNuevos ||
    (filtros.precioMax > 0 && filtros.precioMax < precioMax) ||
    (filtros.orden && filtros.orden !== 'nuevo')

  return (
    <aside
      aria-label="Filtros"
      className="bg-cream-50 border border-gold-300 p-5 mb-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Colores */}
        {coloresDisponibles.length > 0 && (
          <div>
            <p className="font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600 mb-2">Color</p>
            <div className="flex flex-wrap gap-1.5">
              {coloresDisponibles.map((c) => {
                const activo = filtros.colores?.includes(c)
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleColor(c)}
                    aria-pressed={activo}
                    className={`px-2.5 py-1 font-sans text-[0.68rem] border transition-colors ${activo
                      ? 'border-wine-600 bg-wine-600 text-cream-200'
                      : 'border-gold-300 text-wine-900 hover:border-wine-600'}`}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Rango de precio */}
        {precios.length > 0 && (
          <div>
            <p className="font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600 mb-2">
              Precio máx: <strong className="text-wine-900">
                ${(filtros.precioMax || precioMax).toLocaleString('es-CO')}
              </strong>
            </p>
            <input
              type="range"
              min={precioMin}
              max={precioMax}
              step={10000}
              value={filtros.precioMax || precioMax}
              onChange={(e) => setFiltros((f) => ({ ...f, precioMax: Number(e.target.value) }))}
              className="w-full accent-wine-600"
              aria-label="Precio máximo"
            />
            <div className="flex justify-between font-sans text-[0.6rem] text-taupe-400 mt-1">
              <span>${precioMin.toLocaleString('es-CO')}</span>
              <span>${precioMax.toLocaleString('es-CO')}</span>
            </div>
          </div>
        )}

        {/* Extras: solo nuevos + orden */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer font-sans text-[0.75rem] text-wine-900">
            <input
              type="checkbox"
              checked={!!filtros.soloNuevos}
              onChange={(e) => setFiltros((f) => ({ ...f, soloNuevos: e.target.checked }))}
              className="accent-wine-600 w-4 h-4"
            />
            Solo prendas nuevas
          </label>
          <div>
            <label htmlFor="orden-select" className="block font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600 mb-1">
              Ordenar por
            </label>
            <select
              id="orden-select"
              value={filtros.orden || 'nuevo'}
              onChange={(e) => setFiltros((f) => ({ ...f, orden: e.target.value }))}
              className="w-full border border-gold-300 bg-cream-50 px-2 py-1.5 font-sans text-sm text-wine-900 focus-visible:outline-2 focus-visible:outline-wine-600"
            >
              <option value="nuevo">Novedades</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between gap-3">
        <p className="font-sans text-[0.7rem] tracking-widest uppercase text-taupe-600">
          <strong className="text-wine-900">{totalResultados}</strong> {totalResultados === 1 ? 'prenda' : 'prendas'}
        </p>
        {algunoActivo && (
          <button
            type="button"
            onClick={resetear}
            className="font-sans text-[0.65rem] tracking-widest uppercase text-wine-600 underline hover:text-wine-800 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </aside>
  )
}
