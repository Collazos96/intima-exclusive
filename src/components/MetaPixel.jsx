import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { pixelPageView } from '../lib/metaPixel'

/**
 * PageView del Meta Pixel en cada navegación SPA del sitio público.
 *
 * El código base del pixel (init + primer PageView) vive en index.html <head>,
 * así que aquí NO inicializamos nada: solo emitimos un PageView adicional cuando
 * cambia la ruta. Se salta el render inicial porque ese primer PageView ya lo
 * disparó el código base al cargar el HTML.
 *
 * Se monta solo en la rama pública de App, nunca en /admin.
 */
export default function MetaPixel() {
  const { pathname } = useLocation()
  const primerRender = useRef(true)

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false
      return
    }
    pixelPageView()
  }, [pathname])

  return null
}
