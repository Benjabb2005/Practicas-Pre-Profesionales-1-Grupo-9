export function ubicacionConfirmada(pedido) {
  if (pedido.estado_validacion !== 'CONFIRMADA' || pedido.latitud == null || pedido.longitud == null || String(pedido.latitud).trim() === '' || String(pedido.longitud).trim() === '') return null
  const lat = Number(pedido.latitud), lon = Number(pedido.longitud)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lon}`)}`
}

const normalizar = texto => String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export function historialEntregas(filas) {
  const etiquetas = { 'EN STOCK': 'En stock', 'EN PREPARACIÓN': 'En preparación', 'EN ENVÍO': 'Despachado', ENTREGADO: 'Entregado', PAGADO: 'Pagado' }
  return filas.filter(h => h.estado_anterior !== h.estado_nuevo)
    .map(h => {
      const fallida = h.estado_anterior === 'EN ENVÍO' && h.estado_nuevo === 'EN PREPARACIÓN'
      return { ...h,
        titulo: fallida ? 'En preparación · Intento fallido' : etiquetas[h.estado_nuevo] || h.estado_nuevo,
        motivo: fallida ? h.observaciones?.replace(/^Entrega \[[^\]]+\] FALLIDA: /, '') : null }
    })
}
export function filtrarEntregas(pedidos, busqueda) {
  const texto = normalizar(busqueda).trim()
  return pedidos.filter(p => normalizar([p.id, p.codigo, p.cliente_nombre, p.calle, p.altura, p.localidad].join(' ')).includes(texto))
}
