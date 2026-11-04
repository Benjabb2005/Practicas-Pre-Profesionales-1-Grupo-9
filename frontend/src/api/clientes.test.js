import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './client'
import { actualizarCliente, crearCliente, eliminarCliente, listarClientes } from './clientes'

vi.mock('./client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('api de clientes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lista clientes con el texto de búsqueda', async () => {
    api.get.mockResolvedValue({ data: { clientes: [{ id: 1, nombre: 'Juan' }] } })

    await expect(listarClientes(' 20.123 ')).resolves.toEqual([{ id: 1, nombre: 'Juan' }])
    expect(api.get).toHaveBeenCalledWith('/clientes', { params: { busqueda: ' 20.123 ' } })
  })

  it('lista todos los clientes cuando no hay búsqueda', async () => {
    api.get.mockResolvedValue({ data: { clientes: [] } })

    await expect(listarClientes()).resolves.toEqual([])
    expect(api.get).toHaveBeenCalledWith('/clientes', { params: {} })
  })

  it('crea un cliente', async () => {
    const cuerpo = { nombre: 'Juan', dni: '20123456' }
    api.post.mockResolvedValue({ data: { cliente: { id: 2 }, posiblesDuplicados: [] } })

    await expect(crearCliente(cuerpo)).resolves.toEqual({ cliente: { id: 2 }, posiblesDuplicados: [] })
    expect(api.post).toHaveBeenCalledWith('/clientes', cuerpo)
  })

  it('actualiza un cliente por id', async () => {
    const cuerpo = { nombre: 'Juan actualizado' }
    api.put.mockResolvedValue({ data: { cliente: { id: 2 } } })

    await expect(actualizarCliente(2, cuerpo)).resolves.toEqual({ cliente: { id: 2 } })
    expect(api.put).toHaveBeenCalledWith('/clientes/2', cuerpo)
  })

  it('elimina un cliente por id', async () => {
    api.delete.mockResolvedValue({ data: {} })

    await expect(eliminarCliente(2)).resolves.toBeUndefined()
    expect(api.delete).toHaveBeenCalledWith('/clientes/2')
  })
})
