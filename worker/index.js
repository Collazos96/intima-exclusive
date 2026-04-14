export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://intimaexclusive.com',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers })
    }

    if (path === '/api/categorias') {
      const { results } = await env.DB.prepare('SELECT * FROM categorias').all()
      return new Response(JSON.stringify(results), { headers })
    }

    if (path === '/api/productos') {
      const { results } = await env.DB.prepare('SELECT * FROM productos').all()
      return new Response(JSON.stringify(results), { headers })
    }

    if (path.startsWith('/api/productos/')) {
      const id = path.split('/')[3]
      const producto = await env.DB.prepare('SELECT * FROM productos WHERE id = ?').bind(id).first()
      if (!producto) return new Response(JSON.stringify({ error: 'No encontrado' }), { status: 404, headers })

      const imagenes = await env.DB.prepare('SELECT * FROM imagenes WHERE producto_id = ? ORDER BY orden').bind(id).all()
      const colores = await env.DB.prepare('SELECT * FROM colores WHERE producto_id = ?').bind(id).all()

      const coloresConTallas = await Promise.all(
        colores.results.map(async (c) => {
          const tallas = await env.DB.prepare('SELECT talla FROM tallas WHERE color_id = ?').bind(c.id).all()
          return { ...c, tallas: tallas.results.map(t => t.talla) }
        })
      )

      return new Response(JSON.stringify({
        ...producto,
        imagenes: imagenes.results.map(i => i.url),
        colores: coloresConTallas
      }), { headers })
    }

    if (path.startsWith('/api/categoria/')) {
      const id = path.split('/')[3]
      const { results } = await env.DB.prepare('SELECT * FROM productos WHERE categoria_id = ?').bind(id).all()
      return new Response(JSON.stringify(results), { headers })
    }

    return new Response(JSON.stringify({ error: 'Ruta no encontrada' }), { status: 404, headers })
  }
}