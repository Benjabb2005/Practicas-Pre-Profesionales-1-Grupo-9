import { useEffect, useRef, useState } from 'react'
import { mensajeError } from '../api/client'
import { listarClientes } from '../api/clientes'

// Presentación de Orders.jsx en branch-benjamin-1, con la API de MVP-1.
function ClienteSelector({ cliente, onSeleccionar, bloqueado = false }) {
  const contenedor = useRef(null)
  const [busqueda, setBusqueda] = useState('')
  const [activo, setActivo] = useState(false)
  const [consulta, setConsulta] = useState({ termino: null, resultados: [], error: '' })
  const termino = busqueda.trim()
  useEffect(() => {
    if (!activo) return undefined
    function cerrarFuera(event) {
      if (!contenedor.current?.contains(event.target)) setActivo(false)
    }
    document.addEventListener('pointerdown', cerrarFuera)
    return () => document.removeEventListener('pointerdown', cerrarFuera)
  }, [activo])
  useEffect(() => {
    if (!activo || bloqueado) return undefined
    const controlador = new AbortController()
    const temporizador = setTimeout(() => {
      listarClientes(termino || undefined, controlador.signal)
        .then(resultados => { if (!controlador.signal.aborted) setConsulta({ termino, resultados, error: '' }) })
        .catch(e => { if (!controlador.signal.aborted) setConsulta({ termino, resultados: [], error: mensajeError(e) }) })
    }, termino ? 250 : 0)
    return () => { clearTimeout(temporizador); controlador.abort() }
  }, [termino, activo, bloqueado])

  const buscando = activo && consulta.termino !== termino
  const error = activo && consulta.termino === termino ? consulta.error : ''
  const visibles = activo && !buscando && !bloqueado ? consulta.resultados.slice(0, termino ? 20 : 5) : []
  function limpiar() { setActivo(false); setBusqueda(''); setConsulta({ termino: null, resultados: [], error: '' }) }
  return <div ref={contenedor} className="cliente-selector cliente-selector-referencia"
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setActivo(false) }}>
    <div className="frequent-search">
      <label htmlFor="cliente-busqueda">Buscar cliente frecuente por DNI, email o teléfono</label>
      <input id="cliente-busqueda" type="search" autoComplete="off" placeholder="Escribí para filtrar clientes…" value={busqueda} maxLength={100} disabled={bloqueado}
        onFocus={() => setActivo(true)} onClick={() => setActivo(true)}
        aria-controls="cliente-resultados" aria-expanded={activo && !bloqueado} aria-describedby="cliente-busqueda-ayuda"
        onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); if (e.key === 'Escape') setActivo(false) }}
        onChange={e => { setActivo(true); setBusqueda(e.target.value); setConsulta({ termino: null, resultados: [], error: '' }) }}/>
    </div>
    <p id="cliente-busqueda-ayuda" className="frequent-status" role="status">{buscando ? 'Buscando clientes…'
      : activo && !error ? visibles.length
        ? `${visibles.length} ${visibles.length === 1 ? 'cliente coincidente' : 'clientes coincidentes'}${visibles.length === 20 ? ' (primeros 20; completá más datos para afinar)' : ''}.`
        : 'No se encontraron clientes con esos datos.' : 'La lista se actualiza mientras escribís.'}</p>
    {error && <p className="users-alert" role="alert">{error}</p>}
    <ul id="cliente-resultados" className="candidate-list">{visibles.map(c => <li key={c.id}>
      <span><strong>{c.nombre}</strong><small>DNI: {c.dni || 'Pendiente'} · {c.email || 'Email pendiente'} · {c.telefono || 'Teléfono pendiente'}</small></span>
      <button type="button" disabled={bloqueado} className="button button-outline" onClick={() => { limpiar(); onSeleccionar(c) }}>Seleccionar</button>
    </li>)}</ul>
    {cliente && <div className="frequent-selected"><p role="status">Cliente frecuente seleccionado. Sus datos no se modificarán.</p><button type="button" disabled={bloqueado} className="button button-outline" onClick={() => { limpiar(); onSeleccionar(null) }}>Cambiar</button></div>}
  </div>
}

export default ClienteSelector
