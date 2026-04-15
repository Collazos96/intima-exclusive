/**
 * Genera una URL optimizada usando Cloudflare Image Transformations
 * (https://developers.cloudflare.com/images/transform-images/).
 *
 * Si el zone tiene Image Transformations activas, la imagen se entrega
 * redimensionada/re-codificada. Si no, el navegador sigue el 404
 * hasta la URL original — por eso validamos el dominio antes.
 *
 * Uso:
 *   cfImage(url, { w: 400, q: 75 })
 *   srcSet(url, [400, 800, 1200])
 */

const ORIGIN_WITH_TRANSFORMS = 'https://intimaexclusive.com'
const R2_BASE = 'https://images.intimaexclusive.com'

function buildParams({ w, h, q = 80, fmt = 'auto', fit = 'cover' }) {
  const parts = []
  if (w) parts.push(`width=${w}`)
  if (h) parts.push(`height=${h}`)
  if (q) parts.push(`quality=${q}`)
  if (fmt) parts.push(`format=${fmt}`)
  if (fit) parts.push(`fit=${fit}`)
  return parts.join(',')
}

export function cfImage(src, opts = {}) {
  if (!src || typeof src !== 'string') return src
  if (!src.startsWith(R2_BASE)) return src
  const params = buildParams(opts)
  if (!params) return src
  return `${ORIGIN_WITH_TRANSFORMS}/cdn-cgi/image/${params}/${src}`
}

export function srcSet(src, widths, opts = {}) {
  return widths
    .map((w) => `${cfImage(src, { ...opts, w })} ${w}w`)
    .join(', ')
}
