const API = import.meta.env.VITE_API_URL || 'https://intima-exclusive-api.juanfecolla.workers.dev'

async function fetchJson(path, options = {}) {
  const res = await fetch(`${API}${path}`, options)
  if (!res.ok) {
    let detalle = ''
    try { detalle = (await res.json())?.error || '' } catch { /* noop */ }
    throw new Error(detalle || `Error ${res.status} al cargar ${path}`)
  }
  return res.json()
}

export const getCategorias = () => fetchJson('/api/categorias')
export const getProductos = () => fetchJson('/api/productos')
export const getProductosByCategoria = (id) => fetchJson(`/api/categoria/${id}`)
export const getProducto = (id) => fetchJson(`/api/productos/${id}`)

export async function registrarVisita(id) {
  try {
    await fetch(`${API}/api/visita/${id}`, { method: 'POST' })
  } catch (err) {
    console.error('Error registrando visita:', err)
  }
}
