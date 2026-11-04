import { beforeEach, describe, expect, it } from 'vitest'
import { borrarToken, guardarToken, leerToken } from './tokenStore'

beforeEach(() => {
  const almacen = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (clave) => (almacen.has(clave) ? almacen.get(clave) : null),
      setItem: (clave, valor) => almacen.set(clave, valor),
      removeItem: (clave) => almacen.delete(clave),
    },
  }
})

describe('tokenStore', () => {
  it('arranca sin token', () => {
    expect(leerToken()).toBeNull()
  })

  it('guarda, lee y borra el token', () => {
    guardarToken('token-de-prueba')
    expect(leerToken()).toBe('token-de-prueba')
    borrarToken()
    expect(leerToken()).toBeNull()
  })

  it('no rompe si el almacenamiento no está disponible', () => {
    globalThis.window = { get localStorage() { throw new Error('bloqueado') } }
    expect(leerToken()).toBeNull()
    expect(() => guardarToken('x')).not.toThrow()
    expect(() => borrarToken()).not.toThrow()
  })
})
