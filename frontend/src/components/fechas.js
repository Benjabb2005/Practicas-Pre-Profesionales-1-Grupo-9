// El ciclo horario es independiente de la zona: sólo las vistas que ya fijaban
// Buenos Aires la pasan explícitamente. Las demás conservan la del dispositivo.
export function fechaHora(valor, opciones = {}) {
  return formatear(valor, false, opciones)
}

export function hora(valor, opciones = {}) {
  return formatear(valor, true, opciones)
}

function formatear(valor, soloHora, opciones) {
  if (valor == null || valor === '') return 'Fecha no disponible'
  const fecha = new Date(valor)
  if (!Number.isFinite(fecha.getTime())) return 'Fecha no disponible'
  const formato = { ...opciones, hourCycle: 'h23' }
  return soloHora ? fecha.toLocaleTimeString('es-AR', formato) : fecha.toLocaleString('es-AR', formato)
}
