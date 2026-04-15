import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
