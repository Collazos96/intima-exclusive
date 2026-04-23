/**
 * Filtra y ordena una lista de productos según los filtros activos.
 * Usado por la página de Categoría.
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
