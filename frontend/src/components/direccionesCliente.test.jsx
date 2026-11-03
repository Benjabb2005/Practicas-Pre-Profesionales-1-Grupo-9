import { expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { camposDeDireccionGuardada, etiquetaDireccionGuardada } from './direccionesCliente.js'
import { DIRECCION_VACIA } from './direccion.js'
import { listarDireccionesCliente } from '../api/clientes.js'
import { api } from '../api/client.js'
import DireccionesCliente from './DireccionesCliente.jsx'

vi.mock('../api/client.js', () => ({ api: { get: vi.fn() } }))

it('reutiliza sólo campos de dirección y no arrastra confirmación, coordenadas ni otro pedido/cliente', () => {
  const guardada = { clave: 'clave', calle: 'Prueba', altura: '123', piso_depto: '1 A', entre_calles: 'Primera y Segunda', cliente_id: 99, pedido_id: 88, estado_validacion: 'CONFIRMADA', latitud: -34, longitud: -58, direccion_original: 'Original anterior' }
  const formulario = camposDeDireccionGuardada(guardada)
  expect(formulario).toEqual({ ...DIRECCION_VACIA, calle: 'Prueba', altura: '123', piso_depto: '1 A', entre_calles: 'Primera y Segunda' })
  formulario.altura = '456'
  expect(guardada.altura).toBe('123')
})

it('otra dirección reinicia todos los campos y no conserva el domicilio anterior', () => {
  const primero = camposDeDireccionGuardada({ calle: 'Anterior', altura: '123' })
  expect(camposDeDireccionGuardada(null)).toEqual(DIRECCION_VACIA)
  expect(camposDeDireccionGuardada({ calle: 'Nueva', altura: '456' }).calle).toBe('Nueva')
  expect(primero.calle).toBe('Anterior')
})

it('distingue pisos/departamentos y referencias en las opciones', () => {
  expect(etiquetaDireccionGuardada({ calle: 'Prueba', altura: '123', piso_depto: '2 B', localidad: 'Localidad', entre_calles: 'Primera y Segunda' }))
    .toBe('Prueba · 123 · 2 B · Localidad · entre Primera y Segunda')
})

it('consulta únicamente al cliente elegido y permite cancelar al cambiar de cliente', async () => {
  const signal = new AbortController().signal
  const direcciones = [{ clave: 'a', calle: 'Prueba' }]
  api.get.mockResolvedValue({ data: { direcciones } })
  await expect(listarDireccionesCliente(12, signal)).resolves.toEqual(direcciones)
  expect(api.get).toHaveBeenCalledWith('/clientes/12/direcciones', { signal })
})

it('muestra carga sin precargar una dirección automáticamente', () => {
  const onChange = vi.fn()
  expect(renderToStaticMarkup(<DireccionesCliente clienteId={1} valor="" onChange={onChange}/>)).toContain('Buscando direcciones')
  expect(onChange).not.toHaveBeenCalled()
})
