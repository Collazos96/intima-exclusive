import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { suscribirNewsletter } from '../hooks/useApi'

export default function NewsletterForm({ fuente = 'home-newsletter' }) {
  const [email, setEmail] = useState('')
  const [suscrita, setSuscrita] = useState(false)

  const mutation = useMutation({
    mutationFn: suscribirNewsletter,
    onSuccess: (res) => {
      toast.success(res?.mensaje || '¡Revisa tu correo!', { duration: 5000 })
      setSuscrita(true)
    },
    onError: (err) => {
      console.error('Newsletter error:', err)
      toast.error(err?.message || 'No pudimos suscribirte. Intenta de nuevo.', { duration: 5000 })
    },
  })

  function onSubmit(e) {
    e.preventDefault()
    const val = email.trim()
    if (!val) {
      toast.error('Ingresa tu correo.')
      return
    }
    // Validación básica cliente para UX inmediata
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      toast.error('Correo inválido.')
      return
    }
    mutation.mutate({ email: val, fuente })
  }

  if (suscrita) {
    return (
      <div className="max-w-md mx-auto bg-cream-200/10 border border-cream-200/30 p-6 text-center">
        <p className="text-3xl mb-2" aria-hidden="true">💌</p>
        <p className="font-serif text-cream-200 text-lg mb-2">¡Bienvenida!</p>
        <p className="font-sans text-[0.82rem] text-cream-200/80 leading-relaxed">
          Te enviamos tu código de bienvenida al correo.<br />
          Revisa también la carpeta de spam por si acaso.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto" aria-label="Suscripción al newsletter">
      <div className="flex gap-2 flex-wrap">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Tu correo electrónico"
          maxLength={120}
          aria-label="Tu correo electrónico"
          className="flex-1 min-w-[200px] px-4 py-3 bg-white/10 border border-cream-200/30 text-cream-200 font-sans text-sm placeholder-cream-200/50 outline-none focus-visible:border-cream-200"
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-cream-200 text-wine-600 px-6 py-3 font-sans text-[0.7rem] tracking-widest uppercase font-bold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {mutation.isPending ? 'Enviando…' : 'Quiero mi 10%'}
        </button>
      </div>
      <p className="font-sans text-[0.7rem] text-cream-200/70 mt-3">
        Te enviaremos un código único de <strong className="text-gold-300">10% de descuento</strong> para tu primera compra.
      </p>
    </form>
  )
}
