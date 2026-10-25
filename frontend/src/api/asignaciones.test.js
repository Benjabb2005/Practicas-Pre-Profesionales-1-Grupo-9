import { beforeEach, expect, it, vi } from 'vitest'
import { asignarChofer, listarChoferes, misPedidos, cambiarEstadoPedido } from './asignaciones'
import { api } from './client'

vi.mock('./client', () => ({ api: { get: vi.fn(), put: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())

it('envía el cambio de estado por la operación protegida de asignaciones', async () => {
  api.put.mockResolvedValue({ data: { pedido: { id: 7, estado: 'EN PREPARACIÓN' } } })
  expect(await cambiarEstadoPedido(7, 'EN PREPARACIÓN')).toEqual({ id: 7, estado: 'EN PREPARACIÓN' })
  expect(api.put).toHaveBeenCalledWith('/asignaciones/7/estado', { estado: 'EN PREPARACIÓN' })
})

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
