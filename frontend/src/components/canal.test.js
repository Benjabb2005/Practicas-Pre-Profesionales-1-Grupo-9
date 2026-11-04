import { describe, expect, it } from 'vitest'
import { CANALES_ORIGEN, CANAL_PREDETERMINADO, etiquetaCanal } from './canal'

describe('canales de origen', () => {
  it('ofrece los canales del catálogo del backend con una etiqueta visible', () => {
    expect(CANALES_ORIGEN.map((canal) => canal.valor)).toEqual([
      'WHATSAPP',
      'INSTAGRAM',
      'CORREO',
      'SISTEMA EXTERNO',
      'MANUAL',
    ])
    expect(CANAL_PREDETERMINADO).toBe('MANUAL')
  })

  it('traduce el valor guardado a una etiqueta legible', () => {
    expect(etiquetaCanal('WHATSAPP')).toBe('WhatsApp')
    expect(etiquetaCanal('CORREO')).toBe('Correo electrónico')
    expect(etiquetaCanal('MANUAL')).toBe('Carga manual')
  })

  it('no inventa una etiqueta para un valor desconocido o vacío', () => {
    expect(etiquetaCanal('PALOMA')).toBe('PALOMA')
    expect(etiquetaCanal(null)).toBe('Sin informar')
  })
})
