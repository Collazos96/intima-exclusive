import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveToken, verificarToken } from '../../hooks/useAdmin'

export default function AdminLogin() {
  const nav = useNavigate()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const valido = await verificarToken(token)
    if (valido) {
      saveToken(token)
      nav('/admin')
    } else {
      setError('Token incorrecto. Verifica tus credenciales.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#FAF5EE] flex items-center justify-center px-4">
      <div className="bg-white border border-[#D9C4A8] p-10 w-full max-w-md">
        <h1 className="font-serif text-2xl text-[#4E0F1C] mb-2 text-center">Panel de administracion</h1>
        <p className="font-sans text-[0.78rem] text-[#7A5A60] text-center mb-8 tracking-wide">Intima Exclusive</p>
        <form onSubmit={handleLogin}>
          <label className="block font-sans text-[0.68rem] tracking-widest uppercase text-[#7A5A60] mb-2">
            Token de acceso
          </label>
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            className="w-full border border-[#D9C4A8] px-4 py-3 font-sans text-sm text-[#3A1A20] outline-none focus:border-[#7B1A2E] mb-4"
            placeholder="Ingresa tu token"
            required
          />
          {error && (
            <p className="font-sans text-[0.75rem] text-red-600 mb-4">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7B1A2E] text-[#F5EDE0] py-3 font-sans text-[0.72rem] tracking-widest uppercase hover:bg-[#4E0F1C] transition-colors disabled:opacity-50">
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  )
}