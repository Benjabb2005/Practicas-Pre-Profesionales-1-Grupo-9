import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, it, vi } from 'vitest'
import ProtectedRoute from './ProtectedRoute.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import ChoferPedidosPage from '../pages/ChoferPedidosPage.jsx'

const estado = vi.hoisted(() => ({ usuario: null, desde: '/' }))

vi.mock('./useAuth', () => ({ useAuth: () => ({ usuario: estado.usuario, cargando: false }) }))
// Esta prueba cubre permisos/navegación sin DOM ni Leaflet; el mapa real se
// verifica en el navegador con los pedidos sintéticos.
vi.mock('../components/MapPreview.jsx', () => ({ default: () => createElement('div', null, 'Mapa de prueba') }))
vi.mock('react-router-dom', () => ({
  Navigate: ({ to }) => createElement('a', { href: to }, 'Destino'),
  useLocation: () => ({ pathname: '/', state: { desde: estado.desde } }),
  useNavigate: () => vi.fn(),
}))

beforeEach(() => {
  estado.usuario = { rol: 'CHOFER', nombre: 'Chofer de prueba' }
  estado.desde = '/'
})

it('redirige al chofer fuera del tablero hacia su pantalla, sin volver a la ruta rechazada', () => {
  const html = renderToStaticMarkup(<ProtectedRoute roles={['ADMINISTRADOR', 'OPERADOR']}><p>Tablero</p></ProtectedRoute>)
  expect(html).toContain('href="/chofer"')
  expect(html).not.toContain('Tablero')
})

it('recuperar la sesión de chofer desde login conduce a /chofer', () => {
  expect(renderToStaticMarkup(<LoginPage/>)).toContain('href="/chofer"')
})

it('el operador no vuelve a una ruta de chofer guardada antes del login', () => {
  estado.usuario = { rol: 'OPERADOR' }
  estado.desde = '/chofer'
  expect(renderToStaticMarkup(<LoginPage/>)).toContain('href="/"')
})

it('la ruta autorizada del chofer renderiza su pantalla', () => {
  const html = renderToStaticMarkup(<ProtectedRoute roles={['CHOFER']}><ChoferPedidosPage onLogout={() => {}}/></ProtectedRoute>)
  expect(html).toContain('Cargando tus pedidos')
  expect(html).not.toContain('Carlos Gómez')
  expect(html).toContain('Cerrar sesión')
})
