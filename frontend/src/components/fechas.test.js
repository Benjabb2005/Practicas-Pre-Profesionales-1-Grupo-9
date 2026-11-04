import { describe, it, expect } from 'vitest'
import { fechaHora, hora } from './fechas.js'

const buenosAires = { timeZone: 'America/Argentina/Buenos_Aires' }
describe('horarios de 24 horas', () => {
  it.each([
    ['2026-11-02T21:41:00Z', '18:41:00'],
    ['2026-11-02T03:00:00Z', '00:00:00'],
    ['2026-11-02T15:00:00Z', '12:00:00'],
  ])('presenta %s sin ambigüedad', (valor, esperado) => {
    expect(hora(valor, buenosAires)).toBe(esperado)
    expect(fechaHora(valor, buenosAires)).toContain(esperado)
  })
  it.each([null, undefined, '', 'fecha inválida'])('no inventa fecha para %s', valor => {
    expect(fechaHora(valor)).toBe('Fecha no disponible')
    expect(hora(valor)).toBe('Fecha no disponible')
  })
  it('conserva la zona del dispositivo cuando no se indica otra', () => {
    const fecha = new Date('2026-11-02T21:41:00Z')
    expect(fechaHora(fecha)).toBe(fecha.toLocaleString('es-AR', { hourCycle: 'h23' }))
    expect(hora(fecha)).toBe(fecha.toLocaleTimeString('es-AR', { hourCycle: 'h23' }))
  })
})
