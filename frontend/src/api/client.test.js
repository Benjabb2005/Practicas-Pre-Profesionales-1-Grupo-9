import { describe, expect, it } from 'vitest'
import { mensajeError } from './client'

describe('mensajeError', () => {
  it('usa el mensaje seguro que devuelve el backend', () => {
    const error = { response: { data: { error: { codigo: 'NO_AUTENTICADO', mensaje: 'Usuario o contraseña incorrectos.' } } } }
    expect(mensajeError(error)).toBe('Usuario o contraseña incorrectos.')
  })

  it('muestra el mensaje seguro de un conflicto 409', () => {
    const error = { response: { status: 409, data: { error: { codigo: 'CONFLICTO', mensaje: 'La dirección no tiene coordenadas para confirmar.' } } } }
    expect(mensajeError(error)).toBe('La dirección no tiene coordenadas para confirmar.')
  })

  it('muestra el mensaje de conflicto del backend', () => {
    const error = { response: { status: 409, data: { error: { codigo: 'CONFLICTO', mensaje: 'Ya existe un cliente con ese DNI.' } } } }
    expect(mensajeError(error)).toBe('Ya existe un cliente con ese DNI.')
  })

  it('avisa cuando no hubo respuesta del servidor', () => {
    expect(mensajeError({ request: {}, message: 'Network Error' })).toMatch(/no pudimos contactar/i)
  })

  it('cae en un mensaje genérico ante un error desconocido', () => {
    expect(mensajeError({})).toMatch(/inesperado/i)
  })
})
