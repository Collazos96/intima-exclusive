import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getAdminCupones, crearCupon, actualizarCupon, eliminarCupon } from '../../hooks/useAdmin'

const formatCop = (cents) => '$' + Math.round(cents / 100).toLocaleString('es-CO')
const fecha = (iso) => iso ? new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export default function AdminCupones() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const [mostrarCrear, setMostrarCrear] = useState(false)

  const { data: cupones = [], isLoading } = useQuery({
    queryKey: ['admin', 'cupones'],
    queryFn: getAdminCupones,
  })

  const toggleActivo = useMutation({
    mutationFn: ({ codigo, activo }) => actualizarCupon(codigo, { activo }),
    onSuccess: () => {
      toast.success('Cupón actualizado')
      qc.invalidateQueries({ queryKey: ['admin', 'cupones'] })
    },
    onError: (e) => toast.error(e.message),
  })

  const borrar = useMutation({
    mutationFn: eliminarCupon,
    onSuccess: () => {
      toast.success('Cupón eliminado')
      qc.invalidateQueries({ queryKey: ['admin', 'cupones'] })
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <main className="min-h-screen bg-cream-100 pt-[70px]">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl text-wine-800">Cupones</h1>
            <p className="font-sans text-[0.75rem] text-taupe-600 mt-1">
              Códigos de descuento para campañas, influencers, primera compra.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setMostrarCrear(true)} className="bg-wine-600 text-cream-200 px-4 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:bg-wine-800 transition-colors">
              + Nuevo cupón
            </button>
            <button onClick={() => nav('/admin')} className="border border-gold-300 text-taupe-600 px-4 py-2 font-sans text-[0.68rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors">
              ← Panel
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="font-serif italic text-gold-500 text-center py-10">Cargando…</p>
        ) : cupones.length === 0 ? (
          <div className="bg-white border border-gold-300 p-8 text-center">
            <p className="font-sans text-[0.85rem] text-taupe-600">Aún no has creado cupones.</p>
          </div>
        ) : (
          <div className="bg-white border border-gold-300 overflow-x-auto">
            <table className="w-full text-[0.82rem]">
              <thead>
                <tr className="border-b border-gold-300 text-left">
                  {['Código', 'Descuento', 'Mínimo', 'Usos', 'Expira', 'Restricciones', 'Estado', ''].map((h) => (
                    <th key={h} className="px-3 py-2 font-sans text-[0.6rem] tracking-widest uppercase text-taupe-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cupones.map((c) => (
                  <tr key={c.codigo} className="border-b border-cream-200 hover:bg-cream-100 transition-colors">
                    <td className="px-3 py-2">
                      <p className="font-mono text-wine-900">{c.codigo}</p>
                      {c.descripcion && <p className="font-sans text-[0.68rem] text-taupe-400">{c.descripcion}</p>}
                    </td>
                    <td className="px-3 py-2 text-taupe-600">
                      {c.tipo === 'porcentaje' ? `${c.valor}%` : formatCop(c.valor)}
                    </td>
                    <td className="px-3 py-2 text-taupe-600">
                      {c.minimo_compra > 0 ? formatCop(c.minimo_compra) : '—'}
                    </td>
                    <td className="px-3 py-2 text-taupe-600">
                      {c.usos_actuales}{c.max_usos != null ? ` / ${c.max_usos}` : ''}
                    </td>
                    <td className="px-3 py-2 text-taupe-600">{fecha(c.expira_at)}</td>
                    <td className="px-3 py-2 text-[0.72rem] text-taupe-600">
                      {c.solo_primera_compra ? <span className="inline-block px-1.5 py-0.5 bg-cream-200 text-wine-900 mr-1">1ª compra</span> : null}
                      {c.email_requerido ? <span className="font-mono text-[0.65rem]">{c.email_requerido}</span> : null}
                      {!c.solo_primera_compra && !c.email_requerido && '—'}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => toggleActivo.mutate({ codigo: c.codigo, activo: !c.activo })}
                        disabled={toggleActivo.isPending}
                        className={`px-2 py-0.5 text-[0.62rem] tracking-widest uppercase ${c.activo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}
                      >
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar cupón ${c.codigo}?`)) borrar.mutate(c.codigo)
                        }}
                        disabled={borrar.isPending}
                        className="border border-red-200 text-red-500 px-2 py-1 font-sans text-[0.6rem] tracking-widest uppercase hover:bg-red-50 transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {mostrarCrear && <CrearCuponModal onClose={() => setMostrarCrear(false)} qc={qc} />}
      </div>
    </main>
  )
}

function CrearCuponModal({ onClose, qc }) {
  const [form, setForm] = useState({
    codigo: '',
    descripcion: '',
    tipo: 'porcentaje',
    valor: '',
    minimo_compra: '',
    max_usos: '',
    expira_at: '',
    solo_primera_compra: false,
    email_requerido: '',
  })
  const [enviando, setEnviando] = useState(false)

  const crear = useMutation({
    mutationFn: crearCupon,
    onSuccess: () => {
      toast.success('Cupón creado')
      qc.invalidateQueries({ queryKey: ['admin', 'cupones'] })
      onClose()
    },
    onError: (e) => { toast.error(e.message); setEnviando(false) },
  })

  function submit(e) {
    e.preventDefault()
    if (!form.codigo.trim() || !form.valor) {
      toast.error('Código y valor son obligatorios')
      return
    }
    setEnviando(true)
    const payload = {
      codigo: form.codigo.trim().toUpperCase(),
      descripcion: form.descripcion.trim() || null,
      tipo: form.tipo,
      valor: parseInt(form.valor, 10) * (form.tipo === 'fijo' ? 100 : 1), // fijo: pesos -> centavos
      minimo_compra: form.minimo_compra ? parseInt(form.minimo_compra, 10) * 100 : 0,
      max_usos: form.max_usos ? parseInt(form.max_usos, 10) : null,
      expira_at: form.expira_at ? new Date(form.expira_at).toISOString() : null,
      solo_primera_compra: form.solo_primera_compra,
      email_requerido: form.email_requerido.trim().toLowerCase() || null,
    }
    crear.mutate(payload)
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-wine-900/70" aria-hidden="true" />
      <div className="relative bg-cream-50 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <header className="border-b border-gold-300 px-6 py-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-wine-900">Nuevo cupón</h2>
          <button onClick={onClose} aria-label="Cerrar" className="w-8 h-8 flex items-center justify-center text-wine-900 hover:bg-cream-200 transition-colors">✕</button>
        </header>
        <form onSubmit={submit} className="px-6 py-5 space-y-3 font-sans text-[0.85rem] text-taupe-600">
          <Field label="Código *" value={form.codigo} onChange={(v) => setForm((f) => ({ ...f, codigo: v.toUpperCase() }))} maxLength={32} placeholder="BLACKFRIDAY25" required mono />
          <Field label="Descripción" value={form.descripcion} onChange={(v) => setForm((f) => ({ ...f, descripcion: v }))} maxLength={120} placeholder="Black Friday 2026" />
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[0.65rem] tracking-widest uppercase text-taupe-600 block mb-1">Tipo *</span>
              <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} className="w-full border border-gold-300 bg-cream-50 px-3 py-2 text-sm text-wine-900">
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto fijo (COP)</option>
              </select>
            </label>
            <Field
              label={`Valor * (${form.tipo === 'porcentaje' ? '%' : 'COP'})`}
              type="number"
              value={form.valor}
              onChange={(v) => setForm((f) => ({ ...f, valor: v }))}
              min="1"
              max={form.tipo === 'porcentaje' ? '100' : '100000000'}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Compra mínima (COP)" type="number" value={form.minimo_compra} onChange={(v) => setForm((f) => ({ ...f, minimo_compra: v }))} min="0" placeholder="0" />
            <Field label="Máx. usos" type="number" value={form.max_usos} onChange={(v) => setForm((f) => ({ ...f, max_usos: v }))} min="1" placeholder="Ilimitado" />
          </div>
          <Field label="Expira" type="date" value={form.expira_at} onChange={(v) => setForm((f) => ({ ...f, expira_at: v }))} placeholder="Sin expiración" />
          <Field label="Solo para email" type="email" value={form.email_requerido} onChange={(v) => setForm((f) => ({ ...f, email_requerido: v }))} maxLength={120} placeholder="Opcional — restringir a 1 email" />
          <label className="flex items-center gap-2 pt-1 text-wine-900">
            <input
              type="checkbox"
              checked={form.solo_primera_compra}
              onChange={(e) => setForm((f) => ({ ...f, solo_primera_compra: e.target.checked }))}
              className="accent-wine-600 w-4 h-4"
            />
            <span className="text-[0.85rem]">Solo válido para primera compra</span>
          </label>
          <div className="flex gap-2 pt-3">
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 bg-wine-600 text-cream-200 py-2.5 font-sans text-[0.7rem] tracking-widest uppercase hover:bg-wine-800 disabled:opacity-60 transition-colors"
            >
              {enviando ? 'Creando…' : 'Crear cupón'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-gold-300 text-taupe-600 px-5 py-2.5 font-sans text-[0.7rem] tracking-widest uppercase hover:border-wine-600 hover:text-wine-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, mono, ...rest }) {
  return (
    <label className="block">
      <span className="text-[0.65rem] tracking-widest uppercase text-taupe-600 block mb-1">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-gold-300 bg-cream-50 px-3 py-2 text-sm text-wine-900 focus-visible:outline-2 focus-visible:outline-wine-600 ${mono ? 'font-mono' : 'font-sans'}`}
        {...rest}
      />
    </label>
  )
}
