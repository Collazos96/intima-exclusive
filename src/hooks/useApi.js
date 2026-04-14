const API = 'https://intima-exclusive-api.juanfecolla.workers.dev'

export async function getCategorias() {
  const res = await fetch(`${API}/api/categorias`)
  return res.json()
}

export async function getProductos() {
  const res = await fetch(`${API}/api/productos`)
  return res.json()
}

export async function getProductosByCategoria(id) {
  const res = await fetch(`${API}/api/categoria/${id}`)
  return res.json()
}

export async function getProducto(id) {
  const res = await fetch(`${API}/api/productos/${id}`)
  return res.json()
}

export async function registrarVisita(id) {
  try {
    await fetch(`${API}/api/visita/${id}`, { method: 'POST' })
  } catch (err) {
    console.error('Error registrando visita:', err)
  }
}