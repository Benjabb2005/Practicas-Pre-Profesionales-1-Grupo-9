import { describe, expect, it } from 'vitest'
import {
  direccionDePedido,
  fechaVisible,
  parametrosDeFiltros,
  resumirPedidos,
  sinFiltros,
} from './pedidoListado'

describe('listado de pedidos', () => {
  it('arma sólo los filtros cargados y recorta el texto de cliente', () => {
    expect(parametrosDeFiltros({
      estado: 'EN STOCK',
      cliente: '  Juan Pérez  ',
      fecha_desde: '',
      fecha_hasta: '2026-10-21',
    })).toEqual({
      estado: 'EN STOCK',
      cliente: 'Juan Pérez',
      fecha_hasta: '2026-10-21',
    })
  })

  it('reconoce cuándo no hay filtros activos', () => {
    expect(sinFiltros({ estado: '', cliente: '  ', fecha_desde: '', fecha_hasta: '' })).toBe(true)
    expect(sinFiltros({ estado: 'PAGADO' })).toBe(false)
  })

  it('resume los pedidos por estado sin mezclar entregados con pagados', () => {
    expect(resumirPedidos([
      { estado: 'EN STOCK' },
      { estado: 'EN PREPARACIÓN' },
      { estado: 'EN ENVÍO' },
      { estado: 'ENTREGADO' },
      { estado: 'PAGADO' },
    ])).toEqual({
      total: 5,
      enPreparacion: 1,
      enEnvio: 1,
      entregadosOPagados: 2,
    })
    expect(resumirPedidos()).toEqual({
      total: 0,
      enPreparacion: 0,
      enEnvio: 0,
      entregadosOPagados: 0,
    })
  })

  it('usa la dirección original o compone calle y altura sin inventar datos', () => {
    expect(direccionDePedido({ direccion_original: 'Av. Corrientes 1234' })).toBe('Av. Corrientes 1234')
    expect(direccionDePedido({ direccion_original: '', calle: 'Av. Corrientes', altura: '1234' })).toBe('Av. Corrientes 1234')
    expect(direccionDePedido({})).toBe('Sin dirección')
  })

  it('formatea la fecha y no inventa una cuando el dato falta o es inválido', () => {
    expect(fechaVisible('2026-10-21T12:00:00.000Z')).not.toBe('')
    expect(fechaVisible(null)).toBe('')
    expect(fechaVisible('no-es-una-fecha')).toBe('')
  })
})
