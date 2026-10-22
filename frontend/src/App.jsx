import { NavLink, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import Icon from './components/Icon.jsx'
import DriverApp from './DriverApp.jsx'
import LoginPage from './pages/LoginPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import PedidosCargaPage from './pages/PedidosCargaPage.jsx'
import PedidosListadoPage from './pages/PedidosListadoPage.jsx'
import PedidosRevisionPage from './pages/PedidosRevisionPage.jsx'
import PedidoRevisionDetallePage from './pages/PedidoRevisionDetallePage.jsx'
import ClientesPage from './pages/ClientesPage.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import { useAuth } from './auth/useAuth'

const ROL_ETIQUETA = {
  ADMINISTRADOR: 'Administrador',
  OPERADOR: 'Operador',
  CHOFER: 'Chofer',
}

function Brand() {
  return <div className="brand"><span className="brand-badge"><Icon name="truck" size={20}/></span><span><b>MandáTodo</b><small>Sistema Logístico</small></span></div>
}

function Sidebar({ rol, onLogout }) {
  const items = [
    { to: '/', label: 'Tablero de Envíos', icon: 'grid', end: true },
    { to: '/form', label: 'Cargar Pedido', icon: 'plus' },
    { to: '/pedidos/revision', label: 'Revisión de Direcciones', icon: 'eye' },
    { label: 'Rutas', icon: 'route', soon: true },
    { to: '/clientes', label: 'Clientes', icon: 'users' },
  ]
  if (rol === 'ADMINISTRADOR') {
    items.splice(2, 0, { to: '/usuarios', label: 'Usuarios', icon: 'users' })
  }

  return <aside className="sidebar">
    <Brand/>
    <nav className="navigation" aria-label="Navegación principal">
      {items.map((item) => item.soon
        ? <button key={item.label} className="nav-item" disabled><Icon name={item.icon}/><span>{item.label}</span><small>PRÓX.</small></button>
        : <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon name={item.icon}/><span>{item.label}</span></NavLink>)}
    </nav>
    <div className="profile"><span className="avatar">{rol === 'ADMINISTRADOR' ? 'A' : 'O'}</span><span><b>{rol === 'ADMINISTRADOR' ? 'Administración' : 'Operaciones'}</b><small>{ROL_ETIQUETA[rol] || rol}</small></span><button className="logout" onClick={onLogout} title="Cerrar sesión" aria-label="Cerrar sesión"><Icon name="logout" size={14}/></button></div>
  </aside>
}

function OperatorLayout() {
  const { usuario, logout } = useAuth()
  const navegar = useNavigate()
  function salir() {
    logout()
    navegar('/login', { replace: true })
  }
  return <div className="operator-app"><Sidebar rol={usuario.rol} onLogout={salir}/><div className="workspace"><Outlet/></div></div>
}

function ChoferRuta() {
  const { logout } = useAuth()
  const navegar = useNavigate()
  return <DriverApp onLogout={() => { logout(); navegar('/login', { replace: true }) }}/>
}

function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route element={<ProtectedRoute roles={['ADMINISTRADOR', 'OPERADOR']}><OperatorLayout/></ProtectedRoute>}>
      <Route index element={<PedidosListadoPage/>}/>
      <Route path="form" element={<PedidosCargaPage/>}/>
      <Route path="pedidos/revision" element={<PedidosRevisionPage/>}/>
      <Route path="pedidos/:id/revision" element={<PedidoRevisionDetallePage/>}/>
      <Route path="clientes" element={<ClientesPage/>}/>
      <Route path="usuarios" element={<ProtectedRoute roles={['ADMINISTRADOR']}><UsersPage/></ProtectedRoute>}/>
    </Route>
    <Route path="/chofer" element={<ProtectedRoute roles={['CHOFER']}><ChoferRuta/></ProtectedRoute>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>
}

export default App
