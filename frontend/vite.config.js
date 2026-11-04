import react from '@vitejs/plugin-react'
import { env, cwd } from 'node:process'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const configEnv = { ...loadEnv(mode, cwd(), 'VITE_'), ...env }
  return {
  plugins: [react()],
  server: {
    port: Number(configEnv.VITE_PORT || 5174),
    strictPort: true,
    // Docker Desktop sobre Windows puede no notificar cambios del bind mount.
    watch: {
      usePolling: configEnv.VITE_USE_POLLING === 'true',
    },
    // En desarrollo el frontend habla con Express a través del proxy, así el
    // navegador no necesita CORS ni una URL de API incrustada. El destino se
    // configura por entorno: en Docker apunta al servicio `backend`.
    proxy: {
      '/api': configEnv.VITE_API_PROXY || 'http://localhost:3000',
    },
  },
  }
})
