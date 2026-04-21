import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Plugin que reemplaza %VITE_GSC_META% en index.html.
 * Si hay VITE_GSC_TOKEN, inyecta el <meta> de verificación. Si no, borra el placeholder.
 */
function gscMetaPlugin() {
  return {
    name: 'gsc-meta',
    transformIndexHtml(html) {
      const token = process.env.VITE_GSC_TOKEN || ''
      const tag = token
        ? `<meta name="google-site-verification" content="${token}" />`
        : ''
      return html.replace('%VITE_GSC_META%', tag)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), gscMetaPlugin()],
  build: {
    modulePreload: {
      polyfill: false,
      resolveDependencies(_url, deps, { hostType }) {
        if (hostType !== 'html') return deps
        return deps.filter((d) =>
          !d.includes('Admin') &&
          !d.includes('useAdmin') &&
          !d.includes('charts-'),
        )
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router')) {
            return 'react'
          }
        },
      },
    },
  },
  // SSR-specific config
  ssr: {
    // Sonner usa portales y sólo importa cosas en useEffect → safe pero
    // mejor noExternal para que Vite lo procese y lo trate como ESM consistente.
    noExternal: ['sonner', '@tanstack/react-query'],
  },
})
