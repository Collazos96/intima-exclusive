import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { initMetaPixel, pixelPageView } from '../lib/metaPixel'

/**
 * Monta el Meta Pixel para el sitio público. Se coloca dentro de la rama de
 * rutas públicas de App, por lo que NUNCA se monta en /admin (no queremos
 * rastrear el tráfico interno del panel).
 *
 * - Al montar: inyecta el script base y dispara el primer PageView.
 * - En cada cambio de ruta SPA: dispara un PageView adicional.
 *   El render inicial se salta porque ese PageView ya lo emitió initMetaPixel().
 */
export default function MetaPixel() {
  const { pathname } = useLocation()
  const primerRender = useRef(true)

  useEffect(() => {
    initMetaPixel()
  }, [])

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false
      return
    }
    pixelPageView()
  }, [pathname])

  return null
}
