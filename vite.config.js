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
        // Excluye chunks que solo se alcanzan por rutas admin lazy-loaded
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
          if (id.includes('/recharts/') || id.includes('/victory-') || id.includes('/d3-')) {
            return 'charts'
          }
        },
      },
    },
  },
})
