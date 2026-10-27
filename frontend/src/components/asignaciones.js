export function asignacionesActivas(pedidos = []) {
  return pedidos.filter(p => ['EN STOCK','EN PREPARACIÓN','EN ENVÍO'].includes(p.estado)
    || p.estado === 'ENTREGADO')
}

export function resumirAsignaciones(pedidos = []) {
  return {
    habilitados: pedidos.filter(p => p.puede_asignar).length,
    bloqueados: pedidos.filter(p => ['EN STOCK', 'EN PREPARACIÓN'].includes(p.estado) && !p.puede_asignar).length,
  }
}
