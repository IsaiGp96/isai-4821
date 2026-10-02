/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Puerto fijo: el backend solo acepta peticiones de este origen (CORS_ORIGIN).
  server: { port: 5173, strictPort: true },
  // jsdom simula el navegador en las pruebas, incluido localStorage.
  test: { environment: 'jsdom' },
})
