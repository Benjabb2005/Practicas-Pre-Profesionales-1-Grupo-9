import { useEffect, useState } from 'react'
import { listarDireccionesCliente } from '../api/clientes.js'
import { mensajeError } from '../api/client.js'
import { etiquetaDireccionGuardada } from './direccionesCliente.js'

export default function DireccionesCliente({ clienteId, valor, onChange, disabled }) {
  const [lista, setLista] = useState(null)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    const controlador = new AbortController()
    listarDireccionesCliente(clienteId, controlador.signal)
      .then(direcciones => { if (!controlador.signal.aborted) setLista(direcciones) })
      .catch(e => { if (!controlador.signal.aborted) setError(mensajeError(e)) })
    return () => controlador.abort()
  }, [clienteId, intento])
  return <div className="form-field">
    {!lista && !error && <p className="geo-ayuda" role="status">Buscando direcciones guardadas…</p>}
    {error && <p role="alert">No se pudieron cargar las direcciones. <button type="button" className="button button-outline" disabled={disabled} onClick={() => { setError(''); setLista(null); setIntento(i => i + 1) }}>Reintentar</button></p>}
    {lista?.length === 0 && <p className="geo-ayuda">Sin direcciones guardadas.</p>}
    {lista?.length > 0 && <><label htmlFor="cliente-direccion-guardada">Direcciones del cliente</label>
      <select id="cliente-direccion-guardada" disabled={disabled} value={valor} onChange={e => onChange(lista.find(d => d.clave === e.target.value) ?? null)}>
        <option value="">Otra dirección</option>
        {lista.map(d => <option key={d.clave} value={d.clave}>{etiquetaDireccionGuardada(d)}</option>)}
      </select></>}
  </div>
}
