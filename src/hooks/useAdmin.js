const API = import.meta.env.VITE_API_URL || 'https://intima-exclusive-api.juanfecolla.workers.dev'

const HINT_COOKIE = 'intima_admin_hint'

function hasHintCookie() {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${HINT_COOKIE}=1`))
}

export function isAuthenticated() {
  return hasHintCookie()
}

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
    // Cookie expiró o nunca existió — limpiar hint client-side
    document.cookie = `${HINT_COOKIE}=; Path=/; Max-Age=0`
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
  if (!res.ok) throw new Error('Credenciales inválidas')
  return res.json()
}

export async function logout() {
  try {
    await fetch(`${API}/api/admin/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } finally {
    document.cookie = `${HINT_COOKIE}=; Path=/; Max-Age=0`
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

export const getAnalytics = () => authFetch('/api/admin/analytics')

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
