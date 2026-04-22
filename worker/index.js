import jwt from '@tsndr/cloudflare-worker-jwt'

// ===== Config =====
const DEFAULT_ALLOWED_ORIGINS = [
  'https://intimaexclusive.com',
  'https://www.intimaexclusive.com',
]
const SITE_BASE = 'https://intimaexclusive.com'
const API_BASE = 'https://api.intimaexclusive.com'
const IMAGES_PUBLIC_BASE = 'https://images.intimaexclusive.com'

// Envío (defaults, sobrescribibles por env vars ENVIO_GRATIS_DESDE y TARIFA_ENVIO)
const DEFAULT_ENVIO_GRATIS_DESDE = 300_000_00 // 300.000 COP en centavos
const DEFAULT_TARIFA_ENVIO = 15_000_00        // 15.000 COP en centavos

function getEnvioConfig(env) {
  const umbral = env.ENVIO_GRATIS_DESDE != null && env.ENVIO_GRATIS_DESDE !== ''
    ? Number(env.ENVIO_GRATIS_DESDE)
    : DEFAULT_ENVIO_GRATIS_DESDE
  const tarifa = env.TARIFA_ENVIO != null && env.TARIFA_ENVIO !== ''
    ? Number(env.TARIFA_ENVIO)
    : DEFAULT_TARIFA_ENVIO
  return { umbral, tarifa }
}

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

      // ========== IndexNow key file ==========
      // Bing/Yandex validan ownership pidiendo /{key}.txt con la key como contenido
      if (method === 'GET' && env.INDEXNOW_KEY && path === `/${env.INDEXNOW_KEY}.txt`) {
        return new Response(env.INDEXNOW_KEY, {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
        })
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

      // Config pública (incluye tarifas de envío)
      if (method === 'GET' && path === '/api/config') {
        const { umbral, tarifa } = getEnvioConfig(env)
        return ok({
          envio: {
            // Montos expuestos en COP (no centavos) para uso directo en UI
            gratis_desde: Math.round(umbral / 100),
            tarifa: Math.round(tarifa / 100),
          },
          wompi: {
            monto_minimo: 1500,
          },
        }, cors)
      }

      // Validar cupón (público)
      if (method === 'POST' && path === '/api/cupones/validar') {
        return await handleValidarCupon(request, env, cors)
      }

      // Newsletter
      if (method === 'POST' && path === '/api/newsletter/suscribir') {
        return await handleSuscribirNewsletter(request, env, cors)
      }
      if ((method === 'GET' || method === 'POST') && path === '/unsubscribe') {
        return await handleUnsubscribeNewsletter(request, env)
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
        return await handleWompiWebhook(request, env, cors, ctx)
      }

      // Productos relacionados (misma categoria, excluye el propio)
      const relMatch = path.match(/^\/api\/productos\/([^/]+)\/relacionados$/)
      if (method === 'GET' && relMatch) {
        return await handleRelacionados(env, cors, decodeURIComponent(relMatch[1]))
      }

      // Reseñas recientes globales (para home social proof)
      if (method === 'GET' && path === '/api/reviews/recientes') {
        return await handleReviewsRecientes(env, cors)
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
          if (res.status === 200) {
            triggerPagesDeploy(env, ctx)
            const body = await res.clone().json().catch(() => null)
            const id = body?.id
            if (id) {
              indexNowNotify(env, ctx, [SITE_BASE + '/', ...urlsProducto(id)])
            }
          }
          return res
        }
        const editMatch = path.match(/^\/api\/admin\/productos\/([^/]+)$/)
        if (editMatch && method === 'PUT') {
          const id = decodeURIComponent(editMatch[1])
          const res = await handleAdminEditarProducto(request, env, cors, id)
          if (res.status === 200) {
            triggerPagesDeploy(env, ctx)
            indexNowNotify(env, ctx, urlsProducto(id))
          }
          return res
        }
        if (editMatch && method === 'DELETE') {
          const id = decodeURIComponent(editMatch[1])
          const res = await handleAdminEliminarProducto(env, cors, id)
          if (res.status === 200) {
            triggerPagesDeploy(env, ctx)
            // Al soft-delete, la URL del producto devuelve 404 — avisamos para
            // que los bots actualicen el índice rápido
            indexNowNotify(env, ctx, urlsProducto(id))
          }
          return res
        }

        // Newsletter admin
        if (method === 'GET' && path === '/api/admin/suscriptores') {
          return await handleAdminListSuscriptores(env, cors)
        }

        // Cupones (admin CRUD)
        if (method === 'GET' && path === '/api/admin/cupones') {
          return await handleAdminListCupones(env, cors)
        }
        if (method === 'POST' && path === '/api/admin/cupones') {
          return await handleAdminCrearCupon(request, env, cors)
        }
        const cuponMatch = path.match(/^\/api\/admin\/cupones\/([^/]+)$/)
        if (cuponMatch && method === 'PUT') {
          return await handleAdminActualizarCupon(request, env, cors, decodeURIComponent(cuponMatch[1]))
        }
        if (cuponMatch && method === 'DELETE') {
          return await handleAdminEliminarCupon(env, cors, decodeURIComponent(cuponMatch[1]))
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
          const id = decodeURIComponent(restaurarMatch[1])
          const res = await handleAdminRestaurarProducto(env, cors, id)
          if (res.status === 200) {
            triggerPagesDeploy(env, ctx)
            indexNowNotify(env, ctx, urlsProducto(id))
          }
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

// ===== IndexNow: notifica a Bing/Yandex/Naver de cambios de URLs =====
// Docs: https://www.indexnow.org/documentation
// Requiere env.INDEXNOW_KEY (32 chars alfanum). El Worker sirve la key
// en https://api.intimaexclusive.com/{KEY}.txt para verificar ownership.
// Bing acepta ownership verification en cualquier subdominio del site principal.
function indexNowNotify(env, ctx, urls) {
  if (!env.INDEXNOW_KEY || !urls || urls.length === 0) return
  const payload = {
    host: 'intimaexclusive.com',
    key: env.INDEXNOW_KEY,
    keyLocation: `${API_BASE}/${env.INDEXNOW_KEY}.txt`,
    urlList: urls,
  }
  const p = fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then((r) => console.log('IndexNow:', r.status, urls.length, 'urls'))
    .catch((err) => console.error('IndexNow error:', err))
  if (ctx?.waitUntil) ctx.waitUntil(p)
}

function urlsProducto(productoId) {
  return [
    `${SITE_BASE}/producto/${productoId}`,
  ]
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
async function handleReviewsRecientes(env, cors) {
  const [recientes, stats] = await Promise.all([
    env.DB.prepare(`
      SELECT r.nombre, r.rating, r.comentario, r.fecha, r.producto_id,
             p.nombre AS producto_nombre
      FROM reviews r
      LEFT JOIN productos p ON p.id = r.producto_id AND p.deleted_at IS NULL
      WHERE r.aprobada = 1
      ORDER BY r.fecha DESC
      LIMIT 6
    `).all(),
    env.DB.prepare(
      'SELECT COUNT(*) AS total, AVG(rating) AS promedio FROM reviews WHERE aprobada = 1'
    ).first(),
  ])
  return ok({
    total: stats?.total ?? 0,
    promedio: stats?.promedio ? Math.round(stats.promedio * 10) / 10 : null,
    recientes: recientes.results,
  }, cors)
}

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

// ===== Email via Resend =====
async function enviarEmail(env, { to, subject, html, text, from, replyTo, headers }) {
  if (!env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY no configurado — email no enviado')
    return { sent: false, reason: 'no-api-key' }
  }
  const senderDefault = env.RESEND_FROM || 'Íntima Exclusive <onboarding@resend.dev>'
  try {
    const payload = {
      from: from || senderDefault,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }
    if (text) payload.text = text
    if (replyTo) payload.reply_to = replyTo
    if (headers && Object.keys(headers).length) payload.headers = headers

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error('Resend error:', res.status, errText)
      return { sent: false, reason: errText }
    }
    const data = await res.json()
    return { sent: true, id: data.id }
  } catch (err) {
    console.error('Resend network error:', err)
    return { sent: false, reason: String(err) }
  }
}

// ===== Newsletter =====
const SUBSCRIBER_CODE_RE = /^[A-Z0-9]{6,12}$/

function generarCuponBienvenida() {
  // 8 chars, letras + números. Ej: BVD-A7K9X2P4
  const alfa = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let rand = ''
  for (let i = 0; i < 8; i++) rand += alfa[Math.floor(Math.random() * alfa.length)]
  return `BVD${rand}`
}

function welcomeEmailText({ codigo, porcentaje, unsubscribeUrl }) {
  return `¡Bienvenida a Íntima Exclusive!

Estamos emocionadas de tenerte aquí.

Tu código de bienvenida: ${codigo}
${porcentaje}% de descuento en tu primera compra

Válido por 30 días. Úsalo al momento del checkout en intimaexclusive.com

¿Preguntas? WhatsApp +57 302 855 6022

---
Recibiste este correo porque te suscribiste en intimaexclusive.com
Cancelar suscripción: ${unsubscribeUrl}
`
}

function welcomeEmailHtml({ nombre, codigo, porcentaje, unsubscribeUrl }) {
  const firstName = nombre?.split(' ')[0] || ''
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>¡Bienvenida a Íntima Exclusive!</title>
</head>
<body style="margin:0;padding:0;font-family:Georgia,serif;background:#F5EDE0;color:#3A1A20;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F5EDE0;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#FAF5EE;padding:40px 24px;">
    <tr><td align="center" style="padding-bottom:32px;border-bottom:1px solid #D9C4A8;">
      <a href="https://intimaexclusive.com" style="text-decoration:none;">
        <p style="font-family:Georgia,serif;font-size:24px;color:#7B1A2E;margin:0 0 4px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;">Íntima</p>
        <p style="font-family:Georgia,serif;font-size:16px;color:#C4A882;margin:0;font-style:italic;letter-spacing:1px;">Exclusive</p>
      </a>
    </td></tr>
    <tr><td style="height:24px;">&nbsp;</td></tr>
    <tr><td align="center">
      <h1 style="font-family:Georgia,serif;font-size:30px;color:#7B1A2E;font-weight:normal;margin:0 0 16px;">Gracias por unirte${firstName ? ', ' + firstName : ''}</h1>
      <p style="font-family:Georgia,serif;font-size:15px;color:#7A5A60;line-height:1.6;margin:0 0 28px;">
        Aquí va tu código personal, como te prometimos.<br>
        Úsalo cuando quieras estrenar algo bonito.
      </p>
    </td></tr>
    <tr><td>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FFFDF9;border:2px solid #D9C4A8;margin:12px 0 28px;">
        <tr><td align="center" style="padding:28px 16px;">
          <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7A5A60;margin:0 0 12px;">Tu código personal</p>
          <p style="font-family:'Courier New',Consolas,monospace;font-size:30px;color:#7B1A2E;font-weight:bold;letter-spacing:4px;margin:8px 0;">${codigo}</p>
          <p style="font-family:Georgia,serif;font-size:15px;color:#7A5A60;margin:12px 0 0;">
            <strong>${porcentaje}% de descuento</strong> en tu primera compra
          </p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:12px 0 24px;">
      <a href="https://intimaexclusive.com" style="display:inline-block;background:#7B1A2E;color:#F5EDE0;text-decoration:none;padding:16px 44px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Ver la colección</a>
    </td></tr>
    <tr><td align="center">
      <p style="font-family:Georgia,serif;font-size:13px;color:#7A5A60;line-height:1.5;margin:0 0 20px;">
        El código es único para ti y válido por <strong>30 días</strong>.<br>
        Úsalo al momento del checkout.
      </p>
      <p style="font-family:Georgia,serif;font-size:13px;color:#7A5A60;line-height:1.5;margin:0 0 12px;">
        <strong>Tip:</strong> Agrega <a href="mailto:info@intimaexclusive.com" style="color:#7B1A2E;">info@intimaexclusive.com</a> a tus contactos para que nuestros correos lleguen siempre a tu bandeja principal.
      </p>
    </td></tr>
    <tr><td>
      <hr style="border:none;border-top:1px solid #D9C4A8;margin:28px 0;">
    </td></tr>
    <tr><td align="center">
      <p style="font-family:Georgia,serif;font-size:13px;color:#7A5A60;line-height:1.5;margin:0;">
        ¿Preguntas? Escríbenos por WhatsApp<br>
        <a href="https://wa.me/573028556022" style="color:#7B1A2E;text-decoration:none;font-weight:bold;">+57 302 855 6022</a>
      </p>
      <p style="font-family:Arial,sans-serif;font-size:10px;color:#B09090;margin-top:24px;line-height:1.5;">
        Recibiste este correo porque te suscribiste en intimaexclusive.com<br>
        <a href="${unsubscribeUrl}" style="color:#B09090;">Cancelar suscripción</a>
      </p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`
}

async function handleSuscribirNewsletter(request, env, cors) {
  const ip = getClientIp(request)
  const max = Number(env.NEWSLETTER_RATE_LIMIT_MAX) || 20
  const rl = await rateLimit(env, `newsletter:${ip}`, { windowSec: 3600, max })
  if (!rl.ok) {
    const mins = Math.ceil(rl.retryAfter / 60)
    return json({
      error: `Demasiados intentos desde tu conexión. Intenta de nuevo en ${mins} ${mins === 1 ? 'minuto' : 'minutos'}.`,
    }, 429, cors)
  }

  const body = await safeJson(request)
  if (!body || typeof body !== 'object') return bad('Body inválido', cors)
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim().slice(0, 80) : null
  const fuente = typeof body.fuente === 'string' ? body.fuente.slice(0, 40) : 'home-newsletter'

  if (!EMAIL_RE.test(email) || email.length > 120) return bad('Correo inválido.', cors)

  // ¿Ya está suscrito y activo?
  const existente = await env.DB.prepare(
    'SELECT email, cupon_codigo, activo FROM suscriptores WHERE email = ?'
  ).bind(email).first()

  if (existente?.activo) {
    return ok({
      ok: true,
      ya_suscrita: true,
      mensaje: 'Ya estás en nuestra lista. ¡Revisa tu correo!',
    }, cors)
  }

  // Generar cupón único de bienvenida
  const porcentaje = Number(env.NEWSLETTER_WELCOME_PERCENT) || 10
  const expiraDias = Number(env.NEWSLETTER_WELCOME_EXPIRA_DIAS) || 30
  const expiraAt = new Date(Date.now() + expiraDias * 24 * 3600 * 1000).toISOString()
  let cuponCodigo = generarCuponBienvenida()

  // Por si colisiona (muy raro), intentar hasta 5 veces
  for (let i = 0; i < 5; i++) {
    const colision = await env.DB.prepare('SELECT codigo FROM cupones WHERE codigo = ?').bind(cuponCodigo).first()
    if (!colision) break
    cuponCodigo = generarCuponBienvenida()
  }

  const unsubscribeToken = crypto.randomUUID().replace(/-/g, '')
  const now = new Date().toISOString()

  const stmts = [
    env.DB.prepare(`
      INSERT INTO cupones (codigo, descripcion, tipo, valor, max_usos, expira_at, solo_primera_compra, email_requerido, activo, creado_at)
      VALUES (?, ?, 'porcentaje', ?, 1, ?, 1, ?, 1, ?)
    `).bind(cuponCodigo, `Bienvenida ${porcentaje}% — ${email}`, porcentaje, expiraAt, email, now),
  ]

  if (existente) {
    // Reactivar suscriptor que se había dado de baja
    stmts.push(
      env.DB.prepare(`
        UPDATE suscriptores
        SET activo = 1, suscrito_at = ?, cupon_codigo = ?, unsubscribe_token = ?, fuente = ?
        WHERE email = ?
      `).bind(now, cuponCodigo, unsubscribeToken, fuente, email)
    )
  } else {
    stmts.push(
      env.DB.prepare(`
        INSERT INTO suscriptores (email, suscrito_at, cupon_codigo, fuente, activo, unsubscribe_token)
        VALUES (?, ?, ?, ?, 1, ?)
      `).bind(email, now, cuponCodigo, fuente, unsubscribeToken)
    )
  }

  await env.DB.batch(stmts)

  // Disparar email (no bloquea si falla)
  const unsubscribeUrl = `${API_BASE}/unsubscribe?token=${unsubscribeToken}`
  const html = welcomeEmailHtml({ nombre, codigo: cuponCodigo, porcentaje, unsubscribeUrl })
  const text = welcomeEmailText({ codigo: cuponCodigo, porcentaje, unsubscribeUrl })
  const emailRes = await enviarEmail(env, {
    to: email,
    subject: `¡Bienvenida a Íntima Exclusive! Tu ${porcentaje}% está adentro`,
    html,
    text,
    replyTo: env.RESEND_REPLY_TO || 'info@intimaexclusive.com',
    // Headers RFC 8058 — habilita el botón nativo de "Cancelar suscripción" de Gmail/Outlook
    // y mejora significativamente la reputación del dominio remitente.
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:info@intimaexclusive.com?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      // Clasifica el mensaje como transaccional/marketing para los filtros
      'X-Entity-Ref-ID': cuponCodigo,
    },
  })

  return ok({
    ok: true,
    ya_suscrita: false,
    email_enviado: emailRes.sent,
    mensaje: emailRes.sent
      ? 'Te enviamos tu código de bienvenida por correo. ¡Revisa tu bandeja!'
      : 'Suscripción confirmada. Si no recibes el correo, escríbenos por WhatsApp y te ayudamos.',
  }, cors)
}

async function handleUnsubscribeNewsletter(request, env) {
  const url = new URL(request.url)
  // GET: token en query; POST (Gmail one-click): token en query tambien
  let token = url.searchParams.get('token') || ''

  // Si es POST con form-encoded (RFC 8058), también aceptamos el token del body
  if (request.method === 'POST' && !token) {
    try {
      const ct = request.headers.get('Content-Type') || ''
      if (ct.includes('application/x-www-form-urlencoded')) {
        const form = new URLSearchParams(await request.text())
        token = form.get('token') || ''
      }
    } catch { /* noop */ }
  }

  if (!/^[a-f0-9]{32}$/.test(token)) {
    // POST: responde JSON plano (Gmail no espera HTML)
    if (request.method === 'POST') {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(unsubscribeHtml({ ok: false, mensaje: 'Enlace inválido.' }), {
      status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const res = await env.DB.prepare(
    `UPDATE suscriptores SET activo = 0 WHERE unsubscribe_token = ? AND activo = 1`
  ).bind(token).run()
  const success = res.meta.changes > 0

  if (request.method === 'POST') {
    return new Response(JSON.stringify({ ok: success }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(unsubscribeHtml({
    ok: success,
    mensaje: success ? '¡Listo! Ya no recibirás más correos nuestros.' : 'No encontramos una suscripción activa con ese enlace.',
  }), {
    status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function unsubscribeHtml({ ok, mensaje }) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Cancelar suscripción</title></head>
<body style="margin:0;font-family:Georgia,serif;background:#F5EDE0;color:#3A1A20;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
<div style="max-width:480px;text-align:center;padding:40px 24px;background:#FAF5EE;border:1px solid #D9C4A8;">
<p style="font-size:40px;margin:0 0 16px;">${ok ? '👋' : '⚠️'}</p>
<h1 style="font-size:24px;color:#7B1A2E;margin:0 0 12px;font-weight:normal;">${ok ? 'Hasta pronto' : 'Algo no cuadra'}</h1>
<p style="font-size:15px;color:#7A5A60;line-height:1.6;">${mensaje}</p>
<p style="margin-top:24px;"><a href="https://intimaexclusive.com" style="color:#7B1A2E;text-decoration:none;font-weight:bold;">Volver al inicio</a></p>
</div></body></html>`
}

// ===== Email de confirmación de pedido =====
function formatCopCents(c) {
  return '$' + Math.round((c || 0) / 100).toLocaleString('es-CO') + ' COP'
}

function orderConfirmationText({ pedido, items }) {
  const lineas = items.map((i, idx) =>
    `${idx + 1}. ${i.nombre} — ${i.color}, talla ${i.talla} x${i.cantidad} — ${formatCopCents(i.precio_unitario * i.cantidad)}`
  ).join('\n')

  return `Recibimos tu pedido, ${pedido.nombre.split(' ')[0]}

Referencia: ${pedido.reference}

${lineas}

Subtotal: ${formatCopCents(pedido.subtotal)}${pedido.cupon_descuento > 0 ? `
Descuento (${pedido.cupon_codigo}): -${formatCopCents(pedido.cupon_descuento)}` : ''}
Envío: ${pedido.envio === 0 ? 'GRATIS' : formatCopCents(pedido.envio)}
Total: ${formatCopCents(pedido.total)}

Envío a:
${pedido.direccion}, ${pedido.ciudad}${pedido.departamento ? ', ' + pedido.departamento : ''}
${pedido.telefono}

Empezamos a preparar tu pedido. Recibirás otro correo cuando lo enviemos.
Tiempo estimado: 1-2 días hábiles de preparación + 2-5 días de entrega.

Consulta el estado en: https://intimaexclusive.com/pedido/${pedido.reference}

¿Preguntas? WhatsApp +57 302 855 6022
`
}

function orderConfirmationHtml({ pedido, items }) {
  const firstName = pedido.nombre?.split(' ')[0] || ''
  const itemsHtml = items.map((i) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #D9C4A8;">
        <p style="font-family:Georgia,serif;color:#3A1A20;font-size:14px;margin:0 0 2px;">${i.nombre}</p>
        <p style="font-family:Arial,sans-serif;color:#7A5A60;font-size:12px;margin:0;">${i.color} · Talla ${i.talla} · x${i.cantidad}</p>
      </td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid #D9C4A8;font-family:Arial,sans-serif;color:#7B1A2E;font-weight:bold;font-size:14px;white-space:nowrap;">
        ${formatCopCents(i.precio_unitario * i.cantidad)}
      </td>
    </tr>`).join('')

  const estadoUrl = `https://intimaexclusive.com/pedido/${pedido.reference}`

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Recibimos tu pedido — Íntima Exclusive</title>
</head>
<body style="margin:0;padding:0;font-family:Georgia,serif;background:#F5EDE0;color:#3A1A20;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F5EDE0;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#FAF5EE;padding:40px 24px;">
    <tr><td align="center" style="padding-bottom:32px;border-bottom:1px solid #D9C4A8;">
      <a href="https://intimaexclusive.com" style="text-decoration:none;">
        <p style="font-family:Georgia,serif;font-size:24px;color:#7B1A2E;margin:0 0 4px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;">Íntima</p>
        <p style="font-family:Georgia,serif;font-size:16px;color:#C4A882;margin:0;font-style:italic;letter-spacing:1px;">Exclusive</p>
      </a>
    </td></tr>
    <tr><td style="height:24px;">&nbsp;</td></tr>
    <tr><td align="center">
      <h1 style="font-family:Georgia,serif;font-size:26px;color:#7B1A2E;font-weight:normal;margin:0 0 8px;">Recibimos tu pedido${firstName ? ', ' + firstName : ''}</h1>
      <p style="font-family:Georgia,serif;font-size:14px;color:#7A5A60;margin:0 0 4px;">Gracias por tu compra. Empezamos a prepararla con cuidado.</p>
      <p style="font-family:'Courier New',monospace;font-size:12px;color:#C4A882;margin:16px 0 0;">Ref: ${pedido.reference}</p>
    </td></tr>
    <tr><td style="height:24px;">&nbsp;</td></tr>
    <tr><td>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FFFDF9;border:1px solid #D9C4A8;padding:20px;">
        <tr><td>
          <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7A5A60;margin:0 0 12px;">Tu pedido</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${itemsHtml}
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:16px;">
            <tr><td style="font-family:Arial,sans-serif;color:#7A5A60;font-size:13px;padding:4px 0;">Subtotal</td><td align="right" style="font-family:Arial,sans-serif;color:#3A1A20;font-size:13px;padding:4px 0;">${formatCopCents(pedido.subtotal)}</td></tr>
            ${pedido.cupon_descuento > 0 ? `
            <tr><td style="font-family:Arial,sans-serif;color:#7A5A60;font-size:13px;padding:4px 0;">Descuento (${pedido.cupon_codigo})</td><td align="right" style="font-family:Arial,sans-serif;color:#059669;font-weight:bold;font-size:13px;padding:4px 0;">-${formatCopCents(pedido.cupon_descuento)}</td></tr>` : ''}
            <tr><td style="font-family:Arial,sans-serif;color:#7A5A60;font-size:13px;padding:4px 0;">Envío</td><td align="right" style="font-family:Arial,sans-serif;color:${pedido.envio === 0 ? '#059669' : '#3A1A20'};font-weight:${pedido.envio === 0 ? 'bold' : 'normal'};font-size:13px;padding:4px 0;">${pedido.envio === 0 ? 'GRATIS' : formatCopCents(pedido.envio)}</td></tr>
            <tr><td style="font-family:Georgia,serif;color:#3A1A20;font-size:16px;padding:12px 0 4px;border-top:1px solid #D9C4A8;">Total</td><td align="right" style="font-family:Georgia,serif;color:#7B1A2E;font-size:18px;font-weight:bold;padding:12px 0 4px;border-top:1px solid #D9C4A8;">${formatCopCents(pedido.total)}</td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="height:20px;">&nbsp;</td></tr>
    <tr><td>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:0 4px;">
        <tr><td>
          <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7A5A60;margin:0 0 8px;">Dirección de envío</p>
          <p style="font-family:Georgia,serif;font-size:14px;color:#3A1A20;margin:0 0 4px;line-height:1.5;">
            ${pedido.nombre}<br>
            ${pedido.direccion}<br>
            ${pedido.ciudad}${pedido.departamento ? ', ' + pedido.departamento : ''}<br>
            ${pedido.telefono}
          </p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="height:24px;">&nbsp;</td></tr>
    <tr><td align="center" style="padding:20px;background:#F5EDE0;border-left:3px solid #7B1A2E;">
      <p style="font-family:Georgia,serif;color:#3A1A20;font-size:14px;margin:0 0 4px;line-height:1.6;">
        <strong>Empezamos a preparar tu pedido.</strong><br>
        Recibirás otro correo cuando salga de camino.
      </p>
      <p style="font-family:Arial,sans-serif;color:#7A5A60;font-size:12px;margin:8px 0 0;">
        Preparación: 1-2 días hábiles · Entrega: 2-5 días hábiles<br>
        Empaque completamente discreto, como siempre.
      </p>
    </td></tr>
    <tr><td align="center" style="padding:28px 0 16px;">
      <a href="${estadoUrl}" style="display:inline-block;background:#7B1A2E;color:#F5EDE0;text-decoration:none;padding:14px 32px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Ver estado del pedido</a>
    </td></tr>
    <tr><td>
      <hr style="border:none;border-top:1px solid #D9C4A8;margin:24px 0;">
    </td></tr>
    <tr><td align="center">
      <p style="font-family:Georgia,serif;font-size:13px;color:#7A5A60;line-height:1.5;margin:0;">
        ¿Alguna pregunta sobre tu pedido?<br>
        <a href="https://wa.me/573028556022?text=${encodeURIComponent(`Hola! Tengo una pregunta sobre mi pedido ${pedido.reference}`)}" style="color:#7B1A2E;text-decoration:none;font-weight:bold;">Escríbenos por WhatsApp</a>
      </p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`
}

// Admin newsletter
async function handleAdminListSuscriptores(env, cors) {
  const { results } = await env.DB.prepare(
    `SELECT email, suscrito_at, cupon_codigo, fuente, activo FROM suscriptores ORDER BY suscrito_at DESC LIMIT 2000`
  ).all()
  const total = await env.DB.prepare(
    `SELECT COUNT(*) AS total, SUM(activo) AS activos FROM suscriptores`
  ).first()
  return ok({
    suscriptores: results,
    total: total?.total ?? 0,
    activos: total?.activos ?? 0,
  }, cors)
}

// ===== Cupones de descuento =====
const CUPON_CODE_RE = /^[A-Z0-9][A-Z0-9_-]{1,31}$/

function normalizeCodigo(c) {
  return typeof c === 'string' ? c.trim().toUpperCase() : ''
}

async function validarCupon(env, codigo, subtotalCentavos, email) {
  const code = normalizeCodigo(codigo)
  if (!code) return { valido: false, motivo: 'Ingresa un código.' }
  if (!CUPON_CODE_RE.test(code)) return { valido: false, motivo: 'Código inválido.' }

  const cupon = await env.DB.prepare('SELECT * FROM cupones WHERE codigo = ?').bind(code).first()
  if (!cupon) return { valido: false, motivo: 'Código no existe.' }
  if (!cupon.activo) return { valido: false, motivo: 'Cupón no disponible.' }

  if (cupon.expira_at && new Date(cupon.expira_at).getTime() < Date.now()) {
    return { valido: false, motivo: 'Cupón expirado.' }
  }
  if (cupon.max_usos != null && cupon.usos_actuales >= cupon.max_usos) {
    return { valido: false, motivo: 'Cupón agotado.' }
  }
  if (cupon.minimo_compra > 0 && subtotalCentavos < cupon.minimo_compra) {
    return {
      valido: false,
      motivo: `Compra mínima requerida: $${Math.round(cupon.minimo_compra / 100).toLocaleString('es-CO')} COP.`,
    }
  }
  if (cupon.email_requerido) {
    if (typeof email !== 'string' || !email.trim()) {
      return { valido: false, motivo: 'Ingresa tu correo antes de aplicar este cupón.' }
    }
    if (email.trim().toLowerCase() !== cupon.email_requerido.toLowerCase()) {
      return { valido: false, motivo: `Este cupón es personal — solo funciona con ${cupon.email_requerido}.` }
    }
  }
  if (cupon.solo_primera_compra) {
    if (!email) return { valido: false, motivo: 'Ingresa tu correo para validar el cupón.' }
    const previo = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM pedidos WHERE lower(email) = lower(?) AND status = 'APPROVED'`
    ).bind(email.trim()).first()
    if ((previo?.n ?? 0) > 0) {
      return { valido: false, motivo: 'Cupón solo para primera compra.' }
    }
  }

  // Calcular descuento
  let descuento = 0
  if (cupon.tipo === 'porcentaje') {
    descuento = Math.round((subtotalCentavos * cupon.valor) / 100)
  } else {
    descuento = cupon.valor
  }
  // Nunca mayor que el subtotal
  descuento = Math.min(descuento, subtotalCentavos)

  return {
    valido: true,
    codigo: cupon.codigo,
    tipo: cupon.tipo,
    valor: cupon.valor,
    descuento,
  }
}

async function handleValidarCupon(request, env, cors) {
  const ip = getClientIp(request)
  const rl = await rateLimit(env, `cupon-val:${ip}`, { windowSec: 60, max: 20 })
  if (!rl.ok) return tooMany(cors, rl.retryAfter)

  const body = await safeJson(request)
  if (!body || typeof body !== 'object') return bad('Body inválido', cors)
  const { codigo, subtotal, email } = body
  if (!Number.isInteger(subtotal) || subtotal < 0) return bad('subtotal inválido', cors)

  const res = await validarCupon(env, codigo, subtotal, email)
  return ok(res, cors)
}

// Admin cupones — CRUD
async function handleAdminListCupones(env, cors) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM cupones ORDER BY activo DESC, creado_at DESC LIMIT 500`
  ).all()
  return ok(results, cors)
}

function validarInputCupon(body) {
  if (!body || typeof body !== 'object') return 'Body inválido'
  const { codigo, tipo, valor } = body
  const code = normalizeCodigo(codigo)
  if (!CUPON_CODE_RE.test(code)) return 'Código inválido (A-Z, 0-9, _, -, 2-32 chars)'
  if (tipo !== 'porcentaje' && tipo !== 'fijo') return 'Tipo debe ser "porcentaje" o "fijo"'
  if (!Number.isInteger(valor) || valor <= 0) return 'Valor inválido'
  if (tipo === 'porcentaje' && (valor < 1 || valor > 100)) return 'Porcentaje debe estar entre 1 y 100'
  if (tipo === 'fijo' && valor > 100_000_000_00) return 'Valor fijo excede máximo'
  if (body.minimo_compra != null && (!Number.isInteger(body.minimo_compra) || body.minimo_compra < 0)) return 'minimo_compra inválido'
  if (body.max_usos != null && (!Number.isInteger(body.max_usos) || body.max_usos <= 0)) return 'max_usos inválido'
  if (body.email_requerido != null && typeof body.email_requerido !== 'string') return 'email_requerido inválido'
  if (body.expira_at != null && isNaN(new Date(body.expira_at).getTime())) return 'expira_at inválido'
  return null
}

async function handleAdminCrearCupon(request, env, cors) {
  const body = await safeJson(request)
  const err = validarInputCupon(body)
  if (err) return bad(err, cors)

  const code = normalizeCodigo(body.codigo)
  const existe = await env.DB.prepare('SELECT codigo FROM cupones WHERE codigo = ?').bind(code).first()
  if (existe) return json({ error: 'Ya existe un cupón con ese código' }, 409, cors)

  await env.DB.prepare(`
    INSERT INTO cupones (
      codigo, descripcion, tipo, valor, minimo_compra, max_usos, expira_at,
      solo_primera_compra, email_requerido, activo, creado_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    code,
    body.descripcion?.trim() || null,
    body.tipo,
    body.valor,
    body.minimo_compra ?? 0,
    body.max_usos ?? null,
    body.expira_at ?? null,
    body.solo_primera_compra ? 1 : 0,
    body.email_requerido?.trim().toLowerCase() || null,
    body.activo === false ? 0 : 1,
    new Date().toISOString()
  ).run()

  return ok({ ok: true, codigo: code }, cors)
}

async function handleAdminActualizarCupon(request, env, cors, codigo) {
  const code = normalizeCodigo(codigo)
  if (!CUPON_CODE_RE.test(code)) return bad('Código inválido', cors)

  const body = await safeJson(request)
  if (!body || typeof body !== 'object') return bad('Body inválido', cors)

  // Solo permitimos actualizar campos seguros (no cambiar código ni usos_actuales directo)
  const sets = []
  const binds = []
  if (body.descripcion != null) { sets.push('descripcion = ?'); binds.push(body.descripcion.trim() || null) }
  if (body.activo != null) { sets.push('activo = ?'); binds.push(body.activo ? 1 : 0) }
  if (body.expira_at != null) {
    if (body.expira_at !== '' && isNaN(new Date(body.expira_at).getTime())) return bad('expira_at inválido', cors)
    sets.push('expira_at = ?'); binds.push(body.expira_at || null)
  }
  if (body.max_usos != null) {
    if (body.max_usos !== '' && (!Number.isInteger(body.max_usos) || body.max_usos <= 0)) return bad('max_usos inválido', cors)
    sets.push('max_usos = ?'); binds.push(body.max_usos || null)
  }
  if (body.minimo_compra != null) {
    if (!Number.isInteger(body.minimo_compra) || body.minimo_compra < 0) return bad('minimo_compra inválido', cors)
    sets.push('minimo_compra = ?'); binds.push(body.minimo_compra)
  }
  if (sets.length === 0) return bad('Nada que actualizar', cors)
  binds.push(code)

  const res = await env.DB.prepare(`UPDATE cupones SET ${sets.join(', ')} WHERE codigo = ?`).bind(...binds).run()
  if (res.meta.changes === 0) return json({ error: 'Cupón no encontrado' }, 404, cors)
  return ok({ ok: true }, cors)
}

async function handleAdminEliminarCupon(env, cors, codigo) {
  const code = normalizeCodigo(codigo)
  if (!CUPON_CODE_RE.test(code)) return bad('Código inválido', cors)
  const res = await env.DB.prepare('DELETE FROM cupones WHERE codigo = ?').bind(code).run()
  if (res.meta.changes === 0) return json({ error: 'Cupón no encontrado' }, 404, cors)
  return ok({ ok: true }, cors)
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

  // Validar cupón (si se envió)
  let cuponAplicado = null
  if (body.cupon_codigo) {
    const val = await validarCupon(env, body.cupon_codigo, subtotalCentavos, body.cliente.email)
    if (!val.valido) {
      return json({ error: val.motivo }, 422, cors)
    }
    cuponAplicado = val
  }
  const descuentoCentavos = cuponAplicado?.descuento ?? 0
  const subtotalConDescuento = subtotalCentavos - descuentoCentavos

  const { umbral, tarifa } = getEnvioConfig(env)
  const envioCentavos = subtotalConDescuento >= umbral ? 0 : tarifa
  const totalCentavos = subtotalConDescuento + envioCentavos

  if (totalCentavos < 1_500_00) return bad('Monto mínimo $1.500 COP', cors) // Wompi mínimo
  if (totalCentavos > 50_000_000_00) return bad('Monto máximo excedido', cors)

  const reference = generarReference()
  const now = new Date().toISOString()
  const cli = body.cliente

  const stmts = [
    env.DB.prepare(`
      INSERT INTO pedidos (
        reference, status, nombre, email, telefono, documento_tipo, documento_numero,
        direccion, ciudad, departamento, codigo_postal, notas,
        subtotal, envio, total, cupon_codigo, cupon_descuento, creado_at, actualizado_at
      ) VALUES (?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      reference,
      cli.nombre.trim(), cli.email.trim().toLowerCase(), cli.telefono.trim(),
      cli.documento_tipo ?? null, cli.documento_numero ?? null,
      cli.direccion.trim(), cli.ciudad.trim(),
      cli.departamento ?? null, cli.codigo_postal ?? null, cli.notas ?? null,
      subtotalCentavos, envioCentavos, totalCentavos,
      cuponAplicado?.codigo ?? null, descuentoCentavos,
      now, now
    ),
    ...itemsNormalizados.map((it) =>
      env.DB.prepare(`
        INSERT INTO pedidos_items (pedido_ref, producto_id, nombre, color, talla, precio_unitario, cantidad)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(reference, it.productoId, it.nombre, it.color, it.talla, it.precioUnitario, it.cantidad)
    ),
  ]
  // Si hay cupón, incrementar usos_actuales con guard de max_usos (atómico)
  if (cuponAplicado) {
    stmts.push(
      env.DB.prepare(`
        UPDATE cupones
        SET usos_actuales = usos_actuales + 1
        WHERE codigo = ? AND (max_usos IS NULL OR usos_actuales < max_usos)
      `).bind(cuponAplicado.codigo)
    )
  }
  await env.DB.batch(stmts)

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
async function handleWompiWebhook(request, env, cors, ctx) {
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

  // Si transiciona a APPROVED por primera vez, descuenta stock + envía email.
  // Idempotente: si el webhook llega dos veces, la segunda vez wasApproved=true y no se re-ejecuta.
  if (becomeApproved) {
    const { results: items } = await env.DB.prepare(
      'SELECT producto_id, color, talla, cantidad, nombre, precio_unitario FROM pedidos_items WHERE pedido_ref = ?'
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

    // Enviar email de confirmación al cliente (fire-and-forget via waitUntil)
    const pedidoCompleto = await env.DB.prepare('SELECT * FROM pedidos WHERE reference = ?')
      .bind(reference).first()
    if (pedidoCompleto?.email) {
      const sendPromise = enviarEmail(env, {
        to: pedidoCompleto.email,
        subject: `Recibimos tu pedido ${reference} — Íntima Exclusive`,
        html: orderConfirmationHtml({ pedido: pedidoCompleto, items }),
        text: orderConfirmationText({ pedido: pedidoCompleto, items }),
        replyTo: env.RESEND_REPLY_TO || 'info@intimaexclusive.com',
        headers: { 'X-Entity-Ref-ID': reference },
      }).catch((err) => console.error('Order confirmation email error:', err))
      if (ctx?.waitUntil) ctx.waitUntil(sendPromise)
    }
  }

  return ok({ ok: true }, cors)
}

// Admin: listar pedidos con filtros
async function handleAdminListPedidos(request, env, cors) {
  const url = new URL(request.url)
  const vista = url.searchParams.get('vista') || 'activos'
  const status = url.searchParams.get('status')
  const estadoEnvio = url.searchParams.get('estado_envio')

  let query = `SELECT reference, status, nombre, email, telefono, ciudad,
                      subtotal, envio, total, estado_envio, guia_envio,
                      wompi_payment_method, creado_at, actualizado_at
               FROM pedidos`
  const where = []
  const binds = []

  // Filtro por vista (macro, agrupa estados)
  // activos:     APPROVED+(preparando|enviado), o PENDING recientes (< 2h)
  // entregados:  estado_envio = entregado
  // cancelados:  status en DECLINED/VOIDED/ERROR, o estado_envio=cancelado
  // todos:       sin filtro por vista
  if (vista === 'activos') {
    where.push(`(
      (status = 'APPROVED' AND estado_envio IN ('preparando', 'enviado'))
      OR (status = 'PENDING' AND creado_at > datetime('now', '-2 hours'))
    )`)
  } else if (vista === 'entregados') {
    where.push(`estado_envio = 'entregado'`)
  } else if (vista === 'cancelados') {
    where.push(`(status IN ('DECLINED', 'VOIDED', 'ERROR') OR estado_envio = 'cancelado')`)
  }

  // Filtros finos opcionales (pueden combinarse con la vista)
  if (status) { where.push('status = ?'); binds.push(status) }
  if (estadoEnvio) { where.push('estado_envio = ?'); binds.push(estadoEnvio) }

  if (where.length) query += ' WHERE ' + where.join(' AND ')
  query += ' ORDER BY creado_at DESC LIMIT 200'

  const [{ results }, counts] = await Promise.all([
    env.DB.prepare(query).bind(...binds).all(),
    env.DB.prepare(`
      SELECT
        SUM(CASE WHEN (status = 'APPROVED' AND estado_envio IN ('preparando','enviado'))
                   OR (status = 'PENDING' AND creado_at > datetime('now','-2 hours'))
                THEN 1 ELSE 0 END) AS activos,
        SUM(CASE WHEN status = 'APPROVED' AND date(creado_at) = date('now')
                THEN 1 ELSE 0 END) AS nuevos_hoy,
        SUM(CASE WHEN estado_envio = 'entregado' AND creado_at > datetime('now','-30 days')
                THEN 1 ELSE 0 END) AS entregados_mes,
        SUM(CASE WHEN status IN ('DECLINED','VOIDED','ERROR') OR estado_envio = 'cancelado'
                THEN 1 ELSE 0 END) AS cancelados_total
      FROM pedidos
    `).first(),
  ])

  return ok({ pedidos: results, counts }, cors)
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
