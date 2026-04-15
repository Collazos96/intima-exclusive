const API = import.meta.env.VITE_API_URL || 'https://api.intimaexclusive.com'

// Flag de UI: el auth real vive en la cookie JWT HttpOnly del API.
// Este flag solo evita un roundtrip en cada navegación admin.
// Si la cookie expira, el primer authFetch devuelve 401 y limpiamos el flag.
const AUTH_FLAG = 'intima_admin_session'

export function isAuthenticated() {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(AUTH_FLAG) === '1'
}

function setAuthFlag() {
  try { localStorage.setItem(AUTH_FLAG, '1') } catch { /* noop */ }
}

function clearAuthFlag() {
  try { localStorage.removeItem(AUTH_FLAG) } catch { /* noop */ }
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
