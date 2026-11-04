import { beforeEach, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { obtenerTarifa, guardarTarifa, guardarSucursal } from './tarifas.js'
import { api } from './client.js'
import ImportePedido from '../components/ImportePedido.jsx'
vi.mock('./client.js', () => ({ api: { get: vi.fn(), put: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())
it('consulta/guarda tarifa sin enviar identidad y conserva errores', async () => {
  api.get.mockResolvedValue({ data: { tarifa: { precio_km: null } } })
  expect(await obtenerTarifa()).toEqual({ precio_km: null })
  api.put.mockResolvedValue({ data: { tarifa: { precio_km: '200.00' } } })
  await guardarTarifa('200.00')
  expect(api.put).toHaveBeenCalledWith('/tarifas', { precio_km: '200.00' })
  const sucursal = { calle: 'Av. Corrientes', altura: '1234', localidad: 'CABA', provincia: 'Buenos Aires' }
  api.put.mockResolvedValue({ data: { tarifa: { sucursal_direccion: 'Av. Corrientes 1234' } } })
  await expect(guardarSucursal(sucursal)).resolves.toEqual({ sucursal_direccion: 'Av. Corrientes 1234' })
  expect(api.put).toHaveBeenCalledWith('/tarifas/sucursal', sucursal)
  api.put.mockRejectedValue(new Error('Sin permiso'))
  await expect(guardarTarifa('2.00')).rejects.toThrow('Sin permiso')
})
it('importe muestra base, recargo y total; anterior sin monto no inventa cero', () => {
  const html = renderToStaticMarkup(<ImportePedido pedido={{ importe_base:'1000.00',recargo_total:'500.00',importe_total:'1500.00',proxima_visita:'2026-10-27T00:00:00Z' }}/>)
  expect(html).toContain('1.500,00')
  expect(html).toContain('al emisor')
  expect(html).toContain('27/10/2026')
  const pendiente = renderToStaticMarkup(<ImportePedido pedido={{ importe_base:null,importe_total:null }}/>)
  expect(pendiente).toContain('Pendiente')
  expect(pendiente).not.toContain('$0')
})
