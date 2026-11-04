import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import AppNavigation from './components/AppNavigation.jsx'
import ChoferPedidosPage from './pages/ChoferPedidosPage.jsx'
import AsignacionesPage from './pages/AsignacionesPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import TarifasPage from './pages/TarifasPage.jsx'
import PedidosCargaPage from './pages/PedidosCargaPage.jsx'
import PedidosListadoPage from './pages/PedidosListadoPage.jsx'
import PedidosRevisionPage from './pages/PedidosRevisionPage.jsx'
import PedidoRevisionDetallePage from './pages/PedidoRevisionDetallePage.jsx'
import ClientesPage from './pages/ClientesPage.jsx'
import PedidoDetallePage from './pages/PedidoDetallePage.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import { useAuth } from './auth/useAuth'

function OperatorLayout() {
  const { usuario, logout } = useAuth()
  const navegar = useNavigate()
  function salir() {
    logout()
    navegar('/login', { replace: true })
  }
  return <div className="experience-app"><a className="skip-content" href="#contenido">Ir al contenido</a><AppNavigation usuario={usuario} onLogout={salir}/><div className="operator-app"><div className="workspace" id="contenido" tabIndex={-1}><Outlet/></div></div></div>
}

function ChoferRuta() {
  const { logout } = useAuth()
  const navegar = useNavigate()
  return <ChoferPedidosPage onLogout={() => { logout(); navegar('/login', { replace: true }) }}/>
}

function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route element={<ProtectedRoute roles={['ADMINISTRADOR', 'OPERADOR']}><OperatorLayout/></ProtectedRoute>}>
      <Route index element={<PedidosListadoPage/>}/>
      <Route path="form" element={<PedidosCargaPage/>}/>
      <Route path="asignaciones" element={<AsignacionesPage/>}/>
      <Route path="pedidos/revision" element={<PedidosRevisionPage/>}/>
      <Route path="pedidos/:id/revision" element={<PedidoRevisionDetallePage/>}/>
      <Route path="pedidos/:id" element={<PedidoDetallePage/>}/>
      <Route path="clientes" element={<ClientesPage/>}/>
      <Route path="usuarios" element={<ProtectedRoute roles={['ADMINISTRADOR']}><UsersPage/></ProtectedRoute>}/>
      <Route path="tarifas" element={<ProtectedRoute roles={['ADMINISTRADOR']}><TarifasPage/></ProtectedRoute>}/>
    </Route>
    <Route path="/chofer" element={<ProtectedRoute roles={['CHOFER']}><ChoferRuta/></ProtectedRoute>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>
}

export default App
