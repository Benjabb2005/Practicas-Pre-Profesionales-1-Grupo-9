import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: { usePolling: process.env.VITE_USE_POLLING === 'true', interval: 300 },
    proxy: {
      '/api': process.env.API_PROXY_TARGET || 'http://127.0.0.1:3000',
      '/health': process.env.API_PROXY_TARGET || 'http://127.0.0.1:3000',
    },
  },
})
