import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import PedidoGuardado from './PedidoGuardado.jsx'
import PedidoInformacion from './PedidoInformacion.jsx'
import ProcesoCarga from './ProcesoCarga.jsx'

it('confirma el pedido recibido y distingue guardado de confirmación de ubicación', () => {
  const html = renderToStaticMarkup(<MemoryRouter><PedidoGuardado pedido={{ id: 42, codigo: 'QA-42', estado: 'EN STOCK' }} onContinuar={() => {}}/></MemoryRouter>)
  expect(html).toContain('Tu pedido ya está guardado.')
  expect(html).toContain('QA-42')
  expect(html).toContain('EN STOCK')
  expect(html).toContain('href="/pedidos/42"')
  expect(html).toContain('confirmá la ubicación antes de despachar')
  expect(html).not.toContain('Ubicación confirmada')
})

it('la carga tiene recorrido y barra decorativa sin porcentaje ni éxito anticipado', () => {
  const html = renderToStaticMarkup(<ProcesoCarga pantalla titulo="Guardando pedido"/>)
  expect(html).toContain('<dialog')
  expect(html).toContain('process-parcel')
  expect(html).toContain('process-motion-enabled')
  expect(html).toContain('Pausar animación')
  expect(html).toContain('process-loading-track')
  expect(html).toContain('role="status"')
  expect(html).not.toContain('aria-valuenow')
  expect(html).not.toContain('ya está guardado')
})

it('el resumen usa los campos guardados sin inventar contacto, chofer ni importe', () => {
  const html = renderToStaticMarkup(<PedidoInformacion pedido={{ cliente_nombre: 'Cliente de prueba', calle: 'Calle de prueba', altura: '123', canal_origen: 'MANUAL' }}/>)
  expect(html).toContain('Cliente de prueba')
  expect(html).toContain('Calle de prueba 123')
  expect(html).toContain('Carga manual')
  expect(html).toContain('Sin asignar')
  expect(html).not.toContain('href="tel:')
})
