import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AppNavigation from './AppNavigation.jsx'
import ProcesoCarga from './ProcesoCarga.jsx'

function navigation(rol) {
  return renderToStaticMarkup(<MemoryRouter initialEntries={['/form']}><AppNavigation usuario={{ nombre: 'Cuenta de prueba', rol }} onLogout={() => {}}/></MemoryRouter>)
}

describe('navegación del rediseño', () => {
  it('conserva todos los accesos operativos y no ofrece administración al operador', () => {
    const html = navigation('OPERADOR')
    for (const path of ['/', '/form', '/pedidos/revision', '/asignaciones', '/clientes']) expect(html).toContain(`href="${path}"`)
    expect(html).not.toContain('href="/usuarios"')
    expect(html).not.toContain('href="/tarifas"')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('aria-label="Cerrar sesión"')
    expect(html).toContain('Modo oscuro')
  })
  it('conserva usuarios y configuración de sucursal y tarifa para administrador', () => {
    const html = navigation('ADMINISTRADOR')
    expect(html).toContain('href="/usuarios"')
    expect(html).toContain('href="/tarifas"')
    expect(html).toContain('Configuración de envíos')
    expect(html).toContain('disabled=""')
  })
  it('anuncia la operación real y no presenta progreso ni éxito inventados', () => {
    const html = renderToStaticMarkup(<ProcesoCarga pantalla titulo="Guardando pedido" detalle="Esperando al servidor"/>)
    expect(html).toContain('role="status"')
    expect(html).toContain('Guardando pedido')
    expect(html).toContain('Esperando al servidor')
    expect(html).not.toContain('aria-valuenow')
    expect(html).not.toContain('guardado con éxito')
  })
})
