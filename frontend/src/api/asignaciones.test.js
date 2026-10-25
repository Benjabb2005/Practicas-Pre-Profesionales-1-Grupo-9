import { beforeEach, expect, it, vi } from 'vitest'
import { asignarChofer, listarChoferes, misPedidos } from './asignaciones'
import { api } from './client'

vi.mock('./client', () => ({ api: { get: vi.fn(), put: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())

it('consulta pedidos propios sin enviar una identidad de chofer desde el cliente', async () => {
  api.get.mockResolvedValue({ data: { pedidos: [{ id: 7 }] } })
  expect(await misPedidos()).toEqual([{ id: 7 }])
  expect(api.get).toHaveBeenCalledWith('/chofer/pedidos')
})
it('asigna y quita chofer enviando únicamente el campo admitido', async () => {
  api.put.mockResolvedValue({ data: { pedido: { id: 7, chofer_id: 3 } } })
  expect(await asignarChofer(7, 3)).toEqual({ id: 7, chofer_id: 3 })
  expect(api.put).toHaveBeenLastCalledWith('/asignaciones/7', { chofer_id: 3 })
  await asignarChofer(7, null)
  expect(api.put).toHaveBeenLastCalledWith('/asignaciones/7', { chofer_id: null })
})
it('usa el catálogo de choferes disponible para operadores, sin pedir el ABM de usuarios', async () => {
  api.get.mockResolvedValue({ data: { choferes: [{ id: 3 }] } })
  expect(await listarChoferes()).toEqual([{ id: 3 }])
  expect(api.get).toHaveBeenCalledWith('/asignaciones/choferes')
})
