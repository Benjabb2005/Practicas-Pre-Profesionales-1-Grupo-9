import { afterEach, expect, it, vi } from 'vitest'
import { conCargaMinima } from './cargaMinima.js'

afterEach(() => vi.useRealTimers())

it('permite terminar el cambio de apartado a los 1200 ms sin esperar el mínimo largo', async () => {
  vi.useFakeTimers()
  const fin = vi.fn()
  const pendiente = conCargaMinima(Promise.resolve('entregas'), 1200).then(fin)
  await vi.advanceTimersByTimeAsync(1199)
  expect(fin).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1)
  await pendiente
  expect(fin).toHaveBeenCalledWith('entregas')
})

it('mantiene una carga rápida 3600 ms para completar el recorrido de 2800 ms', async () => {
  vi.useFakeTimers()
  const fin = vi.fn()
  const respuesta = { pedido: { id: 1 } }
  const pendiente = conCargaMinima(Promise.resolve(respuesta)).then(fin)
  await vi.advanceTimersByTimeAsync(3599)
  expect(fin).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1)
  await pendiente
  expect(fin).toHaveBeenCalledWith(respuesta)
})

it('no agrega una pausa al terminar una solicitud que ya tarda más que el mínimo', async () => {
  vi.useFakeTimers()
  let resolver
  const solicitud = new Promise(resolve => { resolver = resolve })
  const fin = vi.fn()
  const pendiente = conCargaMinima(solicitud).then(fin)
  await vi.advanceTimersByTimeAsync(5000)
  expect(fin).not.toHaveBeenCalled()
  resolver('confirmado')
  await pendiente
  expect(fin).toHaveBeenCalledWith('confirmado')
})

it('informa fallos inmediatamente y cancela el temporizador', async () => {
  vi.useFakeTimers()
  const fallo = new Error('Sin conexión')
  await expect(conCargaMinima(Promise.reject(fallo))).rejects.toBe(fallo)
  expect(vi.getTimerCount()).toBe(0)
})
