/**
 * Script SSG: pre-renderiza rutas públicas a HTML estático.
 *
 * Pipeline:
 *   1. Cliente y SSR ya están construidos (npm run build:client && npm run build:ssr)
 *   2. Cargamos render() del bundle SSR
 *   3. Por cada ruta:
 *      a. Fetcheamos data necesaria (categorías, productos, reseñas) EN PARALELO
 *      b. Renderizamos a HTML
 *      c. Inyectamos html + dehydrated state en el template
 *      d. Escribimos dist/<ruta>/index.html
 *
 * Las rutas /admin/* se quedan como SPA (servidas por dist/index.html via fallback).
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CLIENT_DIST = path.join(ROOT, 'dist')
const SSR_DIST = path.join(ROOT, 'dist-ssr')

const API_URL = process.env.VITE_API_URL || 'https://api.intimaexclusive.com'
const FETCH_TIMEOUT_MS = 15_000  // 15s por fetch — si la API no responde, sigue

// ====== Rutas estáticas (no requieren data dinámica) ======
const STATIC_ROUTES = ['/', '/guia-tallas', '/politica', '/faq', '/nosotros', '/favoritos']

async function fetchJson(pathUrl, opts = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(`${API_URL}${pathUrl}`, { ...opts, signal: ctrl.signal })
    if (!res.ok) throw new Error(`${pathUrl} -> ${res.status}`)
    return await res.json()
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`${pathUrl} -> timeout ${FETCH_TIMEOUT_MS}ms`)
    throw err
  } finally {
    clearTimeout(t)
  }
}

const t0 = Date.now()
const ts = () => `[${((Date.now() - t0) / 1000).toFixed(1)}s]`

async function main() {
  console.log(`${ts()} 🔨 SSG iniciando…`)
  console.log(`${ts()} 📡 API: ${API_URL}`)

  // Carga el render del bundle SSR
  const serverEntryPath = pathToFileURL(path.join(SSR_DIST, 'entry-server.js')).href
  const { render } = await import(serverEntryPath)
  console.log(`${ts()} ✓ Bundle SSR cargado`)

  const template = await fs.readFile(path.join(CLIENT_DIST, 'index.html'), 'utf-8')

  // Fetch data global en paralelo
  console.log(`${ts()} 📥 Cargando categorías + productos…`)
  const [categorias, productos] = await Promise.all([
    fetchJson('/api/categorias'),
    fetchJson('/api/productos'),
  ])
  console.log(`${ts()}    ${categorias.length} categorías, ${productos.length} productos`)

  // Productos por categoría EN PARALELO
  console.log(`${ts()} 📥 Productos por categoría (paralelo)…`)
  const productosPorCategoriaArr = await Promise.all(
    categorias.map((c) => fetchJson(`/api/categoria/${c.id}`).catch((e) => {
      console.warn(`${ts()}    ⚠️  categoria/${c.id}: ${e.message}`)
      return []
    }))
  )
  const productosPorCategoria = {}
  categorias.forEach((c, i) => { productosPorCategoria[c.id] = productosPorCategoriaArr[i] })

  // Detalle + reviews + relacionados por producto EN PARALELO
  console.log(`${ts()} 📥 Detalles de ${productos.length} productos (paralelo)…`)
  const detallesArr = await Promise.all(
    productos.map(async (p) => {
      try {
        const [detalle, reviews, relacionados] = await Promise.all([
          fetchJson(`/api/productos/${p.id}`),
          fetchJson(`/api/productos/${p.id}/reviews`),
          fetchJson(`/api/productos/${p.id}/relacionados`),
        ])
        return { id: p.id, detalle, reviews, relacionados }
      } catch (e) {
        console.warn(`${ts()}    ⚠️  producto ${p.id}: ${e.message}`)
        return null
      }
    })
  )
  const productoDetalleCache = {}
  const reviewsByProducto = {}
  const relacionadosByProducto = {}
  for (const d of detallesArr) {
    if (!d) continue
    productoDetalleCache[d.id] = d.detalle
    reviewsByProducto[d.id] = d.reviews
    relacionadosByProducto[d.id] = d.relacionados
  }
  console.log(`${ts()}    ✓ ${detallesArr.filter(Boolean).length}/${productos.length} productos con detalle`)

  // Construir lista de rutas a generar
  const dynamicRoutes = [
    ...categorias.map((c) => `/categoria/${c.id}`),
    ...productos.map((p) => `/producto/${p.id}`),
  ]
  const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes]

  console.log(`${ts()} 🌐 Generando ${allRoutes.length} rutas…`)

  let count = 0
  let errors = 0

  // Render en paralelo (renderToString es sincrónico y rápido)
  await Promise.all(allRoutes.map(async (route) => {
    try {
      const prefetched = {
        categorias,
        productos,
        productosPorCategoria,
        reviewsByProducto,
        relacionadosByProducto,
      }
      const productoMatch = route.match(/^\/producto\/(.+)$/)
      if (productoMatch) {
        const id = productoMatch[1]
        prefetched.producto = productoDetalleCache[id]
      }

      const { html, dehydratedState } = render(route, prefetched)

      const initialStateScript =
        `<script>window.__INITIAL_STATE__ = ${JSON.stringify(dehydratedState).replace(/</g, '\\u003c')}</script>`

      const finalHtml = template
        .replace('<!--app-html-->', html)
        .replace('<!--app-state-->', initialStateScript)

      const destPath = route === '/'
        ? path.join(CLIENT_DIST, 'index.html')
        : path.join(CLIENT_DIST, route.slice(1), 'index.html')

      await fs.mkdir(path.dirname(destPath), { recursive: true })
      await fs.writeFile(destPath, finalHtml, 'utf-8')
      count++
    } catch (err) {
      errors++
      console.error(`${ts()}    ✗ ${route}: ${err.message}`)
    }
  }))

  console.log(`${ts()} ✅ ${count} rutas generadas${errors ? `, ${errors} con errores` : ''}.`)
}

main().catch((err) => {
  console.error(`${ts()} 💥 SSG falló:`, err)
  process.exit(1)
})
