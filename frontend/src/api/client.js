import axios from 'axios'
import { leerToken, borrarToken } from '../auth/tokenStore'

// Cliente único hacia el backend. En desarrollo, Vite redirige /api al servidor
// Express (ver vite.config.js), así que nunca se incrusta una URL ni un secreto.
export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = leerToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    if (error.response?.status === 401) {
      borrarToken()
    }
    return Promise.reject(error)
  },
)

// Traduce el error del backend a un mensaje en español para la interfaz.
export function mensajeError(error) {
  const datos = error?.response?.data?.error
  if (datos?.mensaje) {
    return datos.mensaje
  }
  if (error?.request && !error?.response) {
    return 'No pudimos contactar al servidor. Revisá tu conexión e intentá de nuevo.'
  }
  return 'Ocurrió un error inesperado. Intentá nuevamente.'
}
