import jwt from '@tsndr/cloudflare-worker-jwt'

// ===== Config =====
const DEFAULT_ALLOWED_ORIGINS = [
  'https://intimaexclusive.com',
  'https://www.intimaexclusive.com',
]
const SITE_BASE = 'https://intimaexclusive.com'
const IMAGES_PUBLIC_BASE = 'https://images.intimaexclusive.com'

// Envío gratis a partir de este monto (en centavos COP)
const ENVIO_GRATIS_DESDE = 250_000_00 // 250.000 COP
const TARIFA_ENVIO = 15_000_00        // 15.000 COP

const COOKIE_AUTH = 'intima_admin'       // httpOnly, contiene JWT
const COOKIE_HINT = 'intima_admin_hint'  // legible por JS, solo flag
const JWT_TTL_SECONDS = 60 * 60 * 8      // 8 horas
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

// Magic bytes para validar que el archivo es realmente una imagen permitida
const MAGIC_SIGNATURES = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], tail: { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] } },
]

// ===== CORS =====
function getAllowedOrigins(env) {
  if (env.ALLOWED_ORIGINS) {
    return env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return DEFAULT_ALLOWED_ORIGINS
}

function buildCorsHeaders(request, env) {
  const origin = request.headers.get('Origin')
  const allowed = getAllowedOrigins(env)
  const isDev = env.ENVIRONMENT !== 'production'
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
  if (origin && (allowed.includes(origin) || (isDev && /^https?:\/\/localhost(:\d+)?$/.test(origin)))) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }
  return headers
}

// ===== Helpers =====
function json(data, status, cors) {
  return new Response(JSON.stringify(data), { status, headers: cors })
}
const ok = (data, cors) => json(data, 200, cors)
const bad = (msg, cors) => json({ error: msg }, 400, cors)
const unauthorized = (cors) => json({ error: 'No autorizado' }, 401, cors)
const tooMany = (cors, retryAfter) => {
  const headers = { ...cors, 'Retry-After': String(retryAfter) }
  return new Response(JSON.stringify({ error: 'Demasiadas solicitudes' }), { status: 429, headers })
}
const serverError = (cors) => json({ error: 'Error interno' }, 500, cors)
const notFound = (cors) => json({ error: 'Ruta no encontrada' }, 404, cors)

function parseCookies(header) {
  const out = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const k = part.slice(0, idx).trim()
    const v = part.slice(idx + 1).trim()
    if (k) out[k] = decodeURIComponent(v)
  }
  return out
}

async function isAdmin(request, env) {
  // 1) JWT en cookie httpOnly
  const cookies = parseCookies(request.headers.get('Cookie'))
  const token = cookies[COOKIE_AUTH]
  if (token) {
    try {
      const valido = await jwt.verify(token, env.ADMIN_TOKEN)
      if (valido) return true
    } catch { /* token invalido */ }
  }
  // 2) Legacy: Authorization Bearer = ADMIN_TOKEN raw (compat transitoria)
  const auth = request.headers.get('Authorization')
  if (auth && auth.startsWith('Bearer ') && env.ADMIN_TOKEN) {
    if (timingSafeEqual(auth.slice(7), env.ADMIN_TOKEN)) return true
  }
  return false
}

// El API y el frontend viven en dominios distintos (workers.dev vs intimaexclusive.com),
// así que la cookie siempre es cross-site salvo que ambos corran en localhost.
function cookieAttrs(origin) {
  const isLocalhost = !!origin && /^http:\/\/localhost(:\d+)?$/.test(origin)
  if (isLocalhost) {
    return { sameSite: 'Lax', secure: '' }
  }
  return { sameSite: 'None', secure: '; Secure' }
}

function buildAuthCookies(token, origin) {
  const { sameSite, secure } = cookieAttrs(origin)
  return [
    `${COOKIE_AUTH}=${token}; HttpOnly${secure}; SameSite=${sameSite}; Path=/; Max-Age=${JWT_TTL_SECONDS}`,
    `${COOKIE_HINT}=1${secure}; SameSite=${sameSite}; Path=/; Max-Age=${JWT_TTL_SECONDS}`,
  ]
}

function clearAuthCookies(origin) {
  const { sameSite, secure } = cookieAttrs(origin)
  return [
    `${COOKIE_AUTH}=; HttpOnly${secure}; SameSite=${sameSite}; Path=/; Max-Age=0`,
    `${COOKIE_HINT}=${secure}; SameSite=${sameSite}; Path=/; Max-Age=0`,
  ]
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  let res = 0
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return res === 0
}

function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown'
}

// ===== Rate limiting (D1) =====
// Ventana deslizante simple: cuenta hits por (key, ventana) y bloquea si > max.
async function rateLimit(env, key, { windowSec, max }) {
  const now = Math.floor(Date.now() / 1000)
  const bucket = Math.floor(now / windowSec)
  const id = `${key}:${bucket}`
  try {
    const row = await env.DB.prepare(
      'SELECT count FROM rate_limits WHERE id = ?'
    ).bind(id).first()
    const count = (row?.count ?? 0) + 1
    if (count === 1) {
      await env.DB.prepare(
        'INSERT INTO rate_limits (id, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(id) DO UPDATE SET count = count + 1'
      ).bind(id, now + windowSec * 2).run()
    } else {
      await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE id = ?').bind(id).run()
    }
    if (count > max) return { ok: false, retryAfter: (bucket + 1) * windowSec - now }
    return { ok: true }
  } catch (err) {
    // Si la tabla no existe o hay error, no bloqueamos (fail-open) pero loggeamos.
    console.error('rateLimit error', err)
    return { ok: true }
  }
}

// ===== Validación =====
const ID_RE = /^[a-z0-9][a-z0-9-_]{0,63}$/i
const TALLA_RE = /^[A-Za-z0-9.-]{1,8}$/
const CATEGORIA_ID_RE = /^[a-z0-9][a-z0-9-_]{0,63}$/i
const URL_IMAGEN_RE = new RegExp(`^${IMAGES_PUBLIC_BASE.replace(/\./g, '\\.')}/[A-Za-z0-9._-]+$`)

function validateProducto(body, { requireId }) {
  if (!body || typeof body !== 'object') return 'Body inválido'
  const { id, nombre, precio, categoria_id, descripcion, imagenes, colores, nuevo } = body

  if (requireId) {
    if (typeof id !== 'string' || !ID_RE.test(id)) return 'id inválido'
  }
  if (typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.length > 120) return 'nombre inválido'
  if (typeof precio !== 'number' || !Number.isFinite(precio) || precio < 0 || precio > 1e8) return 'precio inválido'
  if (typeof categoria_id !== 'string' || !CATEGORIA_ID_RE.test(categoria_id)) return 'categoria_id inválido'
  if (descripcion != null && (typeof descripcion !== 'string' || descripcion.length > 5000)) return 'descripcion inválida'
  if (nuevo != null && typeof nuevo !== 'boolean' && nuevo !== 0 && nuevo !== 1) return 'nuevo inválido'

  if (!Array.isArray(imagenes) || imagenes.length === 0 || imagenes.length > 20) return 'imagenes inválidas'
  for (const url of imagenes) {
    if (typeof url !== 'string' || !URL_IMAGEN_RE.test(url)) return 'URL de imagen no permitida'
  }

  if (!Array.isArray(colores) || colores.length === 0 || colores.length > 30) return 'colores inválidos'
  for (const c of colores) {
    if (!c || typeof c.nombre !== 'string' || c.nombre.trim().length === 0 || c.nombre.length > 40) return 'nombre de color inválido'
    if (!Array.isArray(c.tallas) || c.tallas.length === 0 || c.tallas.length > 20) return 'tallas inválidas'
    for (const t of c.tallas) {
      const talla = typeof t === 'string' ? t : t?.talla
      const stock = typeof t === 'object' ? (t?.stock ?? 0) : 0
      if (typeof talla !== 'string' || !TALLA_RE.test(talla)) return 'talla inválida'
      if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) return 'stock inválido'
    }
  }
  return null
}

function validateStock(body) {
  if (!body || typeof body !== 'object') return 'Body inválido'
  const { stock } = body
  if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) return 'stock inválido'
  return null
}

function sniffMime(bytes) {
  for (const sig of MAGIC_SIGNATURES) {
    if (bytes.length < sig.bytes.length) continue
    let head = true
    for (let i = 0; i < sig.bytes.length; i++) if (bytes[i] !== sig.bytes[i]) { head = false; break }
    if (!head) continue
    if (sig.tail) {
      const { offset, bytes: tb } = sig.tail
      if (bytes.length < offset + tb.length) continue
      let tail = true
      for (let i = 0; i < tb.length; i++) if (bytes[offset + i] !== tb[i]) { tail = false; break }
      if (!tail) continue
    }
    return sig.mime
  }
  return null
}

// ===== Router =====
export default {
  async fetch(request, env, ctx) {
    const cors = buildCorsHeaders(request, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }
    if (!cors['Access-Control-Allow-Origin']) {
      // Origen no permitido: para rutas browser rechazamos. Permitimos same-origin/healthcheck sin Origin header.
      const origin = request.headers.get('Origin')
      if (origin) return json({ error: 'Origen no permitido' }, 403, cors)
    }

    try {
      const url = new URL(request.url)
      const path = url.pathname
      const method = request.method

      // ========== Sitemap (público, sin CORS) ==========
      if (method === 'GET' && path === '/sitemap.xml') {
        return await handleSitemap(env)
      }

      // ========== Rutas públicas ==========
      if (method === 'GET' && path === '/api/categorias') {
        return await handleCategorias(env, cors)
      }
      if (method === 'GET' && path === '/api/productos') {
        return await handleProductos(env, cors)
      }
      const prodMatch = path.match(/^\/api\/productos\/([^/]+)$/)
      if (method === 'GET' && prodMatch) {
        return await handleProducto(env, cors, decodeURIComponent(prodMatch[1]))
      }
      const catMatch = path.match(/^\/api\/categoria\/([^/]+)$/)
      if (method === 'GET' && catMatch) {
        return await handleCategoria(env, cors, decodeURIComponent(catMatch[1]))
      }
      const visitaMatch = path.match(/^\/api\/visita\/([^/]+)$/)
      if (method === 'POST' && visitaMatch) {
        return await handleVisita(request, env, cors, decodeURIComponent(visitaMatch[1]))
      }

      // Pedidos públicos
      if (method === 'POST' && path === '/api/pedidos') {
        return await handleCrearPedido(request, env, cors)
      }
      const pedidoMatch = path.match(/^\/api\/pedidos\/([^/]+)$/)
      if (method === 'GET' && pedidoMatch) {
        return await handleConsultarPedido(env, cors, decodeURIComponent(pedidoMatch[1]))
      }
      if (method === 'POST' && path === '/api/pedidos/webhook') {
        return await handleWompiWebhook(request, env, cors)
      }

      // Productos relacionados (misma categoria, excluye el propio)
      const relMatch = path.match(/^\/api\/productos\/([^/]+)\/relacionados$/)
      if (method === 'GET' && relMatch) {
        return await handleRelacionados(env, cors, decodeURIComponent(relMatch[1]))
      }

      // Reseñas: publicas (listar y crear pendientes)
      const reviewsMatch = path.match(/^\/api\/productos\/([^/]+)\/reviews$/)
      if (reviewsMatch && method === 'GET') {
        return await handleListReviews(env, cors, decodeURIComponent(reviewsMatch[1]))
      }
      if (reviewsMatch && method === 'POST') {
        return await handleCreateReview(request, env, cors, decodeURIComponent(reviewsMatch[1]))
      }

      // ========== Autenticación admin (sin gate) ==========
      if (method === 'POST' && path === '/api/admin/login') {
        return await handleAdminLogin(request, env, cors)
      }
      if (method === 'POST' && path === '/api/admin/logout') {
        return handleAdminLogout(request, cors)
      }

      // ========== Rutas admin ==========
      if (path.startsWith('/api/admin/')) {
        const ip = getClientIp(request)
        const rl = await rateLimit(env, `admin-auth:${ip}`, { windowSec: 60, max: 30 })
        if (!rl.ok) return tooMany(cors, rl.retryAfter)
        if (!(await isAdmin(request, env))) {
          await rateLimit(env, `admin-fail:${ip}`, { windowSec: 300, max: 10 })
          return unauthorized(cors)
        }

        if (method === 'GET' && path === '/api/admin/me') {
          return ok({ ok: true }, cors)
        }

        if (method === 'GET' && path === '/api/admin/productos') {
          return await handleAdminListProductos(env, cors)
        }
        if (method === 'POST' && path === '/api/admin/productos') {
          const res = await handleAdminCrearProducto(request, env, cors)
          if (res.status === 200) triggerPagesDeploy(env, ctx)
          return res
        }
        const editMatch = path.match(/^\/api\/admin\/productos\/([^/]+)$/)
        if (editMatch && method === 'PUT') {
          const res = await handleAdminEditarProducto(request, env, cors, decodeURIComponent(editMatch[1]))
          if (res.status === 200) triggerPagesDeploy(env, ctx)
          return res
        }
        if (editMatch && method === 'DELETE') {
          const res = await handleAdminEliminarProducto(env, cors, decodeURIComponent(editMatch[1]))
          if (res.status === 200) triggerPagesDeploy(env, ctx)
          return res
        }

        // Pedidos (admin)
        if (method === 'GET' && path === '/api/admin/pedidos') {
          return await handleAdminListPedidos(request, env, cors)
        }
        const adminPedidoMatch = path.match(/^\/api\/admin\/pedidos\/([^/]+)$/)
        if (adminPedidoMatch && method === 'GET') {
          return await handleAdminConsultarPedido(env, cors, decodeURIComponent(adminPedidoMatch[1]))
        }
        const adminEnvioMatch = path.match(/^\/api\/admin\/pedidos\/([^/]+)\/envio$/)
        if (adminEnvioMatch && method === 'PUT') {
          return await handleAdminActualizarEnvio(request, env, cors, decodeURIComponent(adminEnvioMatch[1]))
        }

        // Limpieza de R2: huérfanas (archivos en R2 sin referencia en DB)
        if (method === 'GET' && path === '/api/admin/r2/orphans') {
          return await handleListOrphansR2(env, cors)
        }
        if (method === 'POST' && path === '/api/admin/r2/cleanup') {
          return await handleCleanupR2(request, env, cors)
        }

        // Papelera: listar, restaurar y borrado permanente
        if (method === 'GET' && path === '/api/admin/papelera') {
          return await handleAdminListPapelera(env, cors)
        }
        const restaurarMatch = path.match(/^\/api\/admin\/productos\/([^/]+)\/restaurar$/)
        if (restaurarMatch && method === 'POST') {
          const res = await handleAdminRestaurarProducto(env, cors, decodeURIComponent(restaurarMatch[1]))
          if (res.status === 200) triggerPagesDeploy(env, ctx)
          return res
        }
        const permanenteMatch = path.match(/^\/api\/admin\/productos\/([^/]+)\/permanente$/)
        if (permanenteMatch && method === 'DELETE') {
          const res = await handleAdminBorrarPermanente(env, cors, decodeURIComponent(permanenteMatch[1]))
          if (res.status === 200) triggerPagesDeploy(env, ctx)
          return res
        }

        const stockMatch = path.match(/^\/api\/admin\/stock\/([^/]+)\/([^/]+)$/)
        if (stockMatch && method === 'PUT') {
          return await handleAdminStock(request, env, cors, decodeURIComponent(stockMatch[1]), decodeURIComponent(stockMatch[2]))
        }
        if (method === 'GET' && path === '/api/admin/analytics') {
          return await handleAnalytics(request, env, cors)
        }
        if (method === 'POST' && path === '/api/admin/imagenes/upload') {
          return await handleUpload(request, env, cors)
        }

        // Moderacion de reseñas
        if (method === 'GET' && path === '/api/admin/reviews') {
          return await handleAdminListReviews(request, env, cors)
        }
        const adminReviewMatch = path.match(/^\/api\/admin\/reviews\/(\d+)$/)
        if (adminReviewMatch && method === 'PUT') {
          const res = await handleAdminUpdateReview(request, env, cors, Number(adminReviewMatch[1]))
          // Aprobar/ocultar reseña afecta aggregateRating en HTML pre-renderizado
          if (res.status === 200) triggerPagesDeploy(env, ctx)
          return res
        }
        if (adminReviewMatch && method === 'DELETE') {
          const res = await handleAdminDeleteReview(env, cors, Number(adminReviewMatch[1]))
          if (res.status === 200) triggerPagesDeploy(env, ctx)
          return res
        }
      }

      return notFound(cors)
    } catch (err) {
      console.error('Unhandled error', err)
      return serverError(cors)
    }
  },
}

// ===== Handlers públicos =====
async function handleCategorias(env, cors) {
  const { results } = await env.DB.prepare('SELECT * FROM categorias').all()
  return ok(results, cors)
}

async function handleProductos(env, cors) {
  // Una sola query con GROUP_CONCAT evita N+1
  const { results } = await env.DB.prepare(`
    SELECT p.*, GROUP_CONCAT(i.url, '|') AS imagenes_concat
    FROM productos p
    LEFT JOIN (SELECT producto_id, url, orden FROM imagenes ORDER BY orden) i
      ON i.producto_id = p.id
    WHERE p.deleted_at IS NULL
    GROUP BY p.id
  `).all()
  const productos = results.map((p) => ({
    ...p,
    imagenes: p.imagenes_concat ? p.imagenes_concat.split('|') : [],
    imagenes_concat: undefined,
  }))
  return ok(productos, cors)
}

async function handleProducto(env, cors, id) {
  if (!ID_RE.test(id)) return json({ error: 'id inválido' }, 400, cors)
  const producto = await env.DB.prepare(
    'SELECT * FROM productos WHERE id = ? AND deleted_at IS NULL'
  ).bind(id).first()
  if (!producto) return json({ error: 'No encontrado' }, 404, cors)

  const [imagenes, colores] = await Promise.all([
    env.DB.prepare('SELECT url FROM imagenes WHERE producto_id = ? ORDER BY orden').bind(id).all(),
    env.DB.prepare('SELECT * FROM colores WHERE producto_id = ?').bind(id).all(),
  ])

  const colorIds = colores.results.map((c) => c.id)
  let tallasRows = { results: [] }
  if (colorIds.length) {
    const placeholders = colorIds.map(() => '?').join(',')
    tallasRows = await env.DB.prepare(
      `SELECT color_id, talla, stock FROM tallas WHERE color_id IN (${placeholders})`
    ).bind(...colorIds).all()
  }
  const tallasPorColor = new Map()
  for (const t of tallasRows.results) {
    if (!tallasPorColor.has(t.color_id)) tallasPorColor.set(t.color_id, [])
    tallasPorColor.get(t.color_id).push({ talla: t.talla, stock: t.stock })
  }

  return ok({
    ...producto,
    imagenes: imagenes.results.map((i) => i.url),
    colores: colores.results.map((c) => ({ ...c, tallas: tallasPorColor.get(c.id) || [] })),
  }, cors)
}

async function handleCategoria(env, cors, id) {
  if (!CATEGORIA_ID_RE.test(id)) return json({ error: 'id inválido' }, 400, cors)
  const { results } = await env.DB.prepare(`
    SELECT
      p.*,
      (SELECT GROUP_CONCAT(url, '|') FROM (SELECT url FROM imagenes WHERE producto_id = p.id ORDER BY orden)) AS imagenes_concat,
      (SELECT GROUP_CONCAT(DISTINCT nombre) FROM colores WHERE producto_id = p.id) AS colores_concat
    FROM productos p
    WHERE p.categoria_id = ? AND p.deleted_at IS NULL
  `).bind(id).all()
  const productos = results.map((p) => ({
    ...p,
    imagenes: p.imagenes_concat ? p.imagenes_concat.split('|') : [],
    colores: p.colores_concat ? p.colores_concat.split(',') : [],
    imagenes_concat: undefined,
    colores_concat: undefined,
  }))
  return ok(productos, cors)
}

async function handleVisita(request, env, cors, id) {
  if (!ID_RE.test(id)) return bad('id inválido', cors)
  const ip = getClientIp(request)
  const rl = await rateLimit(env, `visita:${ip}`, { windowSec: 60, max: 60 })
  if (!rl.ok) return tooMany(cors, rl.retryAfter)

  const ua = request.headers.get('user-agent') || ''
  const dispositivo = /mobile/i.test(ua) ? 'movil' : 'escritorio'
  const fecha = new Date().toISOString().split('T')[0]
  try {
    await env.DB.prepare(
      'INSERT INTO visitas (producto_id, fecha, dispositivo) VALUES (?, ?, ?)'
    ).bind(id, fecha, dispositivo).run()
  } catch (err) {
    console.error('Error registrando visita', err)
  }
  return ok({ ok: true }, cors)
}

// ===== Handlers admin =====
async function handleAdminListProductos(env, cors) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM productos WHERE deleted_at IS NULL'
  ).all()
  const ids = results.map((p) => p.id)
  if (!ids.length) return ok([], cors)
  const ph = ids.map(() => '?').join(',')

  const [imgs, cols] = await Promise.all([
    env.DB.prepare(`SELECT * FROM imagenes WHERE producto_id IN (${ph}) ORDER BY orden`).bind(...ids).all(),
    env.DB.prepare(`SELECT * FROM colores WHERE producto_id IN (${ph})`).bind(...ids).all(),
  ])

  const colorIds = cols.results.map((c) => c.id)
  let tallas = { results: [] }
  if (colorIds.length) {
    const tph = colorIds.map(() => '?').join(',')
    tallas = await env.DB.prepare(
      `SELECT * FROM tallas WHERE color_id IN (${tph})`
    ).bind(...colorIds).all()
  }

  const imgsByProd = new Map()
  for (const i of imgs.results) {
    if (!imgsByProd.has(i.producto_id)) imgsByProd.set(i.producto_id, [])
    imgsByProd.get(i.producto_id).push(i)
  }
  const tallasByColor = new Map()
  for (const t of tallas.results) {
    if (!tallasByColor.has(t.color_id)) tallasByColor.set(t.color_id, [])
    tallasByColor.get(t.color_id).push(t)
  }
  const colsByProd = new Map()
  for (const c of cols.results) {
    if (!colsByProd.has(c.producto_id)) colsByProd.set(c.producto_id, [])
    colsByProd.get(c.producto_id).push({ ...c, tallas: tallasByColor.get(c.id) || [] })
  }

  return ok(results.map((p) => ({
    ...p,
    imagenes: imgsByProd.get(p.id) || [],
    colores: colsByProd.get(p.id) || [],
  })), cors)
}

async function handleAdminCrearProducto(request, env, cors) {
  const body = await safeJson(request)
  const err = validateProducto(body, { requireId: true })
  if (err) return bad(err, cors)

  const existe = await env.DB.prepare('SELECT id FROM productos WHERE id = ?').bind(body.id).first()
  if (existe) return json({ error: 'id ya existe' }, 409, cors)

  const stmts = [
    env.DB.prepare(
      'INSERT INTO productos (id, nombre, precio, categoria_id, nuevo, descripcion) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(body.id, body.nombre.trim(), body.precio, body.categoria_id, body.nuevo ? 1 : 0, body.descripcion ?? null),
    ...body.imagenes.map((url, i) =>
      env.DB.prepare('INSERT INTO imagenes (producto_id, url, orden) VALUES (?, ?, ?)').bind(body.id, url, i)
    ),
  ]

  // Colores y tallas: dos pasadas para usar last_row_id (batch garantiza atomicidad por pasada)
  await env.DB.batch(stmts)

  for (const color of body.colores) {
    const res = await env.DB.prepare(
      'INSERT INTO colores (producto_id, nombre) VALUES (?, ?)'
    ).bind(body.id, color.nombre.trim()).run()
    const colorId = res.meta.last_row_id
    const tallaStmts = color.tallas.map((t) => {
      const talla = typeof t === 'string' ? t : t.talla
      const stock = typeof t === 'object' ? (t.stock ?? 0) : 0
      return env.DB.prepare(
        'INSERT INTO tallas (color_id, talla, stock) VALUES (?, ?, ?)'
      ).bind(colorId, talla, stock)
    })
    if (tallaStmts.length) await env.DB.batch(tallaStmts)
  }

  return ok({ ok: true, id: body.id }, cors)
}

async function handleAdminEditarProducto(request, env, cors, id) {
  if (!ID_RE.test(id)) return bad('id inválido', cors)
  const body = await safeJson(request)
  const err = validateProducto({ ...body, id }, { requireId: false })
  if (err) return bad(err, cors)

  const existe = await env.DB.prepare('SELECT id FROM productos WHERE id = ?').bind(id).first()
  if (!existe) return json({ error: 'No encontrado' }, 404, cors)

  // Capturamos las URLs actuales antes de reemplazar, para borrar de R2 las que queden huérfanas.
  const previas = await env.DB.prepare(
    'SELECT url FROM imagenes WHERE producto_id = ?'
  ).bind(id).all()
  const nuevas = new Set(body.imagenes)
  const huerfanas = previas.results
    .map((r) => r.url)
    .filter((url) => !nuevas.has(url))

  // Limpiar dependientes, actualizar producto y reinsertar imágenes — todo en un batch atómico.
  const cleanupStmts = [
    env.DB.prepare('UPDATE productos SET nombre = ?, precio = ?, categoria_id = ?, nuevo = ?, descripcion = ? WHERE id = ?')
      .bind(body.nombre.trim(), body.precio, body.categoria_id, body.nuevo ? 1 : 0, body.descripcion ?? null, id),
    env.DB.prepare('DELETE FROM tallas WHERE color_id IN (SELECT id FROM colores WHERE producto_id = ?)').bind(id),
    env.DB.prepare('DELETE FROM colores WHERE producto_id = ?').bind(id),
    env.DB.prepare('DELETE FROM imagenes WHERE producto_id = ?').bind(id),
    ...body.imagenes.map((url, i) =>
      env.DB.prepare('INSERT INTO imagenes (producto_id, url, orden) VALUES (?, ?, ?)').bind(id, url, i)
    ),
  ]
  await env.DB.batch(cleanupStmts)

  // Best-effort: borrar de R2 las imágenes que el admin quitó.
  for (const url of huerfanas) {
    const nombreArchivo = url.split('/').pop()
    if (nombreArchivo) {
      try { await env.IMAGES.delete(nombreArchivo) } catch (err) { console.error('R2 delete huérfana', err) }
    }
  }

  for (const color of body.colores) {
    const res = await env.DB.prepare(
      'INSERT INTO colores (producto_id, nombre) VALUES (?, ?)'
    ).bind(id, color.nombre.trim()).run()
    const colorId = res.meta.last_row_id
    const tallaStmts = color.tallas.map((t) => {
      const talla = typeof t === 'string' ? t : t.talla
      const stock = typeof t === 'object' ? (t.stock ?? 0) : 0
      return env.DB.prepare(
        'INSERT INTO tallas (color_id, talla, stock) VALUES (?, ?, ?)'
      ).bind(colorId, talla, stock)
    })
    if (tallaStmts.length) await env.DB.batch(tallaStmts)
  }

  return ok({ ok: true }, cors)
}

// Soft-delete: marca deleted_at. El producto desaparece del front público
// pero se conserva la data y las imágenes para poder restaurar.
async function handleAdminEliminarProducto(env, cors, id) {
  if (!ID_RE.test(id)) return bad('id inválido', cors)
  const res = await env.DB.prepare(
    'UPDATE productos SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL'
  ).bind(new Date().toISOString(), id).run()
  if (res.meta.changes === 0) return json({ error: 'No encontrado' }, 404, cors)
  return ok({ ok: true }, cors)
}

async function handleAdminListPapelera(env, cors) {
  const { results } = await env.DB.prepare(
    'SELECT id, nombre, precio, categoria_id, deleted_at FROM productos WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
  ).all()
  return ok(results, cors)
}

async function handleAdminRestaurarProducto(env, cors, id) {
  if (!ID_RE.test(id)) return bad('id inválido', cors)
  const res = await env.DB.prepare(
    'UPDATE productos SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL'
  ).bind(id).run()
  if (res.meta.changes === 0) return json({ error: 'No encontrado en papelera' }, 404, cors)
  return ok({ ok: true }, cors)
}

// ===== Limpieza R2: detecta archivos sin referencia en la DB =====
async function handleListOrphansR2(env, cors) {
  // Paginar R2 por si hay muchos objetos
  let cursor = undefined
  const r2Objects = []
  do {
    const list = await env.IMAGES.list({ cursor, limit: 1000 })
    r2Objects.push(...list.objects)
    cursor = list.truncated ? list.cursor : undefined
  } while (cursor)

  // Todas las URLs referenciadas desde la tabla imagenes
  const { results } = await env.DB.prepare('SELECT url FROM imagenes').all()
  const keysReferenciados = new Set(
    results
      .map((r) => r.url.split('/').pop())
      .filter(Boolean)
  )

  const orphans = r2Objects
    .filter((o) => !keysReferenciados.has(o.key))
    .map((o) => ({
      key: o.key,
      size: o.size,
      uploaded: o.uploaded?.toISOString?.() || null,
    }))

  const totalSize = orphans.reduce((s, o) => s + (o.size || 0), 0)

  return ok({
    totalR2: r2Objects.length,
    referenciadas: r2Objects.length - orphans.length,
    orphans,
    totalSize,
  }, cors)
}

async function handleCleanupR2(request, env, cors) {
  const body = await safeJson(request)
  if (!body || !Array.isArray(body.keys) || body.keys.length === 0) {
    return bad('Envía un array "keys" con los archivos a eliminar', cors)
  }
  if (body.keys.length > 500) {
    return bad('Máximo 500 archivos por limpieza', cors)
  }
  // Validación: claves con caracteres seguros; evita rutas absolutas o traversal
  const keyRe = /^[A-Za-z0-9._-]+$/
  const invalid = body.keys.find((k) => typeof k !== 'string' || !keyRe.test(k))
  if (invalid) return bad(`Key inválida: ${invalid}`, cors)

  // Doble chequeo server-side: NO borrar si la key está referenciada en la DB
  const { results } = await env.DB.prepare('SELECT url FROM imagenes').all()
  const keysReferenciados = new Set(
    results.map((r) => r.url.split('/').pop()).filter(Boolean)
  )

  const eliminadas = []
  const protegidas = []
  const fallidas = []

  for (const key of body.keys) {
    if (keysReferenciados.has(key)) {
      protegidas.push(key)
      continue
    }
    try {
      await env.IMAGES.delete(key)
      eliminadas.push(key)
    } catch (err) {
      console.error('R2 delete', key, err)
      fallidas.push(key)
    }
  }

  return ok({
    eliminadas: eliminadas.length,
    protegidas: protegidas.length,
    fallidas: fallidas.length,
    detallesProtegidas: protegidas,
    detallesFallidas: fallidas,
  }, cors)
}

// Hard delete: borra todas las filas y los objetos en R2. Solo se ejecuta
// sobre productos que ya están en la papelera.
async function handleAdminBorrarPermanente(env, cors, id) {
  if (!ID_RE.test(id)) return bad('id inválido', cors)
  const existe = await env.DB.prepare(
    'SELECT id FROM productos WHERE id = ? AND deleted_at IS NOT NULL'
  ).bind(id).first()
  if (!existe) return json({ error: 'El producto debe estar en papelera primero' }, 409, cors)

  const imagenes = await env.DB.prepare('SELECT url FROM imagenes WHERE producto_id = ?').bind(id).all()

  await env.DB.batch([
    env.DB.prepare('DELETE FROM tallas WHERE color_id IN (SELECT id FROM colores WHERE producto_id = ?)').bind(id),
    env.DB.prepare('DELETE FROM colores WHERE producto_id = ?').bind(id),
    env.DB.prepare('DELETE FROM imagenes WHERE producto_id = ?').bind(id),
    env.DB.prepare('DELETE FROM visitas WHERE producto_id = ?').bind(id),
    env.DB.prepare('DELETE FROM reviews WHERE producto_id = ?').bind(id),
    env.DB.prepare('DELETE FROM productos WHERE id = ?').bind(id),
  ])

  for (const img of imagenes.results) {
    const nombreArchivo = img.url.split('/').pop()
    if (nombreArchivo) {
      try { await env.IMAGES.delete(nombreArchivo) } catch (err) { console.error('R2 delete', err) }
    }
  }

  return ok({ ok: true }, cors)
}

async function handleAdminStock(request, env, cors, colorIdStr, talla) {
  const colorId = Number(colorIdStr)
  if (!Number.isInteger(colorId) || colorId <= 0) return bad('color_id inválido', cors)
  if (!TALLA_RE.test(talla)) return bad('talla inválida', cors)
  const body = await safeJson(request)
  const err = validateStock(body)
  if (err) return bad(err, cors)

  const res = await env.DB.prepare(
    'UPDATE tallas SET stock = ? WHERE color_id = ? AND talla = ?'
  ).bind(body.stock, colorId, talla).run()

  if (res.meta.changes === 0) return json({ error: 'No encontrado' }, 404, cors)
  return ok({ ok: true }, cors)
}

async function handleAnalytics(request, env, cors) {
  const url = new URL(request.url)
  const rangoParam = url.searchParams.get('rango') || '30d'
  const diasMap = { '7d': 7, '30d': 30, '90d': 90 }
  const dias = diasMap[rangoParam] || 30
  const hoy = new Date().toISOString().split('T')[0]

  const [
    totalVisitas,
    visitasHoy,
    visitasRango,
    visitasPrevio,
    productosMasVistos,
    visitasPorDia,
    visitasPorDispositivo,
    visitasPorCategoria,
  ] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as total FROM visitas').first(),
    env.DB.prepare('SELECT COUNT(*) as total FROM visitas WHERE fecha = ?').bind(hoy).first(),
    env.DB.prepare(`SELECT COUNT(*) as total FROM visitas WHERE fecha >= date('now', ?)`).bind(`-${dias} days`).first(),
    env.DB.prepare(`SELECT COUNT(*) as total FROM visitas WHERE fecha >= date('now', ?) AND fecha < date('now', ?)`).bind(`-${dias * 2} days`, `-${dias} days`).first(),
    env.DB.prepare(`
      SELECT p.id, p.nombre, p.categoria_id, COUNT(v.id) as visitas
      FROM productos p
      LEFT JOIN visitas v ON p.id = v.producto_id AND v.fecha >= date('now', ?)
      WHERE p.deleted_at IS NULL
      GROUP BY p.id
      ORDER BY visitas DESC
      LIMIT 10
    `).bind(`-${dias} days`).all(),
    env.DB.prepare(`
      SELECT fecha, COUNT(*) as total FROM visitas
      WHERE fecha >= date('now', ?)
      GROUP BY fecha ORDER BY fecha ASC
    `).bind(`-${dias} days`).all(),
    env.DB.prepare(`
      SELECT dispositivo, COUNT(*) as total FROM visitas
      WHERE fecha >= date('now', ?)
      GROUP BY dispositivo
    `).bind(`-${dias} days`).all(),
    env.DB.prepare(`
      SELECT p.categoria_id as categoria, COUNT(v.id) as total
      FROM visitas v
      JOIN productos p ON p.id = v.producto_id
      WHERE v.fecha >= date('now', ?)
      GROUP BY p.categoria_id
      ORDER BY total DESC
    `).bind(`-${dias} days`).all(),
  ])

  const prev = visitasPrevio?.total ?? 0
  const curr = visitasRango?.total ?? 0
  const cambio = prev === 0
    ? (curr > 0 ? 100 : 0)
    : Math.round(((curr - prev) / prev) * 100)

  return ok({
    rango: rangoParam,
    dias,
    totalVisitas: totalVisitas.total,
    visitasHoy: visitasHoy.total,
    visitasRango: curr,
    visitasPrevio: prev,
    cambioPorcentual: cambio,
    productosMasVistos: productosMasVistos.results,
    visitasPorDia: visitasPorDia.results,
    visitasPorDispositivo: visitasPorDispositivo.results,
    visitasPorCategoria: visitasPorCategoria.results,
  }, cors)
}

async function handleUpload(request, env, cors) {
  const contentLength = Number(request.headers.get('Content-Length') || 0)
  if (contentLength && contentLength > MAX_IMAGE_BYTES + 4096) {
    return json({ error: 'Archivo demasiado grande' }, 413, cors)
  }

  let formData
  try { formData = await request.formData() }
  catch { return bad('multipart inválido', cors) }

  const archivo = formData.get('file')
  if (!archivo || typeof archivo === 'string') return bad('Archivo requerido', cors)
  if (archivo.size > MAX_IMAGE_BYTES) return json({ error: 'Archivo demasiado grande (máx 5 MB)' }, 413, cors)
  if (!ALLOWED_MIME.has(archivo.type)) return bad('Tipo MIME no permitido', cors)

  const buf = new Uint8Array(await archivo.arrayBuffer())
  const realMime = sniffMime(buf)
  if (!realMime || !ALLOWED_MIME.has(realMime) || realMime !== archivo.type) {
    return bad('El contenido del archivo no coincide con una imagen permitida', cors)
  }

  const ext = realMime === 'image/jpeg' ? 'jpg' : realMime === 'image/png' ? 'png' : 'webp'
  // Nombre aleatorio: evita colisiones y no expone nombres del cliente.
  const rand = crypto.randomUUID().replace(/-/g, '')
  const nombreArchivo = `${Date.now()}-${rand}.${ext}`

  await env.IMAGES.put(nombreArchivo, buf, {
    httpMetadata: { contentType: realMime },
  })

  const urlPublica = `${IMAGES_PUBLIC_BASE}/${nombreArchivo}`
  return ok({ ok: true, url: urlPublica }, cors)
}

async function safeJson(request) {
  try { return await request.json() } catch { return null }
}

// ===== Re-deploy de Cloudflare Pages =====
// Llama al Deploy Hook configurado en Pages para re-buildear el sitio
// y regenerar el HTML pre-renderizado tras cambios de catálogo.
//
// Configurar PAGES_DEPLOY_HOOK como secret:
//   wrangler secret put PAGES_DEPLOY_HOOK
// Valor: la URL del hook (Pages → Settings → Builds → Deploy hooks → Add).
//
// Se llama "fire and forget" via waitUntil para no bloquear al admin.
function triggerPagesDeploy(env, ctx) {
  if (!env.PAGES_DEPLOY_HOOK) return
  const promise = fetch(env.PAGES_DEPLOY_HOOK, { method: 'POST' })
    .then((r) => console.log('Pages deploy hook:', r.status))
    .catch((err) => console.error('Pages deploy hook failed:', err))
  if (ctx?.waitUntil) ctx.waitUntil(promise)
}

// ===== Productos relacionados =====
async function handleRelacionados(env, cors, productoId) {
  if (!ID_RE.test(productoId)) return bad('id inválido', cors)

  const prod = await env.DB.prepare(
    'SELECT categoria_id FROM productos WHERE id = ?'
  ).bind(productoId).first()
  if (!prod) return json({ error: 'No encontrado' }, 404, cors)

  const { results } = await env.DB.prepare(`
    SELECT p.*, GROUP_CONCAT(i.url, '|') AS imagenes_concat
    FROM productos p
    LEFT JOIN (SELECT producto_id, url, orden FROM imagenes ORDER BY orden) i
      ON i.producto_id = p.id
    WHERE p.categoria_id = ? AND p.id != ? AND p.deleted_at IS NULL
    GROUP BY p.id
    ORDER BY p.nuevo DESC, RANDOM()
    LIMIT 4
  `).bind(prod.categoria_id, productoId).all()

  const productos = results.map((p) => ({
    ...p,
    imagenes: p.imagenes_concat ? p.imagenes_concat.split('|') : [],
    imagenes_concat: undefined,
  }))
  return ok(productos, cors)
}

// ===== Reseñas =====
async function handleListReviews(env, cors, productoId) {
  if (!ID_RE.test(productoId)) return bad('id inválido', cors)
  const { results } = await env.DB.prepare(
    'SELECT id, nombre, rating, comentario, fecha FROM reviews WHERE producto_id = ? AND aprobada = 1 ORDER BY fecha DESC LIMIT 50'
  ).bind(productoId).all()
  const agg = await env.DB.prepare(
    'SELECT COUNT(*) as total, AVG(rating) as promedio FROM reviews WHERE producto_id = ? AND aprobada = 1'
  ).bind(productoId).first()
  return ok({
    total: agg?.total ?? 0,
    promedio: agg?.promedio ? Math.round(agg.promedio * 10) / 10 : null,
    reviews: results,
  }, cors)
}

async function handleCreateReview(request, env, cors, productoId) {
  if (!ID_RE.test(productoId)) return bad('id inválido', cors)
  const ip = getClientIp(request)
  const rl = await rateLimit(env, `review:${ip}`, { windowSec: 3600, max: 5 })
  if (!rl.ok) return tooMany(cors, rl.retryAfter)

  const producto = await env.DB.prepare('SELECT id FROM productos WHERE id = ?').bind(productoId).first()
  if (!producto) return json({ error: 'Producto no encontrado' }, 404, cors)

  const body = await safeJson(request)
  if (!body || typeof body !== 'object') return bad('Body inválido', cors)
  const { nombre, rating, comentario } = body

  if (typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.length > 60) {
    return bad('Nombre inválido (2-60 caracteres)', cors)
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return bad('Rating inválido (1-5)', cors)
  }
  if (typeof comentario !== 'string' || comentario.trim().length < 10 || comentario.length > 2000) {
    return bad('Comentario inválido (10-2000 caracteres)', cors)
  }

  const fecha = new Date().toISOString()
  await env.DB.prepare(
    'INSERT INTO reviews (producto_id, nombre, rating, comentario, fecha, aprobada) VALUES (?, ?, ?, ?, ?, 0)'
  ).bind(productoId, nombre.trim(), rating, comentario.trim(), fecha).run()

  return ok({ ok: true, mensaje: 'Tu reseña fue enviada y será publicada tras revisión.' }, cors)
}

async function handleAdminListReviews(request, env, cors) {
  const url = new URL(request.url)
  const estado = url.searchParams.get('estado') // 'pendientes' | 'aprobadas' | null (todas)
  let query = 'SELECT r.*, p.nombre as producto_nombre FROM reviews r LEFT JOIN productos p ON r.producto_id = p.id'
  const binds = []
  if (estado === 'pendientes') { query += ' WHERE r.aprobada = 0'; }
  else if (estado === 'aprobadas') { query += ' WHERE r.aprobada = 1'; }
  query += ' ORDER BY r.fecha DESC LIMIT 200'
  const { results } = await env.DB.prepare(query).bind(...binds).all()
  return ok(results, cors)
}

async function handleAdminUpdateReview(request, env, cors, id) {
  const body = await safeJson(request)
  if (!body || typeof body.aprobada !== 'boolean') return bad('aprobada debe ser boolean', cors)
  const res = await env.DB.prepare('UPDATE reviews SET aprobada = ? WHERE id = ?')
    .bind(body.aprobada ? 1 : 0, id).run()
  if (res.meta.changes === 0) return json({ error: 'No encontrada' }, 404, cors)
  return ok({ ok: true }, cors)
}

async function handleAdminDeleteReview(env, cors, id) {
  const res = await env.DB.prepare('DELETE FROM reviews WHERE id = ?').bind(id).run()
  if (res.meta.changes === 0) return json({ error: 'No encontrada' }, 404, cors)
  return ok({ ok: true }, cors)
}

// ===== Autenticación admin (JWT + cookie) =====
async function handleAdminLogin(request, env, cors) {
  const ip = getClientIp(request)
  const rl = await rateLimit(env, `admin-login:${ip}`, { windowSec: 300, max: 10 })
  if (!rl.ok) return tooMany(cors, rl.retryAfter)

  const body = await safeJson(request)
  const password = body?.password
  if (typeof password !== 'string' || password.length === 0) return bad('Password requerido', cors)
  if (!env.ADMIN_TOKEN) return serverError(cors)

  if (!timingSafeEqual(password, env.ADMIN_TOKEN)) {
    await rateLimit(env, `admin-fail:${ip}`, { windowSec: 300, max: 10 })
    return unauthorized(cors)
  }

  const now = Math.floor(Date.now() / 1000)
  const token = await jwt.sign(
    { sub: 'admin', iat: now, exp: now + JWT_TTL_SECONDS },
    env.ADMIN_TOKEN,
  )

  const origin = request.headers.get('Origin')
  const [cookieAuth, cookieHint] = buildAuthCookies(token, origin)

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: [
      ...Object.entries(cors),
      ['Set-Cookie', cookieAuth],
      ['Set-Cookie', cookieHint],
    ],
  })
}

function handleAdminLogout(request, cors) {
  const origin = request.headers.get('Origin')
  const [cookieAuth, cookieHint] = clearAuthCookies(origin)
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: [
      ...Object.entries(cors),
      ['Set-Cookie', cookieAuth],
      ['Set-Cookie', cookieHint],
    ],
  })
}

// ===== Pedidos / Wompi =====
async function sha256Hex(str) {
  const buf = new TextEncoder().encode(str)
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function generarReference() {
  // Prefijo + timestamp + random para ser únicos y legibles
  return `INT-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TEL_RE = /^[+0-9\s\-()]{7,20}$/

function validarCrearPedido(body) {
  if (!body || typeof body !== 'object') return 'Body inválido'
  const { cliente, items } = body
  if (!cliente || typeof cliente !== 'object') return 'Cliente requerido'
  const { nombre, email, telefono, direccion, ciudad } = cliente
  if (typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.length > 100) return 'Nombre inválido'
  if (typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 120) return 'Email inválido'
  if (typeof telefono !== 'string' || !TEL_RE.test(telefono)) return 'Teléfono inválido'
  if (typeof direccion !== 'string' || direccion.trim().length < 5 || direccion.length > 200) return 'Dirección inválida'
  if (typeof ciudad !== 'string' || ciudad.trim().length < 2 || ciudad.length > 80) return 'Ciudad inválida'

  if (!Array.isArray(items) || items.length === 0 || items.length > 50) return 'Items inválidos'
  for (const it of items) {
    if (typeof it.productoId !== 'string' || !ID_RE.test(it.productoId)) return 'productoId inválido'
    if (typeof it.color !== 'string' || it.color.length < 1 || it.color.length > 40) return 'color inválido'
    if (typeof it.talla !== 'string' || !TALLA_RE.test(it.talla)) return 'talla inválida'
    if (!Number.isInteger(it.cantidad) || it.cantidad < 1 || it.cantidad > 20) return 'cantidad inválida'
  }
  return null
}

async function handleCrearPedido(request, env, cors) {
  const ip = getClientIp(request)
  const rl = await rateLimit(env, `pedido:${ip}`, { windowSec: 3600, max: 20 })
  if (!rl.ok) return tooMany(cors, rl.retryAfter)

  const body = await safeJson(request)
  const err = validarCrearPedido(body)
  if (err) return bad(err, cors)

  // Re-leer precios desde DB (nunca confiar en el precio del cliente)
  const productoIds = [...new Set(body.items.map((i) => i.productoId))]
  const ph = productoIds.map(() => '?').join(',')
  const { results: productos } = await env.DB.prepare(
    `SELECT id, nombre, precio FROM productos WHERE id IN (${ph}) AND deleted_at IS NULL`
  ).bind(...productoIds).all()
  const prodMap = new Map(productos.map((p) => [p.id, p]))

  // Validar stock disponible antes de proceder al pago
  const { results: stockRows } = await env.DB.prepare(`
    SELECT p.id AS producto_id, c.nombre AS color, t.talla, t.stock
    FROM productos p
    JOIN colores c ON c.producto_id = p.id
    JOIN tallas t ON t.color_id = c.id
    WHERE p.id IN (${ph})
  `).bind(...productoIds).all()
  const stockMap = new Map(
    stockRows.map((r) => [`${r.producto_id}::${r.color}::${r.talla}`, r.stock])
  )

  let subtotalCentavos = 0
  const itemsNormalizados = []
  for (const it of body.items) {
    const prod = prodMap.get(it.productoId)
    if (!prod) return json({ error: `Producto ${it.productoId} no disponible` }, 409, cors)

    const stockKey = `${it.productoId}::${it.color}::${it.talla}`
    const stockDisponible = stockMap.get(stockKey)
    if (stockDisponible == null) {
      return json({ error: `Variante no encontrada: ${prod.nombre} ${it.color} talla ${it.talla}` }, 409, cors)
    }
    if (stockDisponible < it.cantidad) {
      return json({
        error: stockDisponible === 0
          ? `Agotado: ${prod.nombre} en ${it.color}, talla ${it.talla}. Por favor actualiza tu selección.`
          : `Stock insuficiente: ${prod.nombre} en ${it.color}, talla ${it.talla}. Quedan ${stockDisponible}, pediste ${it.cantidad}.`,
      }, 409, cors)
    }

    const precioCentavos = Math.round(prod.precio * 100)
    subtotalCentavos += precioCentavos * it.cantidad
    itemsNormalizados.push({
      productoId: prod.id,
      nombre: prod.nombre,
      color: it.color,
      talla: it.talla,
      cantidad: it.cantidad,
      precioUnitario: precioCentavos,
    })
  }

  const envioCentavos = subtotalCentavos >= ENVIO_GRATIS_DESDE ? 0 : TARIFA_ENVIO
  const totalCentavos = subtotalCentavos + envioCentavos

  if (totalCentavos < 50_00) return bad('Monto mínimo $500', cors) // Wompi mínimo 1500 COP
  if (totalCentavos > 50_000_000_00) return bad('Monto máximo excedido', cors)

  const reference = generarReference()
  const now = new Date().toISOString()
  const cli = body.cliente

  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO pedidos (
        reference, status, nombre, email, telefono, documento_tipo, documento_numero,
        direccion, ciudad, departamento, codigo_postal, notas,
        subtotal, envio, total, creado_at, actualizado_at
      ) VALUES (?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      reference,
      cli.nombre.trim(), cli.email.trim().toLowerCase(), cli.telefono.trim(),
      cli.documento_tipo ?? null, cli.documento_numero ?? null,
      cli.direccion.trim(), cli.ciudad.trim(),
      cli.departamento ?? null, cli.codigo_postal ?? null, cli.notas ?? null,
      subtotalCentavos, envioCentavos, totalCentavos, now, now
    ),
    ...itemsNormalizados.map((it) =>
      env.DB.prepare(`
        INSERT INTO pedidos_items (pedido_ref, producto_id, nombre, color, talla, precio_unitario, cantidad)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(reference, it.productoId, it.nombre, it.color, it.talla, it.precioUnitario, it.cantidad)
    ),
  ])

  // Firma de integridad para el widget: SHA256(ref + amount + currency + integritySecret)
  if (!env.WOMPI_INTEGRITY_SECRET) {
    return serverError(cors)
  }
  const signature = await sha256Hex(`${reference}${totalCentavos}COP${env.WOMPI_INTEGRITY_SECRET}`)
  const publicKey = env.WOMPI_PUBLIC_KEY || ''

  return ok({
    reference,
    publicKey,
    amountInCents: totalCentavos,
    currency: 'COP',
    signature,
    subtotal: subtotalCentavos,
    envio: envioCentavos,
    total: totalCentavos,
  }, cors)
}

async function handleConsultarPedido(env, cors, reference) {
  if (typeof reference !== 'string' || reference.length < 3 || reference.length > 64) {
    return bad('reference inválida', cors)
  }
  const pedido = await env.DB.prepare(
    `SELECT reference, status, wompi_transaction_id, wompi_payment_method,
            nombre, email, telefono, direccion, ciudad,
            subtotal, envio, total, estado_envio, creado_at, actualizado_at
     FROM pedidos WHERE reference = ?`
  ).bind(reference).first()
  if (!pedido) return json({ error: 'Pedido no encontrado' }, 404, cors)

  const { results: items } = await env.DB.prepare(
    `SELECT producto_id, nombre, color, talla, precio_unitario, cantidad
     FROM pedidos_items WHERE pedido_ref = ?`
  ).bind(reference).all()

  return ok({ ...pedido, items }, cors)
}

// Webhook de Wompi. Valida firma y actualiza estado.
// Doc: https://docs.wompi.co/docs/colombia/eventos/
async function handleWompiWebhook(request, env, cors) {
  if (!env.WOMPI_EVENTS_SECRET) return serverError(cors)

  const body = await safeJson(request)
  if (!body || typeof body !== 'object') return bad('Body inválido', cors)
  const { event, data, signature, timestamp } = body
  if (event !== 'transaction.updated') {
    // Aceptamos pero ignoramos otros eventos
    return ok({ ok: true, ignored: event }, cors)
  }
  if (!data?.transaction || !signature?.properties || typeof timestamp !== 'number') {
    return bad('Formato webhook inválido', cors)
  }

  // Reconstruir string canónico según las properties declaradas
  const tx = data.transaction
  const concatenated = signature.properties
    .map((p) => {
      // property path con dot notation; casi siempre es "transaction.X"
      return p.split('.').reduce((obj, k) => (obj == null ? undefined : obj[k]), data)
    })
    .join('')
  const expected = await sha256Hex(`${concatenated}${timestamp}${env.WOMPI_EVENTS_SECRET}`)

  if (signature.checksum !== expected) {
    console.warn('Wompi webhook: firma inválida')
    return json({ error: 'Firma inválida' }, 401, cors)
  }

  // Actualiza el pedido (usamos reference como clave)
  const reference = tx.reference
  const status = tx.status // APPROVED, DECLINED, VOIDED, ERROR
  const now = new Date().toISOString()

  // Lee estado previo para detectar transiciones
  const pedidoActual = await env.DB.prepare(
    'SELECT status FROM pedidos WHERE reference = ?'
  ).bind(reference).first()

  if (!pedidoActual) {
    console.warn('Wompi webhook: pedido no encontrado', reference)
    return json({ error: 'Pedido no encontrado' }, 404, cors)
  }

  const wasApproved = pedidoActual.status === 'APPROVED'
  const becomeApproved = status === 'APPROVED' && !wasApproved

  await env.DB.prepare(`
    UPDATE pedidos
    SET status = ?, wompi_transaction_id = ?, wompi_payment_method = ?, actualizado_at = ?
    WHERE reference = ?
  `).bind(status, tx.id, tx.payment_method_type ?? null, now, reference).run()

  // Si transiciona a APPROVED por primera vez, descuenta stock.
  // Idempotente: si el webhook llega dos veces, la segunda vez wasApproved=true y no se re-descuenta.
  if (becomeApproved) {
    const { results: items } = await env.DB.prepare(
      'SELECT producto_id, color, talla, cantidad FROM pedidos_items WHERE pedido_ref = ?'
    ).bind(reference).all()

    for (const item of items) {
      // WHERE stock >= cantidad evita ir a negativo si hubo race condition.
      const res = await env.DB.prepare(`
        UPDATE tallas
        SET stock = stock - ?
        WHERE color_id IN (SELECT id FROM colores WHERE producto_id = ? AND nombre = ?)
          AND talla = ?
          AND stock >= ?
      `).bind(item.cantidad, item.producto_id, item.color, item.talla, item.cantidad).run()

      if (res.meta.changes === 0) {
        console.warn(
          `⚠️ Stock insuficiente tras pago aprobado: ${item.producto_id}/${item.color}/${item.talla} (pedido ${reference}). El admin debe ajustar manualmente.`
        )
      }
    }
  }

  return ok({ ok: true }, cors)
}

// Admin: listar pedidos con filtros
async function handleAdminListPedidos(request, env, cors) {
  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const estadoEnvio = url.searchParams.get('estado_envio')
  let query = `SELECT reference, status, nombre, email, telefono, ciudad,
                      subtotal, envio, total, estado_envio, guia_envio,
                      wompi_payment_method, creado_at, actualizado_at
               FROM pedidos`
  const where = []
  const binds = []
  if (status) { where.push('status = ?'); binds.push(status) }
  if (estadoEnvio) { where.push('estado_envio = ?'); binds.push(estadoEnvio) }
  if (where.length) query += ' WHERE ' + where.join(' AND ')
  query += ' ORDER BY creado_at DESC LIMIT 200'
  const { results } = await env.DB.prepare(query).bind(...binds).all()
  return ok(results, cors)
}

async function handleAdminConsultarPedido(env, cors, reference) {
  return handleConsultarPedido(env, cors, reference)
}

async function handleAdminActualizarEnvio(request, env, cors, reference) {
  const body = await safeJson(request)
  if (!body || typeof body !== 'object') return bad('Body inválido', cors)
  const { estado_envio, guia_envio } = body
  const ESTADOS = new Set(['preparando', 'enviado', 'entregado', 'cancelado'])
  if (!ESTADOS.has(estado_envio)) return bad('estado_envio inválido', cors)
  if (guia_envio != null && (typeof guia_envio !== 'string' || guia_envio.length > 100)) {
    return bad('guia_envio inválido', cors)
  }
  const now = new Date().toISOString()
  const res = await env.DB.prepare(
    `UPDATE pedidos SET estado_envio = ?, guia_envio = ?, actualizado_at = ? WHERE reference = ?`
  ).bind(estado_envio, guia_envio ?? null, now, reference).run()
  if (res.meta.changes === 0) return json({ error: 'No encontrado' }, 404, cors)
  return ok({ ok: true }, cors)
}

// ===== Sitemap =====
async function handleSitemap(env) {
  const today = new Date().toISOString().split('T')[0]
  const [cats, prods] = await Promise.all([
    env.DB.prepare('SELECT id FROM categorias').all(),
    env.DB.prepare('SELECT id FROM productos WHERE deleted_at IS NULL').all(),
  ])

  const urls = [
    { loc: `${SITE_BASE}/`, priority: '1.0' },
    { loc: `${SITE_BASE}/guia-tallas`, priority: '0.5' },
    ...cats.results.map((c) => ({ loc: `${SITE_BASE}/categoria/${c.id}`, priority: '0.8' })),
    ...prods.results.map((p) => ({ loc: `${SITE_BASE}/producto/${p.id}`, priority: '0.7' })),
  ]

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) =>
      `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`
    ).join('\n') +
    '\n</urlset>\n'

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
