import { expect, it } from 'vitest'
import { importeParaPrecargar, textoImporteSugerido } from './importeSugerido.js'

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
