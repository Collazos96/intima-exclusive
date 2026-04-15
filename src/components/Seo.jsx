const SITE = 'https://intimaexclusive.com'
const DEFAULT_IMG = 'https://images.intimaexclusive.com/LOGO-INTIMA.jpg'
const DEFAULT_DESC =
  'Lencería íntima premium hecha con amor en Colombia. Sets, corsets, bodys y accesorios. Tallas XS a 4XL. Envío discreto.'

/**
 * React 19 hoistea <title>, <meta> y <link> al <head> automáticamente.
 * No requiere react-helmet-async.
 */
export default function Seo({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMG,
  path = '/',
  type = 'website',
  jsonLd,
}) {
  const fullTitle = title ? `${title} — Íntima Exclusive` : 'Íntima Exclusive — Lencería femenina premium hecha en Colombia'
  const url = `${SITE}${path}`

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        Array.isArray(jsonLd) ? jsonLd.map((ld, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
          />
        )) : (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )
      )}
    </>
  )
}
