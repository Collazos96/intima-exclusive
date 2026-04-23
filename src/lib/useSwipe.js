import { useRef } from 'react'

/**
 * Hook para detectar swipes horizontales en un elemento touch.
 *
 * Devuelve handlers { onTouchStart, onTouchMove, onTouchEnd } para
 * aplicar con {...spread}. Dispara onSwipeLeft/onSwipeRight solo si
 * el desplazamiento horizontal supera el threshold (default 50px) y
 * el movimiento fue mas horizontal que vertical (evita falsos
 * positivos cuando el usuario hace scroll vertical).
 *
 * Por el umbral de 50px y el comportamiento nativo del navegador
 * (que no dispara "click" cuando hay >10px de movimiento), el swipe
 * convive con botones/Links envolventes sin necesidad de
 * preventDefault manual.
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 } = {}) {
  const startX = useRef(null)
  const startY = useRef(null)

  return {
    onTouchStart: (e) => {
      const t = e.touches[0]
      startX.current = t.clientX
      startY.current = t.clientY
    },
    onTouchEnd: (e) => {
      if (startX.current == null) return
      const t = e.changedTouches[0]
      const dx = startX.current - t.clientX
      const dy = startY.current - t.clientY
      startX.current = null
      startY.current = null
      if (Math.abs(dx) < threshold) return
      if (Math.abs(dx) < Math.abs(dy)) return // fue scroll vertical
      if (dx > 0) onSwipeLeft?.()
      else onSwipeRight?.()
    },
  }
}
