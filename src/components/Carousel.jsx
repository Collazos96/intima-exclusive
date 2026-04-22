import { useRef, useState } from 'react'
import Img from './Img'

const SWIPE_THRESHOLD = 40

export default function Carousel({ imagenes, nombre, priority = false }) {
  const [idx, setIdx] = useState(0)
  const touchStartX = useRef(null)

  const prev = (e) => { e.preventDefault(); e.stopPropagation(); setIdx(i => (i - 1 + imagenes.length) % imagenes.length) }
  const next = (e) => { e.preventDefault(); e.stopPropagation(); setIdx(i => (i + 1) % imagenes.length) }

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < SWIPE_THRESHOLD || imagenes.length < 2) return
    if (delta > 0) setIdx(i => (i - 1 + imagenes.length) % imagenes.length)
    else setIdx(i => (i + 1) % imagenes.length)
  }

  return (
    <div
      className="relative overflow-hidden bg-cream-200 select-none touch-pan-y"
      style={{ height: '300px' }}
      role="group"
      aria-roledescription="carrusel"
      aria-label={`Imágenes de ${nombre}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex h-full transition-transform duration-400" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {imagenes.map((src, i) => (
          <Img
            key={i}
            src={src}
            alt={`${nombre} — foto ${i + 1} de ${imagenes.length}`}
            priority={priority && i === 0}
            widths={[400, 800]}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            w={600}
            className="min-w-full h-full object-cover flex-shrink-0 pointer-events-none"
          />
        ))}
      </div>
      {imagenes.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Imagen anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-wine-600/60 hover:bg-wine-600 text-white w-8 h-8 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >&#8592;</button>
          <button
            type="button"
            onClick={next}
            aria-label="Imagen siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-wine-600/60 hover:bg-wine-600 text-white w-8 h-8 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >&#8594;</button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imagenes.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx(i) }}
                aria-label={`Ir a imagen ${i + 1}`}
                aria-current={i === idx}
                className={`w-2 h-2 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-white ${i === idx ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
