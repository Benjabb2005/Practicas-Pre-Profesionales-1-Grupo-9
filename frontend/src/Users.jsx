import { useEffect, useState } from 'react'
import { api } from './api.js'
import './Orders.css'

export default function Users() {
  const [users, setUsers] = useState(null)
  const [form, setForm] = useState({ nombre: '', email: '', rol: 'operador', password: '', confirmation: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, setPending] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    api('/usuarios', { signal: controller.signal }).then((data) => { if (!controller.signal.aborted) { setUsers(data); setError('') } }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message)
    })
    return () => controller.abort()
  }, [retry])
  function change(field, value) { setForm((current) => ({ ...current, [field]: value })); setSuccess('') }
  async function submit(event) {
    event.preventDefault()
    if (pending) return
    setError(''); setSuccess('')
    if (form.password !== form.confirmation) { setError('Las contraseñas no coinciden.'); return }
    setPending(true)
    try {
      const { confirmation, ...body } = form
      // La confirmación se valida localmente; solo la contraseña llega a la API.
      if (!confirmation) return
      await api('/usuarios', { method: 'POST', body })
      setForm({ nombre: '', email: '', rol: 'operador', password: '', confirmation: '' })
      setSuccess('Cuenta creada. El empleado ya puede iniciar sesión con su email y contraseña.')
      setRetry((v) => v + 1)
    } catch (failure) { setError(failure.message) }
    finally { setPending(false) }
  }
  return <main className="main-content"><header className="page-header"><div><p className="eyebrow">Administración</p><h1>Usuarios</h1><p className="subtitle">Una cuenta individual para cada empleado.</p></div></header>
    <section className="panel persisted-panel"><h2>Crear usuario</h2><form className="persisted-form" onSubmit={submit}>
      <div className="fields-grid">{[['nombre', 'Nombre y apellido', 'text', 100], ['email', 'Email', 'email', 150], ['password', 'Contraseña (12 a 128 caracteres)', 'password', 128], ['confirmation', 'Repetir contraseña', 'password', 128]].map(([field, label, type, max]) => <label className="form-field" htmlFor={`user-${field}`} key={field}><span>{label} *</span><input id={`user-${field}`} required type={type} value={form[field]} maxLength={max} minLength={type === 'password' ? 12 : undefined} autoComplete={type === 'password' ? 'new-password' : 'off'} disabled={pending} onChange={(event) => change(field, event.target.value)}/></label>)}
      <label className="form-field" htmlFor="user-role"><span>Rol *</span><select id="user-role" value={form.rol} disabled={pending} onChange={(event) => change('rol', event.target.value)}><option value="operador">Operador</option><option value="admin">Administrador</option><option value="chofer">Chofer</option></select></label></div>
      <button type="submit" className="button button-primary" disabled={pending}>{pending ? 'Creando…' : 'Crear usuario'}</button>
    </form>{success && <p role="status">{success}</p>}{error && <p className="login-error" role="alert">{error}</p>}</section>
    <section className="panel persisted-panel"><h2>Cuentas del equipo</h2>{!users && !error && <p role="status">Cargando usuarios…</p>}<button className="button button-outline" type="button" onClick={() => setRetry((v) => v + 1)} disabled={pending}>Actualizar lista</button>
      {users && <div className="order-table-wrap"><table className="order-table"><thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th></tr></thead><tbody>{users.map((u) => <tr key={u.id}><td>{u.nombre}</td><td>{u.email}</td><td>{u.rol === 'admin' ? 'Administrador' : u.rol === 'chofer' ? 'Chofer' : 'Operador'}</td><td>{u.activo ? 'Activo' : 'Inactivo'}</td></tr>)}</tbody></table>{!users.length && <p>No hay cuentas registradas.</p>}</div>}
    </section>
  </main>
}
