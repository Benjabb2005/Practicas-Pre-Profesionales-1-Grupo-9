import react from '@vitejs/plugin-react'
import { env } from 'node:process'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Docker Desktop sobre Windows puede no notificar cambios del bind mount.
    watch: {
      usePolling: env.VITE_USE_POLLING === 'true',
    },
    // En desarrollo el frontend habla con Express a través del proxy, así el
    // navegador no necesita CORS ni una URL de API incrustada. El destino se
    // configura por entorno: en Docker apunta al servicio `backend`.
    proxy: {
      '/api': env.VITE_API_PROXY || 'http://localhost:3000',
    },
  },
})
