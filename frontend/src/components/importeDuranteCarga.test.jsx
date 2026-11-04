import { afterEach, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { importeDuranteCarga } from './importeSugerido.js'
import { puntoPrevisualizado } from './direccion.js'
import { crearBuscadorTentativo } from './buscadorTentativo.js'
import { sugerirImporteDuranteCarga } from '../api/pedidos.js'
import { api } from '../api/client.js'
import SugerenciaImporteCarga from './SugerenciaImporteCarga.jsx'

vi.mock('../api/client.js', () => ({ api: { post: vi.fn() } }))
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })
const sugerencia = { disponible: true, distancia_km: 2.4, precio_km: '100.00', importe_sugerido: '240.00' }

it('precarga y actualiza sólo el importe automático; manual y borrado explícito se conservan', () => {
  expect(importeDuranteCarga(null, sugerencia)).toBe('240.00')
  expect(importeDuranteCarga(null, { ...sugerencia, importe_sugerido: '450.00' })).toBe('450.00')
  expect(importeDuranteCarga('300,50', sugerencia)).toBe('300,50')
  expect(importeDuranteCarga('', sugerencia)).toBe('')
  expect(importeDuranteCarga(null, null)).toBe('')
  expect(importeDuranteCarga('300,50', null)).toBe('300,50')
  expect(importeDuranteCarga(null, { disponible: false })).toBe('')
  expect(importeDuranteCarga(null, { ...sugerencia, importe_sugerido: '0.00' })).toBe('')
})

it('sólo estima con punto único o elección explícita de un resultado vigente', () => {
  const uno = { indice: 0, latitud: -34, longitud: -58 }, dos = { indice: 1, latitud: -35, longitud: -59 }
  const datos = { candidatos: [uno, dos] }, previo = { fase: 'lista', datos }
  expect(puntoPrevisualizado({ fase: 'lista', datos: { candidatos: [uno] } }, { datos: null, indice: null })).toBe(uno)
  expect(puntoPrevisualizado(previo, { datos: null, indice: null })).toBeNull()
  expect(puntoPrevisualizado(previo, { datos, indice: 1 })).toBe(dos)
  expect(puntoPrevisualizado(previo, { datos: { ...datos }, indice: 1 })).toBeNull()
  expect(puntoPrevisualizado({ fase: 'buscando', datos }, { datos, indice: 1 })).toBeNull()
})

it('consulta el importe con coordenadas y señal de cancelación, sin guardar un pedido', async () => {
  const punto = { latitud: -34.6, longitud: -58.4 }, signal = new AbortController().signal
  api.post.mockResolvedValue({ data: sugerencia })
  await expect(sugerirImporteDuranteCarga(punto, signal)).resolves.toEqual(sugerencia)
  expect(api.post).toHaveBeenCalledWith('/pedidos/importe-sugerido', punto, { signal })
  expect(api.post).toHaveBeenCalledTimes(1)
})

it('descarta la respuesta de tarifa para un candidato anterior aunque llegue después de la nueva', async () => {
  vi.useFakeTimers()
  const pendientes = [], estados = []
  const buscar = (punto, signal) => new Promise(resolve => pendientes.push({ punto, signal, resolve }))
  const consulta = crearBuscadorTentativo({ buscar, describirError: e => e.message, alCambiar: e => estados.push(e), demora: 0 })
  consulta.programar({ latitud: -34, longitud: -58 }, 'direccion-a')
  await vi.advanceTimersByTimeAsync(0)
  consulta.programar({ latitud: -35, longitud: -59 }, 'direccion-b')
  await vi.advanceTimersByTimeAsync(0)
  expect(pendientes[0].signal.aborted).toBe(true)
  pendientes[1].resolve(sugerencia)
  await vi.advanceTimersByTimeAsync(0)
  pendientes[0].resolve({ ...sugerencia, importe_sugerido: '999.00' })
  await vi.advanceTimersByTimeAsync(0)
  expect(estados.filter(e => e.fase === 'lista')).toEqual([{ clave: 'direccion-b', fase: 'lista', datos: sugerencia, mensaje: '' }])
  consulta.cancelar()
})

it('cancelar al guardar o limpiar impide una precarga tardía', async () => {
  vi.useFakeTimers()
  let resolver
  const estados = []
  const consulta = crearBuscadorTentativo({ buscar: () => new Promise(resolve => { resolver = resolve }), describirError: e => e.message, alCambiar: e => estados.push(e), demora: 0 })
  consulta.programar({ latitud: 0, longitud: 0 }, 'actual')
  await vi.advanceTimersByTimeAsync(0)
  consulta.cancelar(); resolver(sugerencia)
  await vi.advanceTimersByTimeAsync(0)
  expect(estados.some(e => e.fase === 'lista')).toBe(false)
})

it('explica selección de candidato, conserva manual y permite aplicar sugerencia', () => {
  const html = consulta => renderToStaticMarkup(<SugerenciaImporteCarga consulta={{ reintentar() {}, ...consulta }} ambiguo manual onUsar={() => {}}/>)
  expect(html({ fase: 'sin-punto' })).toContain('Elegí una ubicación')
  expect(html({ fase: 'buscando' })).toContain('Calculando importe')
  expect(html({ fase: 'lista', datos: sugerencia })).toContain('Estimado:')
  expect(html({ fase: 'lista', datos: sugerencia })).toContain('Usar sugerido')
  expect(html({ fase: 'lista', datos: { disponible: false, motivo: 'Falta tarifa.' } })).toContain('Falta tarifa.')
  expect(html({ fase: 'error', mensaje: 'Sin conexión.' })).toContain('Reintentar')
})
