import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarPedidos, obtenerPedido } from '../api/pedidos.js'
import { historialPedido } from '../api/asignaciones.js'
import { mensajeError } from '../api/client.js'
import { movimientosRecientes, pedidosParaActividad } from './actividad.js'
import { fechaVisible } from './pedidoListado.js'

export default function ActividadReciente() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    let vigente = true
    async function consultar() {
      try {
        const pedidos = pedidosParaActividad(await listarPedidos())
        const resultados = await Promise.all(pedidos.map(async p => {
          const [estados, detalle] = await Promise.allSettled([historialPedido(p.id, true), obtenerPedido(p.id)])
          return { estados: estados.status === 'fulfilled' ? estados.value : [], geo: detalle.status === 'fulfilled' ? detalle.value.intentos || [] : [], incompleto: estados.status === 'rejected' || detalle.status === 'rejected' }
        }))
        if (vigente) setDatos({ eventos: movimientosRecientes(pedidos, resultados.map(r => r.estados), resultados.map(r => r.geo)), cantidad: pedidos.length, fallos: resultados.filter(r => r.incompleto).length })
      } catch (e) { if (vigente) setError(mensajeError(e)) }
    }
    void consultar()
    return () => { vigente = false }
  }, [intento])
  return <section className="panel recent-activity" aria-label="Actividad reciente"><div className="recent-heading"><h2>Actividad reciente</h2><button className="activity-refresh" aria-label={error ? 'Reintentar actividad' : 'Actualizar actividad'} title="Volver a consultar actividad" disabled={!datos && !error} onClick={() => { setDatos(null); setError(''); setIntento(i => i + 1) }}>↻</button></div>
    <details className="recent-scope"><summary>Sobre estos movimientos</summary><p>Altas, cambios de estado y confirmaciones de ubicación de los {datos?.cantidad ?? '8'} pedidos más recientes por fecha disponible.</p></details>
    {error && <p className="users-alert" role="alert">{error}</p>}
    {!datos && !error && <p role="status">Consultando los movimientos registrados…</p>}
    {datos?.fallos > 0 && <p role="alert">No se pudieron leer {datos.fallos} historiales. La actividad está incompleta; volvé a consultarla.</p>}
    {datos && !datos.eventos.length && <p>Todavía no hay movimientos registrados para mostrar.</p>}
    <ol className="activity-timeline">{datos?.eventos.map(h => <li key={h.id}><span className="activity-dot" aria-hidden="true"/><div><strong><time dateTime={h.fecha} title={fechaVisible(h.fecha)}>{new Date(h.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}</time> · {h.titulo}</strong><p><Link to={`/pedidos/${h.pedidoId}`}>{h.codigo}</Link> · {h.usuario || h.cliente || 'Alta de pedido'}</p></div></li>)}</ol>
  </section>
}
