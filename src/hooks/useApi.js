const API = import.meta.env.VITE_API_URL || 'https://api.intimaexclusive.com'

async function fetchJson(path, options = {}) {
  const res = await fetch(`${API}${path}`, options)
  if (!res.ok) {
    let detalle = ''
    try { detalle = (await res.json())?.error || '' } catch { /* noop */ }
    throw new Error(detalle || `Error ${res.status} al cargar ${path}`)
  }
  return res.json()
}

export const getConfig = () => fetchJson('/api/config')
export const getCategorias = () => fetchJson('/api/categorias')
export const getProductos = () => fetchJson('/api/productos')
export const getProductosByCategoria = (id) => fetchJson(`/api/categoria/${id}`)
export const getProducto = (id) => fetchJson(`/api/productos/${id}`)

export const getRelacionados = (productoId) => fetchJson(`/api/productos/${productoId}/relacionados`)

export const crearPedido = (data) => fetchJson('/api/pedidos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})
export const getPedido = (reference) => fetchJson(`/api/pedidos/${reference}`)
export const validarCuponApi = (payload) => fetchJson('/api/cupones/validar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})

export const suscribirNewsletter = (payload) => fetchJson('/api/newsletter/suscribir', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
export const getReviews = (productoId) => fetchJson(`/api/productos/${productoId}/reviews`)
export const crearReview = (productoId, data) => fetchJson(`/api/productos/${productoId}/reviews`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})

export async function registrarVisita(id) {
  try {
    await fetch(`${API}/api/visita/${id}`, { method: 'POST' })
  } catch (err) {
    console.error('Error registrando visita:', err)
  }
}
