import { expect, it } from 'vitest'
import { movimientosRecientes, pedidosParaActividad } from './actividad.js'
import { historialEntregas } from './chofer.js'

it('limita la consulta a ocho pedidos recientes y no reordena la fuente', () => {
  const pedidos = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, created_at: `2026-10-${String(i + 1).padStart(2, '0')}T12:00:00Z` }))
  const seleccion = pedidosParaActividad(pedidos)
  expect(seleccion.map(p => p.id)).toEqual([12, 11, 10, 9, 8, 7, 6, 5])
  expect(pedidos[0].id).toBe(1)
})

it('ordena las altas y cambios reales, conserva el pedido del enlace y no inventa movimientos', () => {
  const pedidos = [{ id: 10, codigo: 'QA-10', created_at: '2026-10-01T10:00:00Z' }, { id: 20, created_at: '2026-10-02T10:00:00Z' }]
  const eventos = movimientosRecientes(pedidos, [[
    { id: 1, fecha: '2026-10-03T10:00:00Z', estado_anterior: 'EN PREPARACIÓN', estado_nuevo: 'EN ENVÍO', usuario_nombre: 'Operador de prueba' },
    { id: 2, fecha: '2026-10-04T10:00:00Z', estado_anterior: 'EN ENVÍO', estado_nuevo: 'EN ENVÍO' },
    { id: 3, fecha: 'fecha inválida', estado_anterior: 'EN ENVÍO', estado_nuevo: 'ENTREGADO' },
  ], []])
  expect(eventos.map(e => e.titulo)).toEqual(['Despachado', 'Pedido registrado', 'Pedido registrado'])
  expect(eventos[0]).toMatchObject({ pedidoId: 10, codigo: 'QA-10', usuario: 'Operador de prueba' })
  expect(movimientosRecientes([], [])).toEqual([])
})

it('muestra los tres movimientos recientes de la tarjeta y conserva altas si falta historial', () => {
  const pedidos = Array.from({ length: 8 }, (_, i) => ({ id: i, created_at: '2026-10-01T10:00:00Z' }))
  expect(movimientosRecientes(pedidos, []).length).toBe(3)
})

it('incluye una confirmación humana fechada sin inferirla del estado actual ni de una búsqueda', () => {
  const eventos = movimientosRecientes([{ id: 5, estado_validacion: 'CONFIRMADA' }], [[]], [[
    { id: 1, fecha: '2026-10-01T10:00:00Z', accion_operador: null },
    { id: 2, fecha: '2026-10-01T11:00:00Z', accion_operador: 'CONFIRMO' },
  ]])
  expect(eventos).toHaveLength(1)
  expect(eventos[0]).toMatchObject({ titulo: 'Ubicación confirmada', fecha: '2026-10-01T11:00:00Z', pedidoId: 5 })
  expect(movimientosRecientes([{ id: 5, estado_validacion: 'CONFIRMADA' }], [])).toEqual([])
})

it('el detalle une alta, ubicación y estados sin colisiones ni perder registros del historial', () => {
  const estados = [{ id: 1, estado_anterior: 'EN PREPARACIÓN', estado_nuevo: 'EN ENVÍO', fecha: '2026-10-03T10:00:00Z' }]
  const pedido = { created_at: '2026-10-01T10:00:00Z', intentos: [{ id: 1, accion_operador: 'CONFIRMO', fecha: '2026-10-02T10:00:00Z', direccion_enviada: 'Dirección de prueba' }] }
  const filas = historialEntregas(estados, pedido)
  expect(filas.map(h => h.titulo)).toEqual(['Despachado', 'Ubicación confirmada', 'Pedido creado'])
  expect(new Set(filas.map(h => h.id)).size).toBe(3)
  expect(historialEntregas(estados)).toHaveLength(1)
  expect(pedido.intentos).toHaveLength(1)
})
