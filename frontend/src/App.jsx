import { NavLink, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import Icon from './components/Icon.jsx'
import DriverApp from './DriverApp.jsx'
import LoginPage from './pages/LoginPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import PedidosCargaPage from './pages/PedidosCargaPage.jsx'
import PedidosRevisionPage from './pages/PedidosRevisionPage.jsx'
import PedidoRevisionDetallePage from './pages/PedidoRevisionDetallePage.jsx'
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
    { label: 'Clientes', icon: 'users', soon: true },
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

function PageHeader({ eyebrow, title, subtitle, action, onAction }) {
  return <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="subtitle">{subtitle}</p></div>{action && <button className="button button-primary header-action" onClick={onAction}><Icon name="plus"/> {action}</button>}</header>
}

function StatCard({ icon, tone, value, label }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}><Icon name={icon} size={19}/></span><div><strong>{value}</strong><small>{label}</small></div></article>
}

function EmptyState({ onCreate }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="box" size={22}/></span><strong>Todavía no hay pedidos cargados</strong><p>Los pedidos que cargues aparecerán en esta tabla.</p><button className="button button-outline" onClick={onCreate}>Cargar primer pedido</button></div>
}

function Board() {
  const navegar = useNavigate()
  return <main className="main-content board-page">
    <PageHeader eyebrow="Centro de operaciones" title="Tablero General de Despacho" subtitle="Vista general de la operación de hoy." action="Cargar nuevo pedido" onAction={() => navegar('/form')}/>
    <section className="stats-grid" aria-label="Resumen de envíos">
      <StatCard icon="box" tone="blue" value="0" label="Pedidos Registrados"/>
      <StatCard icon="grid" tone="amber" value="0" label="En Preparación"/>
      <StatCard icon="truck" tone="purple" value="0" label="En Ruta de Envío"/>
      <StatCard icon="check" tone="green" value="0" label="Entregados y Pagados"/>
    </section>
    <section className="shipments-card">
      <div className="shipments-heading"><div><h2>Envíos del Día</h2><p>Seguimiento de pedidos cargados</p></div><button className="button button-outline group-button"><Icon name="link" size={14}/> Agrupar envíos lejanos automáticamente</button></div>
      <div className="filters"><label>Estado<select defaultValue="all"><option value="all">Todos los estados</option><option>En stock</option><option>En preparación</option><option>En envío</option><option>Entregado</option><option>Pagado</option></select></label><label>Chofer asignado<select defaultValue="all"><option value="all">Todos los choferes</option><option>Sin asignar</option><option>Chofer 1</option><option>Chofer 2</option></select></label></div>
      <EmptyState onCreate={() => navegar('/form')}/>
    </section>
  </main>
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
      <Route index element={<Board/>}/>
      <Route path="form" element={<PedidosCargaPage/>}/>
      <Route path="pedidos/revision" element={<PedidosRevisionPage/>}/>
      <Route path="pedidos/:id/revision" element={<PedidoRevisionDetallePage/>}/>
      <Route path="usuarios" element={<ProtectedRoute roles={['ADMINISTRADOR']}><UsersPage/></ProtectedRoute>}/>
    </Route>
    <Route path="/chofer" element={<ProtectedRoute roles={['CHOFER']}><ChoferRuta/></ProtectedRoute>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>
}

export default App
