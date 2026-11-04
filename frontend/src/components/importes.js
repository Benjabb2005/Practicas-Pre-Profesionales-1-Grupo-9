export function moneda(valor) { return valor == null ? 'Pendiente' : Number(valor).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) }
