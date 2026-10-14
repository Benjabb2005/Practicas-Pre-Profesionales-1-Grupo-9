import { describe, expect, it } from 'vitest'
import { mensajeError } from './client'

describe('mensajeError', () => {
  it('usa el mensaje seguro que devuelve el backend', () => {
    const error = { response: { data: { error: { codigo: 'NO_AUTENTICADO', mensaje: 'Usuario o contraseña incorrectos.' } } } }
    expect(mensajeError(error)).toBe('Usuario o contraseña incorrectos.')
  })

  it('avisa cuando no hubo respuesta del servidor', () => {
    expect(mensajeError({ request: {}, message: 'Network Error' })).toMatch(/no pudimos contactar/i)
  })

  it('cae en un mensaje genérico ante un error desconocido', () => {
    expect(mensajeError({})).toMatch(/inesperado/i)
  })
})
