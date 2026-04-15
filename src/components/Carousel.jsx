import { useState } from 'react'

export default function Carousel({ imagenes, nombre }) {
  const [idx, setIdx] = useState(0)
  const prev = () => setIdx(i => (i - 1 + imagenes.length) % imagenes.length)
  const next = () => setIdx(i => (i + 1) % imagenes.length)

  return (
    <div className="relative overflow-hidden bg-cream-200" style={{height:'300px'}}>
      <div className="flex h-full transition-transform duration-400" style={{transform:`translateX(-${idx*100}%)`}}>
        {imagenes.map((src, i) => (
          <img key={i} src={src} alt={`${nombre} ${i+1}`} className="min-w-full h-full object-cover flex-shrink-0"/>
        ))}
      </div>
      <button onClick={e=>{e.stopPropagation();prev()}} className="absolute left-2 top-1/2 -translate-y-1/2 bg-wine-600/60 hover:bg-wine-600 text-white w-8 h-8 flex items-center justify-center transition-colors">&#8592;</button>
      <button onClick={e=>{e.stopPropagation();next()}} className="absolute right-2 top-1/2 -translate-y-1/2 bg-wine-600/60 hover:bg-wine-600 text-white w-8 h-8 flex items-center justify-center transition-colors">&#8594;</button>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {imagenes.map((_, i) => (
          <span key={i} onClick={()=>setIdx(i)} className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-colors ${i===idx?'bg-white':'bg-white/40'}`}/>
        ))}
      </div>
    </div>
  )
}