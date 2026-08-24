import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getBannerAdmin, actualizarBanner, isAuthenticated } from '../../hooks/useAdmin'

const MAX = 120

// Ideas de campaña por temporada — clic para usarlas
const IDEAS = [
  '🇨🇴 Mes del Amor y la Amistad: envío GRATIS',
  '🎃 Solo por octubre: envío GRATIS a todo el país',
  '🖤 Black Friday: envío GRATIS por tiempo limitado',
  '🎄 Navidad Íntima: envío GRATIS en todos los pedidos',
  '❤️ San Valentín: envío GRATIS para consentirte',
  '🌸 Día de la Mujer: envío GRATIS esta semana',
  '💐 Día de la Madre: envío GRATIS',
  '✨ Aniversario Íntima: envío GRATIS por tiempo limitado',
]

export default function AdminConfig() {
  const nav = useNavigate()
  const [activo, setActivo] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      nav('/admin/login')
      return
    }
    getBannerAdmin()
      .then((b) => { setActivo(!!b.activo); setMensaje(b.mensaje || '') })
      .catch((err) => toast.error(err.message || 'No se pudo cargar la campaña'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function guardar(e) {
    e.preventDefault()
    if (activo && mensaje.trim().length < 2) {
      toast.error('Escribe un mensaje para la campaña.')
      return
    }
    setGuardando(true)
    try {
      await actualizarBanner({ activo, mensaje: mensaje.trim() })
      toast.success('Campaña actualizada. Ya se ve en la página.')
    } catch (err) {
      toast.error(err.message || 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100">
      <p className="font-serif italic text-gold-500">Cargando…</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-cream-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl text-wine-800">Campaña de la barra superior</h1>
          <p className="font-sans text-[0.75rem] text-taupe-600 tracking-wide mt-1">
            El mensaje que aparece arriba en toda la página. Cámbialo cada mes para mantener la tienda fresca.
          </p>
        </div>

        {/* Vista previa */}
        <p className="font-sans text-[0.62rem] tracking-widest uppercase text-taupe-400 mb-2">Vista previa</p>
        <div className="bg-wine-900 text-cream-50 font-sans text-[0.65rem] tracking-[3px] uppercase text-center py-2 px-3 mb-6 border border-gold-300">
          {activo && mensaje.trim()
            ? (<><span>{mensaje}</span><span className="mx-3 text-gold-300">·</span><span>Cambios 30 días</span></>)
            : (<span className="text-cream-200/70">Cambios 30 días · Tallas S, M, L, XL</span>)}
        </div>

        <form onSubmit={guardar} className="bg-white border border-gold-300 p-6">
          <label className="flex items-center gap-3 mb-5 cursor-pointer select-none">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="w-4 h-4 accent-wine-600" />
            <span className="font-sans text-[0.72rem] tracking-widest uppercase text-taupe-600">
              Mostrar mensaje de campaña
            </span>
          </label>

          <label className="block font-sans text-[0.65rem] tracking-widest uppercase text-taupe-600 mb-2">Mensaje</label>
          <input
            type="text"
            value={mensaje}
            maxLength={MAX}
            onChange={(e) => setMensaje(e.target.value)}
            disabled={!activo}
            placeholder="Ej: 🇨🇴 Mes del Amor y la Amistad: envío GRATIS"
            className="w-full border border-gold-300 px-3 py-2.5 font-sans text-sm text-wine-900 outline-none focus:border-wine-600 disabled:bg-cream-100 disabled:text-taupe-400"
          />
          <p className="font-sans text-[0.6rem] text-taupe-400 mt-1">{mensaje.length}/{MAX} caracteres</p>

          <div className="mt-5">
            <p className="font-sans text-[0.62rem] tracking-widest uppercase text-taupe-400 mb-2">Ideas por temporada (clic para usar)</p>
            <div className="flex flex-wrap gap-2">
              {IDEAS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => { setActivo(true); setMensaje(idea) }}
                  className="border border-gold-300 text-taupe-600 px-3 py-1.5 font-sans text-[0.68rem] hover:border-wine-600 hover:text-wine-600 transition-colors text-left">
                  {idea}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="mt-6 bg-wine-600 text-cream-200 px-8 py-3 font-sans text-[0.68rem] tracking-widest uppercase hover:bg-wine-800 transition-colors disabled:opacity-50">
            {guardando ? 'Guardando…' : 'Guardar campaña'}
          </button>
        </form>
      </div>
    </main>
  )
}
