import { describe, expect, it } from 'vitest'
import { contactoDeCliente, datosDeCliente, describirCoincidenciasClientes } from './cliente.js'

describe('datos del cliente en la carga de pedido', () => {
  it('prioriza DNI y teléfono al mostrar un cliente frecuente', () => {
    expect(contactoDeCliente({
      nombre: 'Juan Pérez',
      dni: '20123456',
      telefono: '1155555555',
      email: 'juan@mail.com',
    })).toBe('DNI 20123456 · Tel. 1155555555 · juan@mail.com')
  })

  it('omite los datos de contacto que faltan', () => {
    expect(contactoDeCliente({ nombre: 'Ana', dni: null, telefono: '', email: null })).toBe('')
  })

  it('precarga solo los campos editables del cliente elegido', () => {
    expect(datosDeCliente({
      id: 9,
      nombre: 'Juan Pérez',
      dni: '20123456',
      telefono: '1155555555',
      email: 'juan@mail.com',
      domicilio: 'Av. Siempre Viva 742',
    })).toEqual({
      nombre: 'Juan Pérez',
      dni: '20123456',
      telefono: '1155555555',
      email: 'juan@mail.com',
    })
  })
})

describe('aviso de clientes duplicados', () => {
  it('identifica al otro cliente con nombre y DNI', () => {
    expect(describirCoincidenciasClientes([
      { nombre: 'Cliente previo', dni: '30111222' },
    ])).toBe('Atención: el teléfono o email coincide con otro cliente: Cliente previo (DNI 30111222). No se fusionaron datos.')
  })

  it('describe varias coincidencias e indica cuando no tienen DNI', () => {
    expect(describirCoincidenciasClientes([
      { nombre: 'Cliente previo', dni: '30111222' },
      { nombre: 'Cliente sin documento', dni: null },
    ])).toBe('Atención: el teléfono o email coincide con otros clientes: Cliente previo (DNI 30111222), Cliente sin documento (sin DNI). No se fusionaron datos.')
  })

  it('no muestra aviso sin coincidencias', () => {
    expect(describirCoincidenciasClientes([])).toBe('')
    expect(describirCoincidenciasClientes()).toBe('')
  })
})
