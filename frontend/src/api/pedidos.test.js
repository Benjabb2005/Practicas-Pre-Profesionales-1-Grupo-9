import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './client'
import { crearPedido, listarPedidos, pedidosDuplicadosDeError } from './pedidos'

vi.mock('./client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

describe('api de pedidos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lista pedidos con los filtros de estado, cliente y fecha', async () => {
    const filtros = { estado: 'EN STOCK', cliente: 'Juan', fecha_desde: '2026-10-01', fecha_hasta: '2026-10-21' }
    api.get.mockResolvedValue({ data: { pedidos: [{ id: 1 }] } })

    await expect(listarPedidos(filtros)).resolves.toEqual([{ id: 1 }])
    expect(api.get).toHaveBeenCalledWith('/pedidos', { params: filtros })
  })

  it('crea un pedido con canal de origen y observaciones', async () => {
    const cuerpo = {
      cliente_id: 1,
      canal_origen: 'WHATSAPP',
      observaciones: 'Dejar en portería',
      direccion: { calle: 'Av. Corrientes', altura: '1234' },
    }
    api.post.mockResolvedValue({ data: { pedido: { id: 10 }, posiblesDuplicados: [] } })

    await expect(crearPedido(cuerpo)).resolves.toEqual({ pedido: { id: 10 }, posiblesDuplicados: [] })
    expect(api.post).toHaveBeenCalledWith('/pedidos', cuerpo)
  })

  it('reenvía la confirmación explícita de un pedido duplicado', async () => {
    const cuerpo = { cliente_id: 1, confirmar_duplicado: true, direccion: { calle: 'Av. Corrientes', altura: '1234' } }
    api.post.mockResolvedValue({ data: { pedido: { id: 11 }, posiblesDuplicados: [{ id: 10 }] } })

    await crearPedido(cuerpo)
    expect(api.post).toHaveBeenCalledWith('/pedidos', cuerpo)
  })

  it('extrae los pedidos existentes sólo del conflicto de duplicado', () => {
    const existentes = [{ id: 10, estado: 'EN STOCK' }]
    const error = { response: { data: { error: { codigo: 'DUPLICADO_POTENCIAL', posiblesDuplicados: existentes } } } }
    const otroError = { response: { data: { error: { codigo: 'DATOS_INVALIDOS' } } } }

    expect(pedidosDuplicadosDeError(error)).toEqual(existentes)
    expect(pedidosDuplicadosDeError(otroError)).toEqual([])
    expect(pedidosDuplicadosDeError()).toEqual([])
  })
})
