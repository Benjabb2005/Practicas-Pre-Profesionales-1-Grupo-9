import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

// Guarda de rutas: exige sesión (y opcionalmente rol). Es una ayuda de navegación;
// la autorización real la aplica siempre el backend.
function ProtectedRoute({ roles, children }) {
  const { usuario, cargando } = useAuth()
  const ubicacion = useLocation()

  if (cargando) {
    return <div className="route-loading" role="status">Cargando sesión…</div>
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }}/>
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace/>
  }

  return children
}

export default ProtectedRoute
