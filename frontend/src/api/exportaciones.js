import { api } from './client.js'

export async function obtenerExportacion(id) {
  return (await api.get(`/exportaciones/pedidos/${id}`)).data
}
