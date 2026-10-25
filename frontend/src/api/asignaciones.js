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
