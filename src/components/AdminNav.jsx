import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAdminPedidos, logout } from '../hooks/useAdmin'

const LINKS = [
  { to: '/admin', label: 'Productos', end: true },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/inventario', label: 'Inventario' },
  { to: '/admin/cupones', label: 'Cupones' },
  { to: '/admin/config', label: 'Campaña' },
  { to: '/admin/reviews', label: 'Reseñas' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/suscriptores', label: 'Suscriptores' },
  { to: '/admin/papelera', label: 'Papelera' },
  { to: '/admin/limpieza', label: 'Limpieza R2' },
]

/**
 * Barra de navegación compartida del admin. Sticky, scrolleable en móvil,
 * resalta la sección activa y muestra cuántos pedidos hay por gestionar.
 */
export default function AdminNav() {
  const nav = useNavigate()
  const { data } = useQuery({
    queryKey: ['admin', 'pedidos-badge'],
    queryFn: () => getAdminPedidos({ vista: 'activos' }),
    staleTime: 60_000,
    refetchInterval: 2 * 60_000,
    retry: false,
  })
  const pendientes = data?.counts?.activos ?? 0

  async function handleLogout() {
    await logout()
    nav('/admin/login')
  }

  return (
    <nav aria-label="Navegación del admin" className="sticky top-0 z-40 bg-wine-900 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 flex items-center gap-1 overflow-x-auto">
        <span className="hidden sm:block shrink-0 font-serif text-cream-50 text-sm pr-4 py-3">
          Íntima <span className="text-gold-300">Admin</span>
        </span>
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `relative shrink-0 px-3 py-3.5 font-sans text-[0.62rem] tracking-widest uppercase whitespace-nowrap transition-colors ${
                isActive
                  ? 'text-gold-300 shadow-[inset_0_-2px_0_0_var(--color-gold-300)]'
                  : 'text-cream-200/70 hover:text-cream-50'
              }`
            }
          >
            {l.label}
            {l.label === 'Pedidos' && pendientes > 0 && (
              <span
                aria-label={`${pendientes} pedidos por gestionar`}
                className="absolute top-1 right-0 bg-gold-500 text-wine-900 text-[0.56rem] font-bold rounded-full min-w-[15px] h-[15px] px-0.5 flex items-center justify-center"
              >
                {pendientes > 99 ? '99+' : pendientes}
              </span>
            )}
          </NavLink>
        ))}
        <div className="flex-1" />
        <button
          onClick={handleLogout}
          className="shrink-0 px-3 py-3.5 font-sans text-[0.62rem] tracking-widest uppercase text-cream-200/70 hover:text-gold-300 transition-colors"
        >
          Salir
        </button>
      </div>
    </nav>
  )
}
