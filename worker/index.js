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
            'SELECT talla, stock FROM tallas WHERE color_id = ?'
          ).bind(c.id).all()
          return { ...c, tallas: tallas.results.map(t => ({ talla: t.talla, stock: t.stock })) }
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

    if (path.startsWith('/api/visita/') && request.method === 'POST') {
      const id = path.split('/')[3]
      const ua = request.headers.get('user-agent') || ''
      const dispositivo = /mobile/i.test(ua) ? 'movil' : 'escritorio'
      const fecha = new Date().toISOString().split('T')[0]
      try {
        await env.DB.prepare(
          'INSERT INTO visitas (producto_id, fecha, dispositivo) VALUES (?, ?, ?)'
        ).bind(id, fecha, dispositivo).run()
      } catch (err) {
        console.error('Error registrando visita:', err)
      }
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
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
                'SELECT talla, stock FROM tallas WHERE color_id = ?'
              ).bind(c.id).all()
              return { ...c, tallas: tallas.results }
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
        for (const t of color.tallas) {
          const talla = typeof t === 'string' ? t : t.talla
          const stock = typeof t === 'object' ? (t.stock ?? 10) : 10
          await env.DB.prepare(
            'INSERT INTO tallas (color_id, talla, stock) VALUES (?, ?, ?)'
          ).bind(colorId, talla, stock).run()
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
        for (const t of color.tallas) {
          const talla = typeof t === 'string' ? t : t.talla
          const stock = typeof t === 'object' ? (t.stock ?? 10) : 10
          await env.DB.prepare(
            'INSERT INTO tallas (color_id, talla, stock) VALUES (?, ?, ?)'
          ).bind(colorId, talla, stock).run()
        }
      }

      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // DELETE /api/admin/productos/:id
    if (path.startsWith('/api/admin/productos/') && request.method === 'DELETE') {
      const id = path.split('/')[4]

      const imagenes = await env.DB.prepare(
        'SELECT url FROM imagenes WHERE producto_id = ?'
      ).bind(id).all()
      for (const img of imagenes.results) {
        const nombreArchivo = img.url.split('/').pop()
        try {
          await env.IMAGES.delete(nombreArchivo)
        } catch (err) {
          console.error('Error eliminando imagen de R2:', nombreArchivo, err)
        }
      }

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

    // PUT /api/admin/stock/:colorId/:talla
    if (path.startsWith('/api/admin/stock/') && request.method === 'PUT') {
      const partes = path.split('/')
      const colorId = partes[4]
      const talla = partes[5]
      const body = await request.json()
      const { stock } = body

      await env.DB.prepare(
        'UPDATE tallas SET stock = ? WHERE color_id = ? AND talla = ?'
      ).bind(stock, colorId, talla).run()

      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // GET /api/admin/analytics
    if (path === '/api/admin/analytics' && request.method === 'GET') {
      const totalVisitas = await env.DB.prepare(
        'SELECT COUNT(*) as total FROM visitas'
      ).first()

      const visitasHoy = await env.DB.prepare(
        'SELECT COUNT(*) as total FROM visitas WHERE fecha = ?'
      ).bind(new Date().toISOString().split('T')[0]).first()

      const productosMasVistos = await env.DB.prepare(`
        SELECT p.id, p.nombre, p.categoria_id, COUNT(v.id) as visitas
        FROM productos p
        LEFT JOIN visitas v ON p.id = v.producto_id
        GROUP BY p.id
        ORDER BY visitas DESC
        LIMIT 10
      `).all()

      const visitasPorDia = await env.DB.prepare(`
        SELECT fecha, COUNT(*) as total
        FROM visitas
        WHERE fecha >= date('now', '-30 days')
        GROUP BY fecha
        ORDER BY fecha ASC
      `).all()

      const visitasPorDispositivo = await env.DB.prepare(`
        SELECT dispositivo, COUNT(*) as total
        FROM visitas
        GROUP BY dispositivo
      `).all()

      return new Response(JSON.stringify({
        totalVisitas: totalVisitas.total,
        visitasHoy: visitasHoy.total,
        productosMasVistos: productosMasVistos.results,
        visitasPorDia: visitasPorDia.results,
        visitasPorDispositivo: visitasPorDispositivo.results,
      }), { headers: corsHeaders })
    }

    // POST /api/admin/imagenes/upload
    if (path === '/api/admin/imagenes/upload' && request.method === 'POST') {
      const formData = await request.formData()
      const archivo = formData.get('file')

      if (!archivo) {
        return new Response(JSON.stringify({ error: 'No se recibio ningun archivo' }), {
          status: 400,
          headers: corsHeaders,
        })
      }

      const extension = archivo.name.split('.').pop().toLowerCase()
      const permitidas = ['jpg', 'jpeg', 'png', 'webp']
      if (!permitidas.includes(extension)) {
        return new Response(JSON.stringify({ error: 'Formato no permitido. Usa JPG, PNG o WEBP' }), {
          status: 400,
          headers: corsHeaders,
        })
      }

      const nombreArchivo = `${Date.now()}-${archivo.name.replace(/\s+/g, '-')}`
      await env.IMAGES.put(nombreArchivo, archivo.stream(), {
        httpMetadata: { contentType: archivo.type },
      })

      const urlPublica = `https://images.intimaexclusive.com/${nombreArchivo}`
      return new Response(JSON.stringify({ ok: true, url: urlPublica }), { headers: corsHeaders })
    }

    return new Response(JSON.stringify({ error: 'Ruta no encontrada' }), {
      status: 404,
      headers: corsHeaders,
    })
  }
}