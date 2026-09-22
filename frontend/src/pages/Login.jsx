import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    navigate('/admin')
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>MandáTodo</h1>
        <p>Iniciá sesión para gestionar tus envíos</p>

        <label>
          Usuario
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="ej: admin"
            required
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
          />
        </label>

        <button type="submit">Ingresar</button>
      </form>
    </div>
  )
}

export default Login