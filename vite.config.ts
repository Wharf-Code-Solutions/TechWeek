import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo, /api llega al backend FastAPI (backend/, puerto 8000).
    proxy: { '/api': 'http://localhost:8000' },
  },
})
