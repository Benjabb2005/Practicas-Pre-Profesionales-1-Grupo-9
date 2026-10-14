import { NavLink, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import Icon from './components/Icon.jsx'
import DriverApp from './DriverApp.jsx'
import LoginPage from './pages/LoginPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
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

function Field({ label, placeholder, required, type = 'text', className = '' }) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return <label className={`form-field ${className}`} htmlFor={id}><span>{label}{required && <b> *</b>}</span><input id={id} type={type} autoComplete="off" placeholder={placeholder}/></label>
}

function SelectField({ label, children, className = '' }) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return <label className={`form-field ${className}`} htmlFor={id}><span>{label}</span><select id={id}>{children}</select></label>
}

function OrderForm() {
  const navegar = useNavigate()
  return <main className="main-content form-page">
    <PageHeader eyebrow="Nuevo envío" title="Carga Manual de Pedido" subtitle="Completá los datos y validá la ubicación antes de despachar." action="Ver tablero" onAction={() => navegar('/')}/>
    <div className="order-layout">
      <section className="panel order-panel">
        <div className="section-heading"><span className="step-number">1</span><div><h2>Datos del cliente y envío</h2><p>Los campos marcados con * son obligatorios.</p></div></div>
        <div className="customer-search"><label htmlFor="customer-search">Cliente frecuente</label><div className="search-input"><Icon name="search" size={15}/><input id="customer-search" autoComplete="off" placeholder="Buscar por DNI, email o teléfono"/></div></div>
        <div className="form-divider"><span>Datos del cliente</span></div>
        <div className="fields-grid customer-fields">
          <Field label="Nombre" placeholder="Ej. María" required/><Field label="Apellido" placeholder="Ej. González" required/>
          <Field label="DNI" placeholder="Documento"/><Field label="Teléfono" placeholder="11 0000 0000" type="tel"/>
          <Field label="Email" placeholder="cliente@email.com" type="email" className="span-2"/>
        </div>
        <div className="form-divider address-divider"><span>Dirección de entrega</span></div>
        <div className="fields-grid address-fields">
          <Field label="Calle" placeholder="Ej. Av. Corrientes" required className="street-field"/><Field label="Altura" placeholder="1234" required/>
          <Field label="Piso/Depto" placeholder="Ej. 4° B"/><Field label="Localidad" placeholder="Ej. CABA" required/><Field label="Código Postal" placeholder="Ej. C1043" required/>
          <Field label="Entre calles" placeholder="Opcional" className="span-2"/>
          <label className="form-field span-2" htmlFor="delivery-notes"><span>Notas / Instrucciones de entrega</span><textarea id="delivery-notes" placeholder="Ej. Tocar timbre B, dejar en recepción..." rows="3"/></label>
          <SelectField label="Chofer asignado" className="driver-field"><option>Sin asignar</option><option>Chofer 1</option><option>Chofer 2</option><option>Chofer 3</option></SelectField>
        </div>
      </section>
      <aside className="validation-column">
        <section className="panel geo-panel">
          <div className="section-heading"><span className="step-number">2</span><div><h2>Validación Geográfica</h2><p>La ubicación se actualiza en tiempo real.</p></div></div>
          <div className="map-placeholder"><div className="map-grid"/><div className="map-empty"><Icon name="pin" size={21}/><span>Completá la dirección para<br/>visualizar su ubicación</span></div></div>
          <div className="address-alert"><Icon name="alert" size={15}/><div><b>La altura falta o no es válida</b><span>Corregí los campos para habilitar el despacho automático.</span></div></div>
          <button className="button confirm-button" disabled><Icon name="pin" size={14}/> Confirmar Ubicación y Habilitar Despacho</button>
          <button className="button button-outline correct-button" type="button">Corregir Datos</button>
        </section>
        <div className="safe-note"><span><Icon name="check" size={12}/></span><div><b>Despacho seguro</b><small>La validación evita direcciones incompletas y reduce entregas fallidas.</small></div></div>
      </aside>
    </div>
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
      <Route path="form" element={<OrderForm/>}/>
      <Route path="usuarios" element={<ProtectedRoute roles={['ADMINISTRADOR']}><UsersPage/></ProtectedRoute>}/>
    </Route>
    <Route path="/chofer" element={<ProtectedRoute roles={['CHOFER']}><ChoferRuta/></ProtectedRoute>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>
}

export default App
