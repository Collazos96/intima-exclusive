// Meta (Facebook) Pixel — helpers de tracking de eventos.
//
// El código BASE del pixel (init + PageView inicial) vive en index.html <head>,
// para que cualquier herramienta de Meta lo detecte en el HTML y cargue lo antes
// posible. Aquí solo disparamos eventos sobre el window.fbq que ese código creó.

/**
 * Dispara un evento estándar del pixel. No-op si el pixel aún no cargó
 * o si corremos en el servidor.
 * @param {string} event  Nombre del evento estándar (ViewContent, AddToCart…)
 * @param {object} [params]  Parámetros del evento (value, currency, content_ids…)
 */
export function trackPixel(event, params) {
  if (typeof window === 'undefined' || !window.fbq) return
  if (params) window.fbq('track', event, params)
  else window.fbq('track', event)
}

/** Atajo para PageView (navegación SPA). */
export function pixelPageView() {
  trackPixel('PageView')
}

/**
 * Agrupa líneas de carrito/pedido por producto sumando cantidades, para no
 * enviar content_ids repetidos a Meta cuando hay varias líneas del mismo
 * producto (p.ej. distinto color/talla, o combo + unidad suelta).
 * @param {Array} items  Líneas con un id de producto y una cantidad.
 * @param {object} opts
 * @param {string} opts.idKey   Nombre del campo con el id de producto.
 * @param {string} [opts.qtyKey='cantidad']  Nombre del campo con la cantidad.
 * @returns {{content_ids: string[], contents: Array, num_items: number}}
 */
export function aggregateContents(items, { idKey, qtyKey = 'cantidad' } = {}) {
  const porProducto = new Map()
  for (const it of items ?? []) {
    const id = it[idKey]
    if (id == null) continue
    porProducto.set(id, (porProducto.get(id) ?? 0) + (it[qtyKey] ?? 1))
  }
  const content_ids = [...porProducto.keys()]
  const contents = content_ids.map((id) => ({ id, quantity: porProducto.get(id) }))
  const num_items = [...porProducto.values()].reduce((s, q) => s + q, 0)
  return { content_ids, contents, num_items }
}
