import { useEffect, useRef, useState } from 'react'
import { misEntregados, obtenerMiPedido } from '../api/asignaciones.js'
import { mensajeError } from '../api/client.js'
import PedidoInformacion from './PedidoInformacion.jsx'
import HistorialPedido from './HistorialPedido.jsx'
import MapPreview from './MapPreview.jsx'
import { ubicacionConfirmada } from './chofer.js'
import { useAuth } from '../auth/useAuth.js'

export default function DetalleChofer({ pedidoId, entregado = false, onClose }) {
  const { usuario } = useAuth()
  const ref = useRef(null)
  const [pedido, setPedido] = useState(null)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    const dialogo = ref.current
    const foco = document.activeElement
    const overflow = document.body.style.overflow
    dialogo.showModal(); document.body.style.overflow = 'hidden'
    return () => { if (dialogo.open) dialogo.close(); document.body.style.overflow = overflow; foco?.focus() }
  }, [])
  useEffect(() => {
    let vigente = true
    const solicitud = entregado ? misEntregados().then(filas => {
      const propio = filas.find(p => String(p.id) === String(pedidoId))
      return propio
    }) : obtenerMiPedido(pedidoId)
    solicitud.then(p => {
      if (!vigente) return
      if (!p) setError('El pedido ya no está disponible entre tus entregas. Actualizá el listado.')
      else setPedido({ ...p, chofer_nombre: p.chofer_nombre || usuario.nombre })
    }).catch(e => { if (vigente) setError(mensajeError(e)) })
    return () => { vigente = false }
  }, [pedidoId, entregado, intento, usuario.nombre])
  return <dialog ref={ref} className="driver-detail-dialog" aria-labelledby="driver-detail-title" onCancel={e => { e.preventDefault(); onClose() }}>
    <header><div><p className="eyebrow">Tu entrega, en detalle</p><h2 id="driver-detail-title">Pedido {pedido?.codigo || `#${pedidoId}`}</h2></div><button type="button" className="button button-outline" autoFocus onClick={onClose}>Cerrar detalle</button></header>
    {error && <div role="alert"><p>{error}</p><button onClick={() => { setError(''); setIntento(i => i + 1) }}>Reintentar detalle</button></div>}
    {!pedido && !error && <p role="status">Consultando el detalle de tu pedido…</p>}
    {pedido && <><span className="detail-state">{pedido.estado}</span><PedidoInformacion pedido={pedido}/>{ubicacionConfirmada(pedido) && <section><h3>Destino confirmado</h3><MapPreview latitud={pedido.latitud} longitud={pedido.longitud} etiqueta={pedido.direccion_original}/><a className="button button-outline" href={ubicacionConfirmada(pedido)} target="_blank" rel="noreferrer">Abrir ubicación en Google Maps →</a></section>}<HistorialPedido pedidoId={pedidoId}/></>}
  </dialog>
}
