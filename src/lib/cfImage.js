/**
 * Genera una URL optimizada usando Cloudflare Image Transformations
 * (https://developers.cloudflare.com/images/transform-images/).
 *
 * IMPORTANTE: Image Transformations es un add-on ($5/mes). Si no está
 * activado en tu zona, el endpoint /cdn-cgi/image/ responde 404.
 *
 * Por eso se activa vía env flag:
 *   VITE_ENABLE_IMAGE_TRANSFORMS=true
 *
 * Cuando activas Image Transformations en el dashboard de Cloudflare,
 * pon ese flag en true y redeployea el frontend — todo queda optimizado
 * sin tocar más código.
 */

const ORIGIN_WITH_TRANSFORMS = 'https://intimaexclusive.com'
const R2_BASE = 'https://images.intimaexclusive.com'
const ENABLED = import.meta.env.VITE_ENABLE_IMAGE_TRANSFORMS === 'true'

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
  if (!ENABLED) return src
  if (!src.startsWith(R2_BASE)) return src
  const params = buildParams(opts)
  if (!params) return src
  return `${ORIGIN_WITH_TRANSFORMS}/cdn-cgi/image/${params}/${src}`
}

export function srcSet(src, widths, opts = {}) {
  if (!ENABLED) return undefined
  return widths
    .map((w) => `${cfImage(src, { ...opts, w })} ${w}w`)
    .join(', ')
}

export const imageTransformsEnabled = ENABLED
