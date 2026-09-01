// Meta (Facebook) Pixel — carga diferida del script base + helpers de tracking.
//
// El ID del pixel es información pública (queda visible en el navegador de
// cualquier visitante), así que va con un fallback al pixel de producción.
// Se puede sobrescribir por entorno con VITE_META_PIXEL_ID (Pages env vars).
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '2309058572967283'

let initialized = false

/**
 * Inyecta el snippet base de Meta una sola vez (crea window.fbq) y dispara
 * el primer PageView. SSR-safe: en el servidor no hace nada.
 */
export function initMetaPixel() {
  if (initialized) return
  if (typeof window === 'undefined') return // SSR guard
  if (!PIXEL_ID) return
  initialized = true

  // Snippet base oficial de Meta (formateado, misma lógica).
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = !0
    n.version = '2.0'
    n.queue = []
    t = b.createElement(e)
    t.async = !0
    t.src = v
    s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')

  window.fbq('init', PIXEL_ID)
  window.fbq('track', 'PageView')
}

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
