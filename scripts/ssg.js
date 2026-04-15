/**
 * Script SSG: pre-renderiza rutas públicas a HTML estático.
 *
 * Pipeline:
 *   1. Cliente y SSR ya están construidos (npm run build:client && npm run build:ssr)
 *   2. Cargamos render() del bundle SSR
 *   3. Por cada ruta:
 *      a. Fetcheamos data necesaria (categorías, productos, reseñas)
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

// ====== Rutas estáticas (no requieren data dinámica) ======
const STATIC_ROUTES = ['/', '/guia-tallas', '/politica', '/faq', '/nosotros', '/favoritos']

async function fetchJson(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, opts)
  if (!res.ok) throw new Error(`Fetch ${path} -> ${res.status}`)
  return res.json()
}

async function main() {
  console.log('🔨 SSG iniciando…')
  console.log(`📡 API: ${API_URL}`)

  // Carga el render del bundle SSR
  const serverEntryPath = pathToFileURL(path.join(SSR_DIST, 'entry-server.js')).href
  const { render } = await import(serverEntryPath)

  // Template base
  const template = await fs.readFile(path.join(CLIENT_DIST, 'index.html'), 'utf-8')

  // Fetch data global (categorías + productos)
  console.log('📥 Cargando catálogo desde API…')
  const [categorias, productos] = await Promise.all([
    fetchJson('/api/categorias'),
    fetchJson('/api/productos'),
  ])
  console.log(`   ${categorias.length} categorías, ${productos.length} productos`)

  // Para cada categoría, su lista de productos filtrada
  const productosPorCategoria = {}
  for (const cat of categorias) {
    productosPorCategoria[cat.id] = await fetchJson(`/api/categoria/${cat.id}`)
  }

  // Construir lista de rutas a generar
  const dynamicRoutes = [
    ...categorias.map((c) => `/categoria/${c.id}`),
    ...productos.map((p) => `/producto/${p.id}`),
  ]
  const allRoutes = [...STATIC_ROUTES, ...dynamicRoutes]

  console.log(`🌐 Generando ${allRoutes.length} rutas:`)

  // Pre-fetchear detalle de cada producto (incluye reseñas y relacionados)
  const productoDetalleCache = {}
  const reviewsByProducto = {}
  const relacionadosByProducto = {}
  for (const p of productos) {
    try {
      const [detalle, reviews, relacionados] = await Promise.all([
        fetchJson(`/api/productos/${p.id}`),
        fetchJson(`/api/productos/${p.id}/reviews`),
        fetchJson(`/api/productos/${p.id}/relacionados`),
      ])
      productoDetalleCache[p.id] = detalle
      reviewsByProducto[p.id] = reviews
      relacionadosByProducto[p.id] = relacionados
    } catch (err) {
      console.warn(`   ⚠️  Producto ${p.id}: ${err.message}`)
    }
  }

  let count = 0
  let errors = 0

  for (const route of allRoutes) {
    try {
      const prefetched = {
        categorias,
        productos,
        productosPorCategoria,
        reviewsByProducto,
        relacionadosByProducto,
      }
      // Si la ruta es de producto, además pasamos el detalle
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

      // Path destino: / -> dist/index.html, /categoria/sets -> dist/categoria/sets/index.html
      const destPath = route === '/'
        ? path.join(CLIENT_DIST, 'index.html')
        : path.join(CLIENT_DIST, route.slice(1), 'index.html')

      await fs.mkdir(path.dirname(destPath), { recursive: true })
      await fs.writeFile(destPath, finalHtml, 'utf-8')
      count++
      process.stdout.write(`   ✓ ${route}\n`)
    } catch (err) {
      errors++
      console.error(`   ✗ ${route}: ${err.message}`)
    }
  }

  console.log(`\n✅ ${count} rutas generadas${errors ? `, ${errors} con errores` : ''}.`)
}

main().catch((err) => {
  console.error('💥 SSG falló:', err)
  process.exit(1)
})
