export function ubicacionConfirmada(pedido) {
  if (pedido.estado_validacion !== 'CONFIRMADA' || pedido.latitud == null || pedido.longitud == null || String(pedido.latitud).trim() === '' || String(pedido.longitud).trim() === '') return null
  const lat = Number(pedido.latitud), lon = Number(pedido.longitud)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lon}`)}`
}

const normalizar = texto => String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export function entregaFinalizada(pedido) {
  return pedido.estado === 'PAGADO' && (pedido.pago_metodo === 'EFECTIVO' || (pedido.pago_metodo === 'TRANSFERENCIA' && Number(pedido.comprobantes_cantidad) > 0))
}
export function entregasDeVista(pedidos, vista) {
  if(vista === 'pendientes')return pedidos.filter(p=>p.estado === 'EN ENVÍO')
  return pedidos.filter(p=>['ENTREGADO','PAGADO'].includes(p.estado) && entregaFinalizada(p) === (vista === 'historial'))
}
export function historialEntregas(filas, pedido = null) {
  const etiquetas = { 'EN STOCK': 'En stock', 'EN PREPARACIÓN': 'En preparación', 'EN ENVÍO': 'Despachado', ENTREGADO: 'Entregado', PAGADO: 'Pagado' }
  const cambios = filas.filter(h => h.estado_anterior !== h.estado_nuevo)
    .map(h => {
      const fallida = h.estado_anterior === 'EN ENVÍO' && h.estado_nuevo === 'EN PREPARACIÓN'
      return { ...h,
        titulo: fallida ? 'En preparación · Intento fallido' : etiquetas[h.estado_nuevo] || h.estado_nuevo,
        motivo: fallida ? h.observaciones?.replace(/^Entrega \[[^\]]+\] FALLIDA: /, '') : null }
    })
  if (!pedido) return cambios
  const eventos = cambios.map(h => ({ ...h, id: `estado-${h.id}` }))
  if (pedido.created_at) eventos.push({ id: 'alta', titulo: 'Pedido creado', fecha: pedido.created_at, motivo: 'Datos del cliente y dirección original guardados.' })
  eventos.push(...(pedido.intentos || []).map(h => ({ id: `geo-${h.id}`, fecha: h.fecha,
    titulo: h.accion_operador === 'CONFIRMO' ? 'Ubicación confirmada' : h.accion_operador === 'RECHAZO' ? 'Ubicación rechazada' : `Búsqueda de ubicación · ${h.resultado || 'Registrada'}`,
    motivo: h.direccion_enviada || null,
  })))
  return eventos.sort((a, b) => (Date.parse(b.fecha) || 0) - (Date.parse(a.fecha) || 0))
}
export function filtrarEntregas(pedidos, busqueda) {
  const texto = normalizar(busqueda).trim()
  return pedidos.filter(p => normalizar([p.id, p.codigo, p.cliente_nombre, p.calle, p.altura, p.localidad].join(' ')).includes(texto))
}
