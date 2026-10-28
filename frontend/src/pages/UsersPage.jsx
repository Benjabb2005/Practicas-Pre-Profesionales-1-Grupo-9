import Paginacion from '../components/Paginacion.jsx'
import usePagination from '../components/usePagination.js'
import { useEffect, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { api, mensajeError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import './UsersPage.css'

const FORM_VACIO = { nombre: '', email: '', password: '', rol: 'OPERADOR', activo: true }
const ROLES = [
  { valor: 'ADMINISTRADOR', etiqueta: 'Administrador' },
  { valor: 'OPERADOR', etiqueta: 'Operador' },
  { valor: 'CHOFER', etiqueta: 'Chofer' },
]

function UsersPage() {
  const { usuario: sesion } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [formulario, setFormulario] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const paginado = usePagination(usuarios, '')

  async function refrescar() {
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get('/usuarios')
      setUsuarios(data.usuarios)
    } catch (fallo) {
      setError(mensajeError(fallo))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    let vigente = true
    api.get('/usuarios')
      .then(({ data }) => { if (vigente) setUsuarios(data.usuarios) })
      .catch((fallo) => { if (vigente) setError(mensajeError(fallo)) })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [])

  function abrirNuevo() { setAviso(''); setError(''); setFormulario({ ...FORM_VACIO }) }
  function abrirEdicion(usuario) {
    setAviso('')
    setError('')
    setFormulario({ id: usuario.id, nombre: usuario.nombre, email: usuario.email, password: '', rol: usuario.rol, activo: usuario.activo })
  }
  function cambiar(campo, valor) { setFormulario((actual) => ({ ...actual, [campo]: valor })) }

  async function guardar(event) {
    event.preventDefault()
    setEnviando(true)
    setError('')
    try {
      if (formulario.id) {
        const cuerpo = { nombre: formulario.nombre, email: formulario.email, rol: formulario.rol, activo: formulario.activo }
        if (formulario.password) cuerpo.password = formulario.password
        await api.put(`/usuarios/${formulario.id}`, cuerpo)
        setAviso('Usuario actualizado.')
      } else {
        await api.post('/usuarios', { nombre: formulario.nombre, email: formulario.email, password: formulario.password, rol: formulario.rol })
        setAviso('Usuario creado.')
      }
      setFormulario(null)
      await refrescar()
    } catch (fallo) {
      setError(mensajeError(fallo))
    } finally {
      setEnviando(false)
    }
  }

  return <main className="main-content users-page">
    <header className="page-header">
      <div><p className="eyebrow">Administración</p><h1>Usuarios del sistema</h1><p className="subtitle">Altas y modificaciones de cuentas. La gestión está reservada al administrador.</p></div>
      <button className="button button-primary header-action" onClick={abrirNuevo}><Icon name="plus"/> Nuevo usuario</button>
    </header>

    {error && <p className="users-alert" role="alert">{error}</p>}
    {aviso && <p className="users-ok" role="status">{aviso}</p>}

    {formulario && <section className="panel users-form-panel" aria-labelledby="users-form-title">
      <div className="section-heading"><span className="step-number">{formulario.id ? '✎' : '+'}</span><div><h2 id="users-form-title">{formulario.id ? 'Editar usuario' : 'Nuevo usuario'}</h2><p>{formulario.id ? 'Dejá la contraseña vacía para no cambiarla.' : 'Completá los datos. La contraseña debe tener al menos 8 caracteres.'}</p></div></div>
      <form className="access-form users-form" onSubmit={guardar}>
        <label htmlFor="user-nombre">Nombre</label>
        <input id="user-nombre" value={formulario.nombre} onChange={(event) => cambiar('nombre', event.target.value)} required minLength={2}/>

        <label htmlFor="user-email">Email</label>
        <input id="user-email" type="email" autoComplete="off" value={formulario.email} onChange={(event) => cambiar('email', event.target.value)} required/>

        <label htmlFor="user-password">Contraseña {formulario.id ? '(opcional)' : ''}</label>
        <input id="user-password" type="password" autoComplete="new-password" value={formulario.password} onChange={(event) => cambiar('password', event.target.value)} required={!formulario.id} minLength={formulario.id ? undefined : 8}/>

        <label htmlFor="user-rol">Rol</label>
        <select id="user-rol" value={formulario.rol} onChange={(event) => cambiar('rol', event.target.value)}>
          {ROLES.map((rol) => <option key={rol.valor} value={rol.valor}>{rol.etiqueta}</option>)}
        </select>

        {formulario.id && <label className="users-check"><input type="checkbox" checked={formulario.activo} onChange={(event) => cambiar('activo', event.target.checked)}/> Usuario activo</label>}

        <div className="users-form-actions">
          <button className="button button-primary" type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</button>
          <button className="button button-outline" type="button" onClick={() => setFormulario(null)} disabled={enviando}>Cancelar</button>
        </div>
      </form>
    </section>}

    <section className="shipments-card">
      <div className="shipments-heading"><div><h2>Cuentas</h2><p>Usuarios habilitados para operar el sistema.</p></div></div>
      {cargando
        ? <p className="users-state" role="status">Cargando usuarios…</p>
        : usuarios.length === 0
          ? <p className="users-state">Todavía no hay usuarios cargados.</p>
          : <div className="users-table-wrap">
            <table className="users-table">
              <thead><tr><th scope="col">Nombre</th><th scope="col">Email</th><th scope="col">Rol</th><th scope="col">Estado</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
              <tbody>
                {paginado.items.map((usuario) => <tr key={usuario.id}>
                  <td>{usuario.nombre}{usuario.id === sesion?.id && <small className="users-self"> (vos)</small>}</td>
                  <td>{usuario.email}</td>
                  <td>{ROLES.find((rol) => rol.valor === usuario.rol)?.etiqueta || usuario.rol}</td>
                  <td><span className={`users-status ${usuario.activo ? 'activo' : 'inactivo'}`}>{usuario.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td><button className="button button-outline users-edit" onClick={() => abrirEdicion(usuario)}>Editar</button></td>
                </tr>)}
              </tbody>
            </table>
          </div>}

    <Paginacion datos={paginado} nombre="usuarios" disabled={cargando}/>
    </section>
  </main>
}

export default UsersPage
