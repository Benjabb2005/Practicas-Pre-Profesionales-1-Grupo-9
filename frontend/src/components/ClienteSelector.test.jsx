import { expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import ClienteSelector from './ClienteSelector.jsx'
import { listarClientes } from '../api/clientes.js'
import { api } from '../api/client.js'

vi.mock('../api/client.js', () => ({ api: { get: vi.fn() } }))

it('al abrir muestra la búsqueda y el estado de la rama de referencia, sin precargar clientes', () => {
  const html = renderToStaticMarkup(<ClienteSelector cliente={null} onSeleccionar={() => {}}/>)
  expect(html).toContain('Escribí para filtrar clientes')
  expect(html).toContain('La lista se actualiza mientras escribís.')
  expect(html).not.toContain('<li')
  expect(html).not.toContain('Paginación')
  expect(api.get).not.toHaveBeenCalled()
})

it('con cliente seleccionado conserva buscador y aviso de referencia, y permite cambiar', () => {
  const html = renderToStaticMarkup(<ClienteSelector cliente={{ id: 1, nombre: 'Cliente sintético', dni: '10000001' }} onSeleccionar={() => {}}/>)
  expect(html).toContain('Cliente frecuente seleccionado. Sus datos no se modificarán.')
  expect(html).toContain('Cambiar')
  expect(html).toContain('cliente-busqueda')
  expect(html).not.toContain('<li')
})

it('la búsqueda conserva filtros de la API y admite cancelación', async () => {
  const signal = new AbortController().signal
  api.get.mockResolvedValue({ data: { clientes: [] } })
  await expect(listarClientes('cliente', signal)).resolves.toEqual([])
  expect(api.get).toHaveBeenCalledWith('/clientes', { params: { busqueda: 'cliente' }, signal })
})
