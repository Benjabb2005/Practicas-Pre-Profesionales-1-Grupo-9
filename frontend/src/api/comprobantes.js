import { api } from './client.js'
export const LIMITE_COMPROBANTE=5*1024*1024
export function errorArchivo(archivo) {
  if (!archivo) return ''
  if (!archivo.size || archivo.size>LIMITE_COMPROBANTE) return 'Elegí un archivo de hasta 5 MB.'
  if (archivo.type && !['image/jpeg','image/png','image/webp','application/pdf'].includes(archivo.type)) return 'Usá JPG, PNG, WEBP o PDF.'
  return ''
}
export async function subirComprobante(id,archivo) {
  return (await api.post(`/comprobantes/pedido/${id}`,archivo,{headers:{'Content-Type':archivo.type || 'application/octet-stream','X-Nombre-Archivo':encodeURIComponent(archivo.name)}})).data.comprobante
}
export async function listarComprobantes(id) {return (await api.get(`/comprobantes/pedido/${id}`)).data.comprobantes}
export async function descargarComprobante(id) {return (await api.get(`/comprobantes/${id}`,{responseType:'blob'})).data}
