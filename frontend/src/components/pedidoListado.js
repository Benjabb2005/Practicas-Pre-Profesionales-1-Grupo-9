// Lógica de presentación del listado de pedidos. No accede a la API: arma los
// parámetros que espera el backend y resume lo que ya llegó autorizado.
export const FILTROS_PEDIDOS_VACIOS = Object.freeze({
  estado: '',
  cliente: '',
  fecha_desde: '',
  fecha_hasta: '',
})

export function parametrosDeFiltros(filtros = {}) {
  const parametros = {}
  const estado = String(filtros.estado ?? '').trim()
  const cliente = String(filtros.cliente ?? '').trim()
  const fechaDesde = String(filtros.fecha_desde ?? '').trim()
  const fechaHasta = String(filtros.fecha_hasta ?? '').trim()

  if (estado) parametros.estado = estado
  if (cliente) parametros.cliente = cliente
  if (fechaDesde) parametros.fecha_desde = fechaDesde
  if (fechaHasta) parametros.fecha_hasta = fechaHasta
  return parametros
}

export function sinFiltros(filtros = {}) {
  return Object.keys(parametrosDeFiltros(filtros)).length === 0
}

export function resumirPedidos(pedidos = []) {
  return pedidos.reduce((resumen, pedido) => {
    resumen.total += 1
    if (pedido.estado === 'EN PREPARACIÓN') resumen.enPreparacion += 1
    if (pedido.estado === 'EN ENVÍO') resumen.enEnvio += 1
    if (pedido.estado === 'ENTREGADO' || pedido.estado === 'PAGADO') resumen.entregadosOPagados += 1
    return resumen
  }, {
    total: 0,
    enPreparacion: 0,
    enEnvio: 0,
    entregadosOPagados: 0,
  })
}

export function direccionDePedido(pedido = {}) {
  const original = String(pedido.direccion_original ?? '').trim()
  if (original) return original
  const partes = [pedido.calle, pedido.altura]
    .map((parte) => String(parte ?? '').trim())
    .filter(Boolean)
  return partes.length ? partes.join(' ') : 'Sin dirección'
}

export function fechaVisible(valor) {
  if (!valor) return ''
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return ''
  return fecha.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}
