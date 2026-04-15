import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login } from '../../hooks/useAdmin'

export default function AdminLogin() {
  const nav = useNavigate()
  const location = useLocation()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(password)
      const dest = location.state?.from?.pathname || '/admin'
      nav(dest, { replace: true })
    } catch (err) {
      setError(err.message || 'Credenciales inválidas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
      <div className="bg-white border border-gold-300 p-10 w-full max-w-md">
        <h1 className="font-serif text-2xl text-wine-800 mb-2 text-center">Panel de administración</h1>
        <p className="font-sans text-[0.78rem] text-taupe-600 text-center mb-8 tracking-wide">Íntima Exclusive</p>
        <form onSubmit={handleLogin}>
          <label htmlFor="admin-password" className="block font-sans text-[0.68rem] tracking-widest uppercase text-taupe-600 mb-2">
            Contraseña de acceso
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gold-300 px-4 py-3 font-sans text-sm text-wine-900 outline-none focus:border-wine-600 mb-4"
            placeholder="Ingresa tu contraseña"
            required
          />
          {error && (
            <p className="font-sans text-[0.75rem] text-red-600 mb-4" role="alert">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-wine-600 text-cream-200 py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-wine-800 transition-colors disabled:opacity-50">
            {loading ? 'Verificando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  )
}
