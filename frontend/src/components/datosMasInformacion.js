// Fuente común de los campos visibles del panel y su descarga.
export function direccionDelPedido(pedido) {
  return [pedido.calle, pedido.altura, pedido.localidad, pedido.provincia].filter(Boolean).join(' ')
}

export function datosMasInformacion(pedido) {
  return [
    ['Cliente', pedido.cliente_nombre], ['DNI', pedido.cliente_dni],
    ['Teléfono', pedido.cliente_telefono], ['Email', pedido.cliente_email],
    ['Dirección', direccionDelPedido(pedido)], ['Piso / Depto', pedido.piso_depto],
    ['Código postal', pedido.codigo_postal], ['Entre calles', pedido.entre_calles],
    ['Estado del pedido', pedido.estado], ['Validación', pedido.estado_validacion],
    ['Canal de origen', pedido.canal_origen], ['Observaciones', pedido.observaciones],
  ]
}
