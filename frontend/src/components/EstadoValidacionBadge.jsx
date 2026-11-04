const ETIQUETAS = {
  PENDIENTE: { texto: 'Pendiente', tono: 'gris' },
  CON_ADVERTENCIAS: { texto: 'Con advertencias', tono: 'amber' },
  VALIDA: { texto: 'Válida', tono: 'blue' },
  CONFIRMADA: { texto: 'Confirmada', tono: 'green' },
}

// Etiqueta visual del estado de validación. Es sólo presentación: el valor real
// y la habilitación del despacho viven en el backend.
function EstadoValidacionBadge({ estado }) {
  const dato = ETIQUETAS[estado] || { texto: estado || 'Sin estado', tono: 'gris' }
  return <span className={`validacion-badge ${dato.tono}`}>{dato.texto}</span>
}

export default EstadoValidacionBadge
