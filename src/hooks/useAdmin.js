import { isAuthenticated as isAuth, setAuthFlag, clearAuthFlag } from '../lib/authFlag'

const API = import.meta.env.VITE_API_URL || 'https://api.intimaexclusive.com'

// Re-exportamos para no romper otros imports.
export const isAuthenticated = isAuth

async function authFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (res.status === 401) {
    clearAuthFlag()
    throw new Error('No autorizado')
  }
  if (!res.ok) {
    let detalle = ''
    try { detalle = (await res.json())?.error || '' } catch { /* noop */ }
    throw new Error(detalle || `Error ${res.status}`)
  }
  return res.json()
}

export async function login(password) {
  const res = await fetch(`${API}/api/admin/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) {
    clearAuthFlag()
    throw new Error('Credenciales inválidas')
  }
  setAuthFlag()
  return res.json()
}

export async function logout() {
  try {
    await fetch(`${API}/api/admin/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } finally {
    clearAuthFlag()
  }
}

export const getAdminProductos = () => authFetch('/api/admin/productos')

export async function crearProducto(data) {
  return authFetch('/api/admin/productos', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function editarProducto(id, data) {
  return authFetch(`/api/admin/productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function eliminarProducto(id) {
  return authFetch(`/api/admin/productos/${id}`, {
    method: 'DELETE',
  })
}

export const getPapelera = () => authFetch('/api/admin/papelera')

export async function restaurarProducto(id) {
  return authFetch(`/api/admin/productos/${id}/restaurar`, { method: 'POST' })
}

export async function borrarPermanente(id) {
  return authFetch(`/api/admin/productos/${id}/permanente`, { method: 'DELETE' })
}

export const getOrphansR2 = () => authFetch('/api/admin/r2/orphans')

export async function cleanupR2(keys) {
  return authFetch('/api/admin/r2/cleanup', {
    method: 'POST',
    body: JSON.stringify({ keys }),
  })
}

export const getAnalytics = (rango = '30d') => authFetch(`/api/admin/analytics?rango=${rango}`)

export async function actualizarStock(colorId, talla, stock) {
  return authFetch(`/api/admin/stock/${colorId}/${talla}`, {
    method: 'PUT',
    body: JSON.stringify({ stock }),
  })
}

export async function getAdminReviews(estado) {
  const query = estado ? `?estado=${estado}` : ''
  return authFetch(`/api/admin/reviews${query}`)
}

export async function aprobarReview(id, aprobada) {
  return authFetch(`/api/admin/reviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ aprobada }),
  })
}

export async function eliminarReview(id) {
  return authFetch(`/api/admin/reviews/${id}`, {
    method: 'DELETE',
  })
}
