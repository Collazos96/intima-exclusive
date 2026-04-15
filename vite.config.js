import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Preload selectivo: critical path sí, chunks lazy de admin no.
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
          // React core en chunk propio: beneficia cache entre rutas.
          // Recharts NO se separa: se bundlea dentro del chunk lazy de AdminAnalytics.
          if (!id.includes('node_modules')) return
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router')) {
            return 'react'
          }
        },
      },
    },
  },
})
