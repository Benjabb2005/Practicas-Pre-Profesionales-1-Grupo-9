function formatoImporte(valor, decimales) {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return ''
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(numero)
}

export function textoImporteSugerido(sugerencia) {
  if (!sugerencia?.disponible) return ''
  const importe = formatoImporte(sugerencia.importe_sugerido, 2)
  const distancia = formatoImporte(sugerencia.distancia_km, 1)
  const precio = formatoImporte(sugerencia.precio_km, 2)
  if (!importe || !distancia || !precio) return ''
  return `Sugerido: $${importe} (${distancia} km en línea recta × $${precio} por km)`
}

export function importeParaPrecargar(sugerencia) {
  if (!sugerencia?.disponible) return ''
  const importe = Number(sugerencia.importe_sugerido)
  return Number.isFinite(importe) && importe > 0 ? String(sugerencia.importe_sugerido) : ''
}
