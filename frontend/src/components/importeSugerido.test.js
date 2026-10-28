import { expect, it } from 'vitest'
import { importeParaPrecargar, puedeCompletarImporte, puedeConsultarSugerencia, textoImporteSugerido } from './importeSugerido.js'

it('presenta la sugerencia con moneda local, distancia y precio por km', () => {
  expect(textoImporteSugerido({
    disponible: true,
    distancia_km: 12.3,
    precio_km: '125.00',
    importe_sugerido: '1537.50',
  })).toBe('Sugerido: $1.537,50 (12,3 km en línea recta × $125,00 por km)')
})

it('precarga un importe positivo, pero deja vacío el campo si no hay sugerencia o es cero', () => {
  expect(importeParaPrecargar({ disponible: true, importe_sugerido: '250.00' })).toBe('250.00')
  expect(importeParaPrecargar({ disponible: true, importe_sugerido: '0.00' })).toBe('')
  expect(importeParaPrecargar({ disponible: false, importe_sugerido: '250.00' })).toBe('')
})

it('permite completar pedidos antiguos sin dirección confirmada, pero consulta solo al confirmar', () => {
  const pedidoViejo = { importe_base: null, estado: 'EN STOCK', estado_validacion: 'PENDIENTE' }
  const confirmado = { ...pedidoViejo, estado_validacion: 'CONFIRMADA' }
  const pagado = { ...confirmado, estado: 'PAGADO' }

  expect(puedeCompletarImporte(pedidoViejo)).toBe(true)
  expect(puedeConsultarSugerencia(pedidoViejo)).toBe(false)
  expect(puedeConsultarSugerencia(confirmado)).toBe(true)
  expect(puedeCompletarImporte(pagado)).toBe(false)
})
