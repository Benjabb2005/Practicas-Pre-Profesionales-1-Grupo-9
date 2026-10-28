import { api } from './client'

// Acceso a pedidos. El backend valida rol y formato; acá solo se arma la
// llamada y se devuelve el dato ya desempaquetado. Los clientes viven en
// api/clientes.js.
export async function listarPedidos(filtros = {}) {
  const { data } = await api.get('/pedidos', { params: filtros })
  return data.pedidos
}

export async function obtenerPedido(id) {
  const { data } = await api.get(`/pedidos/${id}`)
  return data.pedido
}

export async function obtenerImporteSugerido(id) {
  const { data } = await api.get(`/pedidos/${id}/importe-sugerido`)
  return data
}

export async function crearPedido(cuerpo) {
  const { data } = await api.post('/pedidos', cuerpo)
  return data
}

// El backend responde 409 cuando el alta coincide con un pedido existente.
// Devuelve la lista para mostrarla; cualquier otro error queda vacío.
export function pedidosDuplicadosDeError(error) {
  const errorApi = error?.response?.data?.error
  if (errorApi?.codigo !== 'DUPLICADO_POTENCIAL') return []
  return Array.isArray(errorApi.posiblesDuplicados) ? errorApi.posiblesDuplicados : []
}

export async function actualizarDireccion(id, direccion) {
  const { data } = await api.put(`/pedidos/${id}/direccion`, direccion)
  return data
}

export async function geocodificarPedido(id, indiceCandidato) {
  const { data } = await api.post(`/pedidos/${id}/geocodificar`, indiceCandidato === undefined ? {} : { indice_candidato: indiceCandidato })
  return data
}

export async function rechazarUbicacion(id) {
  const { data } = await api.post(`/pedidos/${id}/rechazar-ubicacion`)
  return data.pedido
}

export async function confirmarDireccion(id) {
  const { data } = await api.post(`/pedidos/${id}/confirmar-direccion`)
  return data.pedido
}
