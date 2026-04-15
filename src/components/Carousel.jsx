import { useState } from 'react'

export default function Carousel({ imagenes, nombre }) {
  const [idx, setIdx] = useState(0)
  const prev = (e) => { e.preventDefault(); e.stopPropagation(); setIdx(i => (i - 1 + imagenes.length) % imagenes.length) }
  const next = (e) => { e.preventDefault(); e.stopPropagation(); setIdx(i => (i + 1) % imagenes.length) }

  return (
    <div className="relative overflow-hidden bg-cream-200" style={{height:'300px'}} role="group" aria-roledescription="carrusel" aria-label={`Imágenes de ${nombre}`}>
      <div className="flex h-full transition-transform duration-400" style={{transform:`translateX(-${idx*100}%)`}}>
        {imagenes.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${nombre} — foto ${i+1} de ${imagenes.length}`}
            loading="lazy"
            className="min-w-full h-full object-cover flex-shrink-0"
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
                aria-label={`Ir a imagen ${i+1}`}
                aria-current={i === idx}
                className={`w-2 h-2 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-white ${i===idx?'bg-white':'bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
