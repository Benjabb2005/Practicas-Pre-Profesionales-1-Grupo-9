import { describe, expect, it } from 'vitest'
import { coordenadasDeMapa } from './mapa.js'

describe('coordenadas del mapa', () => {
  it('no abre el mapa cuando el pedido todavía no tiene coordenadas', () => {
    expect(coordenadasDeMapa(null, null)).toBeNull()
    expect(coordenadasDeMapa(undefined, undefined)).toBeNull()
    expect(coordenadasDeMapa('', '')).toBeNull()
    expect(coordenadasDeMapa('  ', '  ')).toBeNull()
    expect(coordenadasDeMapa(null, -58.38)).toBeNull()
    expect(coordenadasDeMapa(-34.6, null)).toBeNull()
  })

  it('rechaza textos inválidos y coordenadas fuera de rango', () => {
    expect(coordenadasDeMapa('no-es-un-numero', -58.38)).toBeNull()
    expect(coordenadasDeMapa(Infinity, -58.38)).toBeNull()
    expect(coordenadasDeMapa(-91, -58.38)).toBeNull()
    expect(coordenadasDeMapa(-34.6, 181)).toBeNull()
  })

  it('acepta coordenadas numéricas y las devuelve como números', () => {
    expect(coordenadasDeMapa('-34.6037', '-58.3816')).toEqual({ lat: -34.6037, lon: -58.3816 })
    expect(coordenadasDeMapa(-34.6037, -58.3816)).toEqual({ lat: -34.6037, lon: -58.3816 })
  })

  it('acepta el origen explícito sin confundirlo con un dato faltante', () => {
    expect(coordenadasDeMapa(0, 0)).toEqual({ lat: 0, lon: 0 })
    expect(coordenadasDeMapa('0', '0')).toEqual({ lat: 0, lon: 0 })
  })
})
