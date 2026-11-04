import { useEffect, useRef, useState } from 'react'
import MapPreview from './MapPreview.jsx'
import { obtenerMiPedido } from '../api/asignaciones.js'
import { mensajeError } from '../api/client.js'
import { ubicacionConfirmada } from './chofer.js'
import './MapaChofer.css'

export default function MapaChofer({ pedidoId, onClose }) {
  const dialogo = useRef(null)
  const [pedido, setPedido] = useState(null)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    const elemento = dialogo.current
    elemento.showModal()
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { if (elemento.open) elemento.close(); document.body.style.overflow = anterior }
  }, [])
  useEffect(() => {
    let vigente = true
    obtenerMiPedido(pedidoId).then(p => { if (vigente) setPedido(p) })
      .catch(e => { if (vigente) setError(mensajeError(e)) })
    return () => { vigente = false }
  }, [pedidoId, intento])
  const disponible = pedido && ubicacionConfirmada(pedido)
  return <dialog ref={dialogo} className="chofer-mapa-modal" aria-labelledby="chofer-mapa-titulo"
    onClose={() => { if (!dialogo.current?.open) onClose() }} onClick={e => { if (e.target === e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect()
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) e.currentTarget.close()
    } }}>
    <header><div><small>Ubicación confirmada</small><h2 id="chofer-mapa-titulo">Mapa del pedido {pedido?.codigo || `#${pedidoId}`}</h2></div>
      <button type="button" onClick={() => dialogo.current.close()} aria-label="Cerrar mapa">Cerrar</button></header>
    <div className="chofer-mapa-contenido">
      {error && <><p role="alert">{error}</p><button type="button" onClick={() => { setError(''); setIntento(i => i + 1) }}>Reintentar</button></>}
      {!pedido && !error && <p role="status">Cargando ubicación…</p>}
      {pedido && (disponible ? <><p>{[pedido.calle, pedido.altura, pedido.piso_depto, pedido.localidad, pedido.provincia].filter(Boolean).join(' ')}</p>
        <MapPreview latitud={pedido.latitud} longitud={pedido.longitud} etiqueta={pedido.codigo || `Pedido #${pedido.id}`}/>
        <a className="driver-map-button" href={disponible} target="_blank" rel="noreferrer">Ver ubicación en Google Maps</a></> : <p>La ubicación confirmada ya no está disponible. Actualizá tus entregas.</p>)}
    </div>
  </dialog>
}
