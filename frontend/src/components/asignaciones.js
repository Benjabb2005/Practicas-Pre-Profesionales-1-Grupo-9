export function resumirAsignaciones(pedidos = []) {
  return {
    habilitados: pedidos.filter(p => p.puede_asignar).length,
    bloqueados: pedidos.filter(p => ['EN STOCK', 'EN PREPARACIÓN'].includes(p.estado) && !p.puede_asignar).length,
  }
}
