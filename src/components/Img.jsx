import { cfImage, srcSet } from '../lib/cfImage'

/**
 * Componente de imagen con defaults saludables para Core Web Vitals:
 * - loading="lazy" salvo que priority=true
 * - decoding="async"
 * - fetchpriority="high" cuando priority=true
 * - Genera srcSet si se pasa el array widths
 *
 * Props:
 *  src        URL original (R2)
 *  alt        obligatorio
 *  priority   true para LCP (hero/primera imagen)
 *  widths     [400, 800, 1200] → genera srcset responsive
 *  sizes      atributo sizes HTML
 *  w, h, q    transformaciones del src fallback (1x)
 */
export default function Img({
  src,
  alt,
  priority = false,
  widths,
  sizes,
  w,
  h,
  q,
  className,
  ...rest
}) {
  const fallback = cfImage(src, { w, h, q })
  const ss = widths ? srcSet(src, widths, { q }) : undefined

  return (
    <img
      src={fallback}
      srcSet={ss}
      sizes={ss ? sizes : undefined}
      alt={alt || ''}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      className={className}
      {...rest}
    />
  )
}
