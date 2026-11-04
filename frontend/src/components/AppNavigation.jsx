import { NavLink } from 'react-router-dom'
import Icon from './Icon.jsx'
import ThemeToggle from '../ThemeToggle.jsx'

const ROLES = { ADMINISTRADOR: 'Administrador', OPERADOR: 'Operador', CHOFER: 'Chofer' }

export default function AppNavigation({ usuario, onLogout }) {
  const items = [
    { to: '/', label: 'Resumen', icon: 'grid', end: true },
    { to: '/form', label: 'Nuevo pedido', icon: 'plus' },
    { to: '/pedidos/revision', label: 'Revisar direcciones', icon: 'eye' },
    { to: '/asignaciones', label: 'Asignaciones', icon: 'truck' },
    { to: '/clientes', label: 'Clientes', icon: 'users' },
  ]
  if (usuario.rol === 'ADMINISTRADOR') items.push(
    { to: '/usuarios', label: 'Usuarios', icon: 'users' },
    { to: '/tarifas', label: 'Configuración de envíos', icon: 'settings' },
  )
  return <header className="app-header">
    <div className="app-header-inner">
      <NavLink to="/" className="app-brand" aria-label="MandáTodo · Resumen">
        <span className="app-brand-mark"><Icon name="truck" size={23}/></span>
        <span>MandáTodo<small>Logística, en movimiento.</small></span>
      </NavLink>
      <nav className="app-navigation" aria-label="Navegación principal">
        {items.map(item => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}>
          <Icon name={item.icon} size={16}/><span>{item.label}</span>
        </NavLink>)}
        <button className="app-nav-link app-nav-soon" type="button" disabled title="Planificación de rutas disponible en una próxima etapa"><Icon name="route" size={16}/><span>Rutas</span><small>Próx.</small></button>
      </nav>
      <div className="app-session" aria-label="Sesión actual">
        <ThemeToggle/>
        <span className="app-avatar" aria-hidden="true">{(usuario.nombre || usuario.email || 'U').charAt(0).toUpperCase()}</span>
        <span className="app-session-name"><b title={usuario.nombre || usuario.email}>{usuario.nombre || usuario.email}</b><small>{ROLES[usuario.rol] || usuario.rol}</small></span>
        <button className="app-logout" onClick={onLogout} title="Cerrar sesión" aria-label="Cerrar sesión"><Icon name="logout" size={18}/></button>
      </div>
    </div>
  </header>
}
