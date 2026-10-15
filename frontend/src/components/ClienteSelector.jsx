import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { mensajeError } from '../api/client'
import { listarClientes } from '../api/pedidos'

// Selector de cliente frecuente contra el backend. No inventa clientes: si no
// hay coincidencias lo dice, y el alta depende de los datos ya existentes.
function ClienteSelector({ cliente, onSeleccionar, bloqueado = false }) {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (cliente) return undefined
    let vigente = true
    const temporizador = setTimeout(() => {
      setCargando(true)
      listarClientes(busqueda.trim() || undefined)
        .then((lista) => { if (vigente) { setResultados(lista); setError('') } })
        .catch((fallo) => { if (vigente) setError(mensajeError(fallo)) })
        .finally(() => { if (vigente) setCargando(false) })
    }, 300)
    return () => { vigente = false; clearTimeout(temporizador) }
  }, [busqueda, cliente])

  if (cliente) {
    const contacto = [cliente.dni && `DNI ${cliente.dni}`, cliente.email, cliente.telefono].filter(Boolean).join(' · ')
    return <div className="cliente-selector">
      <span className="form-field-label">Cliente</span>
      <div className="cliente-elegido">
        <span><b>{cliente.nombre}</b><small>{contacto || 'Sin datos de contacto'}</small></span>
        <button type="button" className="button button-outline" onClick={() => onSeleccionar(null)} disabled={bloqueado}>Cambiar</button>
      </div>
    </div>
  }

  return <div className="cliente-selector">
    <label htmlFor="cliente-busqueda">Cliente frecuente</label>
    <div className="search-input">
      <Icon name="search" size={15}/>
      <input id="cliente-busqueda" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por nombre, email, teléfono o código" autoComplete="off" disabled={bloqueado}/>
    </div>
    {error && <p className="users-alert" role="alert">{error}</p>}
    <ul className="cliente-lista">
      {cargando && <li className="cliente-vacio" role="status">Buscando…</li>}
      {!cargando && !error && resultados.length === 0 && <li className="cliente-vacio">Sin coincidencias.</li>}
      {!cargando && resultados.map((opcion) => <li key={opcion.id}>
        <button type="button" onClick={() => onSeleccionar(opcion)}>
          <b>{opcion.nombre}</b>
          <small>{[opcion.dni && `DNI ${opcion.dni}`, opcion.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</small>
        </button>
      </li>)}
    </ul>
  </div>
}

export default ClienteSelector
