import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import Paginacion from './Paginacion.jsx'
import usePagination from './usePagination.js'
import { contactoDeCliente } from './cliente.js'
import { mensajeError } from '../api/client'
import { listarClientes } from '../api/clientes'

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
        .catch((fallo) => { if (vigente) { setResultados([]); setError(mensajeError(fallo)) } })
        .finally(() => { if (vigente) setCargando(false) })
    }, 300)
    return () => { vigente = false; clearTimeout(temporizador) }
  }, [busqueda, cliente])

  const paginado = usePagination(resultados, busqueda, 5)
  if (cliente) {
    return <div className="cliente-selector">
      <span className="form-field-label">Cliente</span>
      <div className="cliente-elegido">
        <span><b>{cliente.nombre}</b><small>{contactoDeCliente(cliente) || 'Sin datos de contacto'}</small></span>
        <button type="button" className="button button-outline" onClick={() => onSeleccionar(null)} disabled={bloqueado}>Cambiar</button>
      </div>
    </div>
  }

  return <div className="cliente-selector">
    <label htmlFor="cliente-busqueda">Cliente frecuente</label>
    <small id="cliente-busqueda-ayuda" className="cliente-ayuda">Buscá por DNI, nombre o teléfono. El DNI puede llevar puntos o guiones.</small>
    <div className="search-input">
      <Icon name="search" size={15}/>
      <input
        id="cliente-busqueda"
        value={busqueda}
        onChange={(event) => setBusqueda(event.target.value)}
        placeholder="Ej. 20.123.456, Juan Pérez o 11 5555-5555"
        autoComplete="off"
        maxLength={100}
        aria-describedby="cliente-busqueda-ayuda"
        disabled={bloqueado}
      />
    </div>
    {error && <p className="users-alert" role="alert">{error}</p>}
    <ul className="cliente-lista">
      {cargando && <li className="cliente-vacio" role="status">Buscando…</li>}
      {!cargando && !error && resultados.length === 0 && <li className="cliente-vacio">Sin coincidencias. Completá los datos para dar de alta un cliente nuevo.</li>}
      {!cargando && paginado.items.map((opcion) => <li key={opcion.id}>
        <button type="button" onClick={() => onSeleccionar(opcion)}>
          <b>{opcion.nombre}</b>
          <small>{contactoDeCliente(opcion) || 'Sin datos de contacto'}</small>
        </button>
      </li>)}
    </ul>
    {!cargando && !error && <Paginacion datos={paginado} nombre="clientes frecuentes" disabled={bloqueado}/>}
  </div>
}

export default ClienteSelector
