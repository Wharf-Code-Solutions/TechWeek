import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Librerías que casi no cambian en su propio archivo: un despliegue nuevo no las vuelve a descargar.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          animacion: ['framer-motion'],
          idioma: ['i18next', 'react-i18next'],
        },
      },
    },
  },
  server: {
    // En desarrollo, /api llega al backend FastAPI (backend/, puerto 8000).
    proxy: { '/api': 'http://localhost:8000' },
  },
})
