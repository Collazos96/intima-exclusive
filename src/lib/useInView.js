import { useEffect, useRef, useState } from 'react'

/**
 * Observa si un elemento entra al viewport.
 * Una vez visible, se queda en true (no retrocede al salir).
 * Respeta prefers-reduced-motion: si el usuario prefiere reducido, siempre true.
 */
export function useInView({ threshold = 0.15, rootMargin = '0px 0px -10% 0px' } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(() => {
    if (typeof window === 'undefined') return true
    if (typeof IntersectionObserver === 'undefined') return true
    return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (inView) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [inView, threshold, rootMargin])

  return [ref, inView]
}
