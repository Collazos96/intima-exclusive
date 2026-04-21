import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Al cambiar de ruta, resetea el scroll al top.
 * Ignora cambios de hash (anclas dentro de la misma página).
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // 'instant' evita animación (mejor UX al cambiar de página)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
  return null
}
