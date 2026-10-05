import { useState } from 'react'
import './App.css'
import DriverApp from './DriverApp.jsx'

const DEMO_ACCOUNTS = {
  'admin@mandatodo.com': 'Administrador',
  'operador@mandatodo.com': 'Operador',
  'chofer@mandatodo.com': 'Chofer',
}
const DEMO_PASSWORD = 'demo1234'

function Icon({ name, size = 16 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const paths = {
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7.5" cy="19" r="1.7"/><circle cx="18" cy="19" r="1.7"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    route: <><circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h4a4 4 0 0 1 4 4v4a4 4 0 0 0 4 4"/></>,
    users: <><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20"/><circle cx="10" cy="8" r="3.5"/><path d="M20 20v-1.5a3.5 3.5 0 0 0-2.7-3.4M16 4.7a3.5 3.5 0 0 1 0 6.6"/></>,
    box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4.3 7.7 7.7 4.4 7.7-4.4M12 21v-8.9M8 5.2l8 4.6"/></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    alert: <><path d="M10.3 4.3 2.7 18a2 2 0 0 0 1.8 3h15a2 2 0 0 0 1.8-3L13.7 4.3a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1 0l2-2A5 5 0 0 0 12 3.9l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
  }
  return <svg {...common}>{paths[name] || null}</svg>
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    const role = DEMO_ACCOUNTS[normalizedEmail]
    if (!role || password !== DEMO_PASSWORD) {
      setError('Usuario o contraseña incorrectos. Revisá los datos e intentá nuevamente.')
      return
    }
    setError('')
    onLogin(role)
  }

  return <main className="login-shell">
    <section className="login-brand">
      <div className="login-brand-content">
        <span className="login-logo"><Icon name="truck" size={29}/></span>
        <h1>MandáTodo</h1>
        <p className="login-product">Sistema Logístico</p>
        <div className="login-promise"><span/><h2>Gestión simple.<br/>Entregas seguras.</h2><p>Centralizá tus pedidos y mantené cada envío bajo control, de punta a punta.</p></div>
      </div>
      <div className="login-rings" aria-hidden="true"><i/><i/><i/></div>
    </section>
    <section className="login-panel" aria-labelledby="login-heading">
      <div className="login-form-wrap">
        <p className="login-eyebrow">Bienvenido</p>
        <h2 id="login-heading">Iniciar sesión</h2>
        <p className="login-intro">Ingresá tus datos para acceder al sistema.</p>
        <form className="access-form" onSubmit={handleSubmit}>
          <label htmlFor="access-email">Usuario o email</label>
          <input id="access-email" type="email" autoComplete="username" placeholder="nombre@empresa.com" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} required/>
          <label htmlFor="access-password">Contraseña</label>
          <div className="login-password-wrap"><input id="access-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Ingresá tu contraseña" value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} required/><button type="button" className="show-password" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}><Icon name="eye" size={16}/></button></div>
          <button className="login-submit" type="submit"><span>Iniciar sesión</span><span>→</span></button>
          {error && <p className="login-error" role="alert">{error}</p>}
        </form>
        <div className="demo-credentials"><b>Accesos de demostración</b><span>admin@mandatodo.com · operador@mandatodo.com · chofer@mandatodo.com</span><span>Contraseña para todas: <strong>demo1234</strong></span></div>
        <p className="login-secure">Acceso seguro para personal autorizado</p>
      </div>
    </section>
  </main>
}

const NAV_ITEMS = [
  { id: 'form', label: 'Cargar Pedido', icon: 'plus' },
  { id: 'board', label: 'Tablero de Envíos', icon: 'grid' },
  { id: 'routes', label: 'Rutas', icon: 'route', soon: true },
  { id: 'clients', label: 'Clientes', icon: 'users', soon: true },
]

function Brand() {
  return <div className="brand"><span className="brand-badge"><Icon name="truck" size={20}/></span><span><b>MandáTodo</b><small>Sistema Logístico</small></span></div>
}

function Sidebar({ page, setPage, role, onLogout }) {
  return <aside className="sidebar">
    <Brand/>
    <nav className="navigation" aria-label="Navegación principal">
      {NAV_ITEMS.map((item) => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => !item.soon && setPage(item.id)} disabled={item.soon}>
        <Icon name={item.icon}/><span>{item.label}</span>{item.soon && <small>PRÓX.</small>}
      </button>)}
    </nav>
    <div className="profile"><span className="avatar">{role === 'Administrador' ? 'A' : 'O'}</span><span><b>{role === 'Administrador' ? 'Administración' : 'Operaciones'}</b><small>{role}</small></span><button className="logout" onClick={onLogout} title="Cerrar sesión" aria-label="Cerrar sesión"><Icon name="logout" size={14}/></button></div>
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

function Board({ setPage }) {
  return <main className="main-content board-page">
    <PageHeader eyebrow="Centro de operaciones" title="Tablero General de Despacho" subtitle="Vista general de la operación de hoy." action="Cargar nuevo pedido" onAction={() => setPage('form')}/>
    <section className="stats-grid" aria-label="Resumen de envíos">
      <StatCard icon="box" tone="blue" value="0" label="Pedidos Registrados"/>
      <StatCard icon="grid" tone="amber" value="0" label="En Preparación"/>
      <StatCard icon="truck" tone="purple" value="0" label="En Ruta de Envío"/>
      <StatCard icon="check" tone="green" value="0" label="Entregados y Pagados"/>
    </section>
    <section className="shipments-card">
      <div className="shipments-heading"><div><h2>Envíos del Día</h2><p>Seguimiento de pedidos cargados</p></div><button className="button button-outline group-button"><Icon name="link" size={14}/> Agrupar envíos lejanos automáticamente</button></div>
      <div className="filters"><label>Estado<select defaultValue="all"><option value="all">Todos los estados</option><option>En stock</option><option>En preparación</option><option>En envío</option><option>Entregado</option><option>Pagado</option></select></label><label>Chofer asignado<select defaultValue="all"><option value="all">Todos los choferes</option><option>Sin asignar</option><option>Chofer 1</option><option>Chofer 2</option></select></label></div>
      <EmptyState onCreate={() => setPage('form')}/>
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

function OrderForm({ setPage }) {
  return <main className="main-content form-page">
    <PageHeader eyebrow="Nuevo envío" title="Carga Manual de Pedido" subtitle="Completá los datos y validá la ubicación antes de despachar." action="Ver tablero" onAction={() => setPage('board')}/>
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

function OperatorApp({ role, onLogout }) {
  const [page, setPage] = useState('board')
  return <div className="operator-app"><Sidebar page={page} setPage={setPage} role={role} onLogout={onLogout}/><div className="workspace">{page === 'form' ? <OrderForm setPage={setPage}/> : <Board setPage={setPage}/>}</div></div>
}

function App() {
  const [role, setRole] = useState(null)
  if (!role) return <Login onLogin={setRole}/>
  if (role === 'Chofer') return <DriverApp onLogout={() => setRole(null)}/>
  return <OperatorApp role={role} onLogout={() => setRole(null)}/>
}

export default App
