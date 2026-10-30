import { historialEntregas } from './chofer.js'

export function pedidosParaActividad(pedidos) {
  return [...pedidos].sort((a, b) => (Date.parse(b.updated_at || b.created_at) || 0) - (Date.parse(a.updated_at || a.created_at) || 0)).slice(0, 8)
}

export function movimientosRecientes(pedidos, historiales, geograficos = []) {
  return pedidos.flatMap((pedido, i) => {
    const base = { pedidoId: pedido.id, codigo: pedido.codigo || `#${pedido.id}`, cliente: pedido.cliente_nombre }
    const cambios = historialEntregas(historiales[i] || []).map(h => ({ ...base, id: `${pedido.id}-${h.id}`, titulo: h.titulo, fecha: h.fecha, usuario: h.usuario_nombre }))
    cambios.push(...(geograficos[i] || []).filter(h => h.accion_operador === 'CONFIRMO').map(h => ({ ...base, id: `${pedido.id}-geo-${h.id}`, titulo: 'Ubicación confirmada', fecha: h.fecha, usuario: 'Revisión humana' })))
    if (pedido.created_at) cambios.push({ ...base, id: `${pedido.id}-alta`, titulo: 'Pedido registrado', fecha: pedido.created_at })
    return cambios
  }).filter(h => Number.isFinite(Date.parse(h.fecha)))
    .sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha)).slice(0, 3)
}
