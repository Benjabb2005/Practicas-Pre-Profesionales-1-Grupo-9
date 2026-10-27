import { beforeEach, expect, it, vi } from 'vitest'
import { asignarChofer, listarChoferes, misPedidos, obtenerMiPedido, cambiarEstadoPedido, registrarEntrega, registrarPago, misEntregados, historialPedido } from './asignaciones'
import { api } from './client'

vi.mock('./client', () => ({ api: { get: vi.fn(), put: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())

it('entrega conserva la clave para reintentos, pago queda separado y no envía identidad', async () => {
  const datos = { resultado: 'FALLIDA', operacion_id: 'clave-sintetica', motivo: 'Sin respuesta' }
  api.put.mockResolvedValue({ data: { pedido: { estado: 'EN PREPARACIÓN' }, pago: { metodo: 'EFECTIVO' } } })
  expect(await registrarEntrega(7, datos)).toEqual({ estado: 'EN PREPARACIÓN' })
  expect(api.put).toHaveBeenLastCalledWith('/chofer/pedidos/7/entrega', datos)
  await registrarEntrega(7, datos)
  expect(api.put).toHaveBeenLastCalledWith('/chofer/pedidos/7/entrega', datos)
  expect(await registrarPago(7, { metodo: 'EFECTIVO', monto: '10.50' })).toEqual({ metodo: 'EFECTIVO' })
  expect(api.put).toHaveBeenLastCalledWith('/chofer/pedidos/7/pago', { metodo: 'EFECTIVO', monto: '10.50' })
  api.get.mockResolvedValue({ data: { pedidos: [], historial: [] } })
  expect(await misEntregados()).toEqual([])
  expect(api.get).toHaveBeenLastCalledWith('/chofer/entregados')
  await historialPedido(7)
  expect(api.get).toHaveBeenLastCalledWith('/chofer/pedidos/7/historial')
  await historialPedido(7, true)
  expect(api.get).toHaveBeenLastCalledWith('/asignaciones/7/historial')
})

it('el mapa consulta el detalle protegido del chofer y propaga un pedido no disponible', async () => {
  api.get.mockResolvedValueOnce({ data: { pedido: { id: 7, estado_validacion: 'CONFIRMADA' } } })
  expect(await obtenerMiPedido(7)).toMatchObject({ id: 7 })
  expect(api.get).toHaveBeenCalledWith('/chofer/pedidos/7')
  const rechazo = new Error('El pedido no está disponible.')
  api.get.mockRejectedValueOnce(rechazo)
  await expect(obtenerMiPedido(8)).rejects.toBe(rechazo)
})

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
