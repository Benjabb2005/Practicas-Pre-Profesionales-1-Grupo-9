import { useEffect, useState } from 'react'
import './App.css'
import DriverApp from './DriverApp.jsx'
import LiveDriverApp from './LiveDriverApp.jsx'
import { api } from './api.js'
import { Board, OrderForm } from './Orders.jsx'
import Users from './Users.jsx'
import ThemeToggle from './ThemeToggle.jsx'

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

function Login({ onLogin, onDemo, initialError }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')
    try {
      const session = await api('/sesion', { method: 'POST', body: { email: email.trim(), password } })
      setPassword('')
      onLogin(session.usuario)
    } catch (failure) {
      setError(failure.message || 'No se pudo conectar. Volvé a intentar.')
    } finally {
      setPending(false)
    }
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
    <section className="login-panel" aria-labelledby="login-heading"><ThemeToggle/>
      <div className="login-form-wrap">
        <p className="login-eyebrow">Bienvenido</p>
        <h2 id="login-heading">Iniciar sesión</h2>
        <p className="login-intro">Ingresá tus datos para acceder al sistema.</p>
        <form className="access-form" onSubmit={handleSubmit}>
          <label htmlFor="access-email">Usuario o email</label>
          <input id="access-email" type="email" autoComplete="username" placeholder="nombre@empresa.com" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} required/>
          <label htmlFor="access-password">Contraseña</label>
          <div className="login-password-wrap"><input id="access-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Ingresá tu contraseña" value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} required/><button type="button" className="show-password" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}><Icon name="eye" size={16}/></button></div>
          <button className="login-submit" type="submit" disabled={pending}><span>{pending ? 'Ingresando…' : 'Iniciar sesión'}</span><span>→</span></button>
          {(error || initialError) && <p className="login-error" role="alert">{error || initialError}</p>}
        </form>
        <div className="demo-credentials"><b>Prototipo del chofer</b><span>Datos ficticios, sin sesión ni persistencia.</span><button type="button" className="button button-outline" onClick={onDemo}>Ver demostración del chofer</button></div>
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
  { id: 'users', label: 'Usuarios', icon: 'users', adminOnly: true },
]

function Brand() {
  return <div className="brand"><span className="brand-badge"><Icon name="truck" size={20}/></span><span><b>MandáTodo</b><small>Sistema Logístico</small></span></div>
}

function Sidebar({ page, setPage, role, name, onLogout }) {
  return <aside className="sidebar">
    <div className="sidebar-brand-row"><Brand/><ThemeToggle/></div>
    <nav className="navigation" aria-label="Navegación principal">
      {NAV_ITEMS.filter((item) => !item.adminOnly || role === 'Administrador').map((item) => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => !item.soon && setPage(item.id)} disabled={item.soon}>
        <Icon name={item.icon}/><span>{item.label}</span>{item.soon && <small>PRÓX.</small>}
      </button>)}
    </nav>
    <div className="profile"><span className="avatar">{role === 'Administrador' ? 'A' : 'O'}</span><span><b>{name}</b><small>{role}</small></span><button className="logout" onClick={onLogout} title="Cerrar sesión" aria-label="Cerrar sesión"><Icon name="logout" size={14}/></button></div>
  </aside>
}

function OperatorApp({ user, onLogout, logoutError }) {
  const [page, setPage] = useState('board')
  const role = user.rol === 'admin' ? 'Administrador' : 'Operador'
  return <div className="operator-app"><Sidebar page={page} setPage={setPage} role={role} name={user.nombre} onLogout={onLogout}/><div className="workspace">{logoutError && <p className="login-error" role="alert">{logoutError}</p>}{page === 'users' && user.rol === 'admin' ? <Users/> : page === 'form' ? <OrderForm setPage={setPage}/> : <Board setPage={setPage}/>}</div></div>
}

function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const [logoutError, setLogoutError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const [demo, setDemo] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    function expired() { setUser(null); setSessionError('Tu sesión venció. Iniciá sesión nuevamente.') }
    window.addEventListener('mandatodo-session-expired', expired)
    api('/sesion', { signal: controller.signal }).then((session) => {
      if (!controller.signal.aborted) setUser(session.usuario)
    }).catch((failure) => {
      if (!controller.signal.aborted && failure.status !== 401) setSessionError(failure.message)
    }).finally(() => {
      if (!controller.signal.aborted) setChecking(false)
    })
    return () => { controller.abort(); window.removeEventListener('mandatodo-session-expired', expired) }
  }, [])

  async function logout() {
    if (loggingOut) return
    setLoggingOut(true)
    setLogoutError('')
    try {
      await api('/sesion', { method: 'DELETE' })
      setUser(null)
      setSessionError('')
    } catch (failure) {
      if (failure.status === 401) setUser(null)
      else setLogoutError(failure.message)
    } finally {
      setLoggingOut(false)
    }
  }

  if (checking) return <main className="session-loading" role="status">Comprobando sesión…</main>
  if (demo) return <DriverApp onLogout={() => setDemo(false)}/>
  if (!user) return <Login initialError={sessionError} onDemo={() => setDemo(true)} onLogin={(nextUser) => { setUser(nextUser); setSessionError('') }}/>
  if (user.rol === 'chofer') return <LiveDriverApp user={user} onLogout={logout} logoutError={logoutError}/>
  return <OperatorApp user={user} onLogout={logout} logoutError={logoutError}/>
}

export default App
