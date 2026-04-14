const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function unauthorized() {
  return new Response(JSON.stringify({ error: 'No autorizado' }), {
    status: 401,
    headers: corsHeaders,
  })
}

function isAdmin(request, env) {
  const auth = request.headers.get('Authorization')
  return auth === `Bearer ${env.ADMIN_TOKEN}`
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // ==================
    // RUTAS PUBLICAS
    // ==================

    if (path === '/api/categorias') {
      const { results } = await env.DB.prepare('SELECT * FROM categorias').all()
      return new Response(JSON.stringify(results), { headers: corsHeaders })
    }

    if (path === '/api/productos') {
      const { results } = await env.DB.prepare('SELECT * FROM productos').all()
      const productosConImagenes = await Promise.all(
        results.map(async (p) => {
          const imagenes = await env.DB.prepare(
            'SELECT url FROM imagenes WHERE producto_id = ? ORDER BY orden'
          ).bind(p.id).all()
          return { ...p, imagenes: imagenes.results.map(i => i.url) }
        })
      )
      return new Response(JSON.stringify(productosConImagenes), { headers: corsHeaders })
    }

    if (path.startsWith('/api/productos/') && !path.includes('/admin/')) {
      const id = path.split('/')[3]
      const producto = await env.DB.prepare(
        'SELECT * FROM productos WHERE id = ?'
      ).bind(id).first()
      if (!producto) return new Response(JSON.stringify({ error: 'No encontrado' }), { status: 404, headers: corsHeaders })

      const imagenes = await env.DB.prepare(
        'SELECT url FROM imagenes WHERE producto_id = ? ORDER BY orden'
      ).bind(id).all()
      const colores = await env.DB.prepare(
        'SELECT * FROM colores WHERE producto_id = ?'
      ).bind(id).all()

      const coloresConTallas = await Promise.all(
        colores.results.map(async (c) => {
          const tallas = await env.DB.prepare(
            'SELECT talla FROM tallas WHERE color_id = ?'
          ).bind(c.id).all()
          return { ...c, tallas: tallas.results.map(t => t.talla) }
        })
      )

      return new Response(JSON.stringify({
        ...producto,
        imagenes: imagenes.results.map(i => i.url),
        colores: coloresConTallas,
      }), { headers: corsHeaders })
    }

    if (path.startsWith('/api/categoria/')) {
      const id = path.split('/')[3]
      const { results } = await env.DB.prepare(
        'SELECT * FROM productos WHERE categoria_id = ?'
      ).bind(id).all()
      const productosConImagenes = await Promise.all(
        results.map(async (p) => {
          const imagenes = await env.DB.prepare(
            'SELECT url FROM imagenes WHERE producto_id = ? ORDER BY orden'
          ).bind(p.id).all()
          return { ...p, imagenes: imagenes.results.map(i => i.url) }
        })
      )
      return new Response(JSON.stringify(productosConImagenes), { headers: corsHeaders })
    }

    // ==================
    // RUTAS ADMIN
    // ==================

    if (!isAdmin(request, env)) return unauthorized()

    // GET /api/admin/productos
    if (path === '/api/admin/productos' && request.method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM productos').all()
      const productosCompletos = await Promise.all(
        results.map(async (p) => {
          const imagenes = await env.DB.prepare(
            'SELECT * FROM imagenes WHERE producto_id = ? ORDER BY orden'
          ).bind(p.id).all()
          const colores = await env.DB.prepare(
            'SELECT * FROM colores WHERE producto_id = ?'
          ).bind(p.id).all()
          const coloresConTallas = await Promise.all(
            colores.results.map(async (c) => {
              const tallas = await env.DB.prepare(
                'SELECT talla FROM tallas WHERE color_id = ?'
              ).bind(c.id).all()
              return { ...c, tallas: tallas.results.map(t => t.talla) }
            })
          )
          return { ...p, imagenes: imagenes.results, colores: coloresConTallas }
        })
      )
      return new Response(JSON.stringify(productosCompletos), { headers: corsHeaders })
    }

    // POST /api/admin/productos
    if (path === '/api/admin/productos' && request.method === 'POST') {
      const body = await request.json()
      const { id, nombre, precio, categoria_id, nuevo, descripcion, imagenes, colores } = body

      await env.DB.prepare(
        'INSERT INTO productos (id, nombre, precio, categoria_id, nuevo, descripcion) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(id, nombre, precio, categoria_id, nuevo ? 1 : 0, descripcion).run()

      for (let i = 0; i < imagenes.length; i++) {
        await env.DB.prepare(
          'INSERT INTO imagenes (producto_id, url, orden) VALUES (?, ?, ?)'
        ).bind(id, imagenes[i], i).run()
      }

      for (const color of colores) {
        const colorResult = await env.DB.prepare(
          'INSERT INTO colores (producto_id, nombre) VALUES (?, ?)'
        ).bind(id, color.nombre).run()
        const colorId = colorResult.meta.last_row_id
        for (const talla of color.tallas) {
          await env.DB.prepare(
            'INSERT INTO tallas (color_id, talla) VALUES (?, ?)'
          ).bind(colorId, talla).run()
        }
      }

      return new Response(JSON.stringify({ ok: true, id }), { headers: corsHeaders })
    }

    // PUT /api/admin/productos/:id
    if (path.startsWith('/api/admin/productos/') && request.method === 'PUT') {
      const id = path.split('/')[4]
      const body = await request.json()
      const { nombre, precio, categoria_id, nuevo, descripcion, imagenes, colores } = body

      await env.DB.prepare(
        'UPDATE productos SET nombre = ?, precio = ?, categoria_id = ?, nuevo = ?, descripcion = ? WHERE id = ?'
      ).bind(nombre, precio, categoria_id, nuevo ? 1 : 0, descripcion, id).run()

      await env.DB.prepare('DELETE FROM imagenes WHERE producto_id = ?').bind(id).run()
      for (let i = 0; i < imagenes.length; i++) {
        await env.DB.prepare(
          'INSERT INTO imagenes (producto_id, url, orden) VALUES (?, ?, ?)'
        ).bind(id, imagenes[i], i).run()
      }

      const coloresExistentes = await env.DB.prepare(
        'SELECT id FROM colores WHERE producto_id = ?'
      ).bind(id).all()
      for (const c of coloresExistentes.results) {
        await env.DB.prepare('DELETE FROM tallas WHERE color_id = ?').bind(c.id).run()
      }
      await env.DB.prepare('DELETE FROM colores WHERE producto_id = ?').bind(id).run()

      for (const color of colores) {
        const colorResult = await env.DB.prepare(
          'INSERT INTO colores (producto_id, nombre) VALUES (?, ?)'
        ).bind(id, color.nombre).run()
        const colorId = colorResult.meta.last_row_id
        for (const talla of color.tallas) {
          await env.DB.prepare(
            'INSERT INTO tallas (color_id, talla) VALUES (?, ?)'
          ).bind(colorId, talla).run()
        }
      }

      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // DELETE /api/admin/productos/:id
    if (path.startsWith('/api/admin/productos/') && request.method === 'DELETE') {
      const id = path.split('/')[4]

      const colores = await env.DB.prepare(
        'SELECT id FROM colores WHERE producto_id = ?'
      ).bind(id).all()
      for (const c of colores.results) {
        await env.DB.prepare('DELETE FROM tallas WHERE color_id = ?').bind(c.id).run()
      }
      await env.DB.prepare('DELETE FROM colores WHERE producto_id = ?').bind(id).run()
      await env.DB.prepare('DELETE FROM imagenes WHERE producto_id = ?').bind(id).run()
      await env.DB.prepare('DELETE FROM productos WHERE id = ?').bind(id).run()

      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    return new Response(JSON.stringify({ error: 'Ruta no encontrada' }), {
      status: 404,
      headers: corsHeaders,
    })
  }
}