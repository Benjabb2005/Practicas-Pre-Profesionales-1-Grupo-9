import { api } from './client'

export async function listarAsignaciones() {
  return (await api.get('/asignaciones')).data.pedidos
}
export async function listarChoferes() {
  return (await api.get('/asignaciones/choferes')).data.choferes
}
export async function asignarChofer(id, choferId) {
  return (await api.put(`/asignaciones/${id}`, { chofer_id: choferId })).data.pedido
}
export async function cambiarEstadoPedido(id, estado) {
  return (await api.put(`/asignaciones/${id}/estado`, { estado })).data.pedido
}
export async function misPedidos() {
  return (await api.get('/chofer/pedidos')).data.pedidos
}

export async function obtenerMiPedido(id) {
  return (await api.get(`/chofer/pedidos/${id}`)).data.pedido
}

export async function registrarEntrega(id, datos) {
  return (await api.put(`/chofer/pedidos/${id}/entrega`, datos)).data.pedido
}
export async function registrarPago(id, datos) {
  return (await api.put(`/chofer/pedidos/${id}/pago`, datos)).data.pago
}
export async function misEntregados() {
  return (await api.get('/chofer/entregados')).data.pedidos
}
export async function historialPedido(id, operador = false) {
  return (await api.get(`/${operador ? 'asignaciones' : 'chofer/pedidos'}/${id}/historial`)).data.historial
}
