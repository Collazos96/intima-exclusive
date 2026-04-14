const API = 'https://intima-exclusive-api.juanfecolla.workers.dev'

function getToken() {
  return sessionStorage.getItem('admin_token')
}

export function saveToken(token) {
  sessionStorage.setItem('admin_token', token)
}

export function removeToken() {
  sessionStorage.removeItem('admin_token')
}

export function isAuthenticated() {
  return !!getToken()
}

async function authFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...options.headers,
    },
  })
  return res.json()
}

export async function verificarToken(token) {
  const res = await fetch(`${API}/api/admin/productos`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })
  return res.status === 200
}

export async function getAdminProductos() {
  return authFetch('/api/admin/productos')
}

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