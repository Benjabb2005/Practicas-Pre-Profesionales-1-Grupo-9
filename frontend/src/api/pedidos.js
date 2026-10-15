import { api } from './client'

// Acceso a pedidos y clientes. El backend valida rol y formato; acá solo se
// arma la llamada y se devuelve el dato ya desempaquetado.
export async function listarPedidos(filtros = {}) {
  const { data } = await api.get('/pedidos', { params: filtros })
  return data.pedidos
}

export async function obtenerPedido(id) {
  const { data } = await api.get(`/pedidos/${id}`)
  return data.pedido
}

export async function crearPedido(cuerpo) {
  const { data } = await api.post('/pedidos', cuerpo)
  return data
}

export async function actualizarDireccion(id, direccion) {
  const { data } = await api.put(`/pedidos/${id}/direccion`, direccion)
  return data
}

export async function geocodificarPedido(id) {
  const { data } = await api.post(`/pedidos/${id}/geocodificar`)
  return data
}

export async function confirmarDireccion(id) {
  const { data } = await api.post(`/pedidos/${id}/confirmar-direccion`)
  return data.pedido
}

export async function listarClientes(busqueda) {
  const { data } = await api.get('/clientes', { params: busqueda ? { busqueda } : {} })
  return data.clientes
}
