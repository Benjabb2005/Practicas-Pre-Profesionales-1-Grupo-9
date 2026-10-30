import { useEffect, useState } from 'react'
import { historialPedido } from '../api/asignaciones.js'
import { mensajeError } from '../api/client.js'
import Paginacion from './Paginacion.jsx'
import usePagination from './usePagination.js'
import { historialEntregas } from './chofer.js'
import './HistorialPedido.css'

export default function HistorialPedido({ pedidoId, operador = false, pedido = null }) {
  const [filas, setFilas] = useState(null)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  const cambios = historialEntregas(filas ?? [], pedido)
  const pagina = usePagination(cambios, `${pedidoId}-${intento}`)
  useEffect(() => {
    let vigente = true
    historialPedido(pedidoId, operador).then(h => { if (vigente) setFilas(h) })
      .catch(e => { if (vigente) setError(mensajeError(e)) })
    return () => { vigente = false }
  }, [pedidoId, operador, intento])
  return <section className="entrega-historial delivery-history" aria-label="Historial del pedido"><h3>Historial del pedido</h3>
    {error && <><p role="alert">{error}</p><button type="button" onClick={() => { setError(''); setFilas(null); setIntento(i => i + 1) }}>Reintentar historial</button></>}
    {!filas && !error && <p role="status">Cargando historial…</p>}
    {filas && cambios.length === 0 && <p>Todavía no se registraron cambios de estado ni intentos.</p>}
    {pagina.items.map(h => <article key={h.id} className={pedido ? 'historial-completo-evento' : undefined}>{pedido && <time className="history-time-badge" dateTime={h.fecha}>{h.fecha ? new Date(h.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' }) : '—'}</time>}<div><strong>{h.titulo}</strong>
      <small>{new Date(h.fecha).toLocaleString('es-AR', { hour12: false, timeZone: 'America/Argentina/Buenos_Aires' })}{h.usuario_nombre ? ` · ${h.usuario_nombre}` : pedido ? '' : ' · Usuario no disponible'}</small>
      {h.motivo && <p>{pedido ? '' : 'Motivo: '}{h.motivo}</p>}</div></article>)}
    <Paginacion datos={pagina} nombre="movimientos del pedido"/>
  </section>
}
