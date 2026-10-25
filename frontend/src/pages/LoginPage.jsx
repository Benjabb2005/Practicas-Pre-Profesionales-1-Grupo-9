import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../auth/useAuth'

function LoginPage() {
  const { usuario, login, errorLogin } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (usuario) {
    const destino = usuario.rol === 'CHOFER' ? '/chofer' : (ubicacion.state?.desde === '/chofer' ? '/' : (ubicacion.state?.desde || '/'))
    return <Navigate to={destino} replace/>
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setEnviando(true)
    setError('')
    try {
      const autenticado = await login(email.trim(), password)
      const destino = autenticado.rol === 'CHOFER' ? '/chofer' : (ubicacion.state?.desde === '/chofer' ? '/' : (ubicacion.state?.desde || '/'))
      navegar(destino, { replace: true })
    } catch (fallo) {
      setError(errorLogin(fallo))
    } finally {
      setEnviando(false)
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
          <button className="login-submit" type="submit" disabled={enviando}><span>{enviando ? 'Ingresando…' : 'Iniciar sesión'}</span><span>→</span></button>
          {error && <p className="login-error" role="alert">{error}</p>}
        </form>
        <p className="login-secure">Acceso seguro para personal autorizado</p>
      </div>
    </section>
  </main>
}

export default LoginPage
