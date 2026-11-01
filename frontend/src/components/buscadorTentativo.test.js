import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { crearBuscadorTentativo } from './buscadorTentativo.js'
import { claveBusqueda, direccionBuscable } from './direccion.js'
import { api } from '../api/client'
import { previsualizarUbicacion } from '../api/pedidos'

vi.mock('../api/client', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

function armar(buscar) {
  const estados = []
  const buscador = crearBuscadorTentativo({ buscar, describirError: (f) => f.message, alCambiar: (e) => estados.push(e) })
  return { buscador, estados }
}

// Una consulta que se resuelve a mano, para controlar el orden de las respuestas.
function consultaManual() {
  const pendientes = []
  const buscar = vi.fn((direccion, signal) => new Promise((resolver, rechazar) => pendientes.push({ direccion, signal, resolver, rechazar })))
  return { buscar, pendientes }
}

describe('búsqueda tentativa', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('espera 500 ms y consulta una sola vez ante cambios rápidos', async () => {
    const { buscar } = consultaManual()
    const { buscador } = armar(buscar)

    buscador.programar({ calle: 'A' }, 'a')
    await vi.advanceTimersByTimeAsync(300)
    buscador.programar({ calle: 'Av' }, 'av')
    await vi.advanceTimersByTimeAsync(300)
    expect(buscar).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(200)
    expect(buscar).toHaveBeenCalledTimes(1)
    expect(buscar.mock.calls[0][0]).toEqual({ calle: 'Av' })
  })

  it('cancela la consulta en vuelo y descarta su respuesta si cambia la dirección', async () => {
    const { buscar, pendientes } = consultaManual()
    const { buscador, estados } = armar(buscar)

    buscador.programar({ calle: 'vieja' }, 'vieja')
    await vi.advanceTimersByTimeAsync(500)
    buscador.programar({ calle: 'nueva' }, 'nueva')
    expect(pendientes[0].signal.aborted).toBe(true)

    pendientes[0].resolver({ resultado: 'APPROXIMATE', candidatos: [{ indice: 0 }] })
    await vi.advanceTimersByTimeAsync(0)
    expect(estados.some((e) => e.fase === 'lista')).toBe(false)
  })

  it('una respuesta atrasada de la búsqueda anterior no pisa a la nueva', async () => {
    const { buscar, pendientes } = consultaManual()
    const { buscador, estados } = armar(buscar)

    buscador.programar({ calle: 'uno' }, 'uno')
    await vi.advanceTimersByTimeAsync(500)
    buscador.programar({ calle: 'dos' }, 'dos')
    await vi.advanceTimersByTimeAsync(500)
    pendientes[1].resolver({ resultado: 'APPROXIMATE', candidatos: [{ indice: 0, direccion: 'dos' }] })
    await vi.advanceTimersByTimeAsync(0)
    pendientes[0].resolver({ resultado: 'APPROXIMATE', candidatos: [{ indice: 0, direccion: 'uno' }] })
    await vi.advanceTimersByTimeAsync(0)

    const listas = estados.filter((e) => e.fase === 'lista')
    expect(listas).toHaveLength(1)
    expect(listas[0].clave).toBe('dos')
  })

  it('cancelar impide que una consulta pendiente llegue a dispararse', async () => {
    const { buscar } = consultaManual()
    const { buscador } = armar(buscar)

    buscador.programar({ calle: 'x' }, 'x')
    buscador.cancelar()
    await vi.advanceTimersByTimeAsync(1000)

    expect(buscar).not.toHaveBeenCalled()
  })

  it('informa el error del servidor y permite reintentar de inmediato', async () => {
    const buscar = vi.fn()
      .mockRejectedValueOnce(new Error('No pudimos contactar al servidor.'))
      .mockResolvedValueOnce({ resultado: 'ZERO_RESULTS', candidatos: [] })
    const { buscador, estados } = armar(buscar)

    buscador.programar({ calle: 'x' }, 'x')
    await vi.advanceTimersByTimeAsync(500)
    expect(estados.at(-1)).toMatchObject({ fase: 'error', mensaje: 'No pudimos contactar al servidor.' })

    buscador.programar({ calle: 'x' }, 'x', { inmediato: true })
    await vi.advanceTimersByTimeAsync(0)
    expect(estados.at(-1)).toMatchObject({ fase: 'lista', datos: { resultado: 'ZERO_RESULTS' } })
  })
})

describe('datos de la dirección para buscar', () => {
  it('exige calle, altura y provincia; vaciar un campo la vuelve no buscable', () => {
    const completa = { calle: 'Av. Corrientes', altura: '1234', provincia: 'Buenos Aires' }
    expect(direccionBuscable(completa)).toBe(true)
    expect(direccionBuscable({ ...completa, altura: '  ' })).toBe(false)
    expect(direccionBuscable({ ...completa, calle: '' })).toBe(false)
    expect(direccionBuscable({ ...completa, provincia: '' })).toBe(false)
    expect(direccionBuscable({})).toBe(false)
  })

  it('la clave cambia con los campos que mueven el punto y no con piso ni entre calles', () => {
    const base = { calle: 'Av. Corrientes', altura: '1234', provincia: 'CABA', localidad: 'CABA', codigo_postal: '' }
    expect(claveBusqueda({ ...base, piso_depto: '4 B', entre_calles: 'X y Z' })).toBe(claveBusqueda(base))
    expect(claveBusqueda({ ...base, calle: ' av. corrientes ' })).toBe(claveBusqueda(base))
    expect(claveBusqueda({ ...base, altura: '1235' })).not.toBe(claveBusqueda(base))
    expect(claveBusqueda({ ...base, localidad: 'Rosario' })).not.toBe(claveBusqueda(base))
  })
})

describe('api de previsualización', () => {
  it('consulta el endpoint sin pedido y pasa la señal de cancelación', async () => {
    const direccion = { calle: 'Av. Corrientes', altura: '1234', provincia: 'CABA' }
    const controlador = new AbortController()
    api.post.mockResolvedValue({ data: { resultado: 'APPROXIMATE', candidatos: [] } })

    await expect(previsualizarUbicacion(direccion, controlador.signal)).resolves.toEqual({ resultado: 'APPROXIMATE', candidatos: [] })
    expect(api.post).toHaveBeenCalledWith('/pedidos/previsualizar-ubicacion', direccion, { signal: controlador.signal })
  })
})
