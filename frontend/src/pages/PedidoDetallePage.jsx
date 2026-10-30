import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obtenerPedido } from '../api/pedidos.js'
import { listarAsignaciones } from '../api/asignaciones.js'
import { mensajeError } from '../api/client.js'
import PedidoInformacion from '../components/PedidoInformacion.jsx'
import HistorialPedido from '../components/HistorialPedido.jsx'
import MapPreview from '../components/MapPreview.jsx'
import EstadoValidacionBadge from '../components/EstadoValidacionBadge.jsx'
import CompletarImporte from '../components/CompletarImporte.jsx'
import PagoPedido from '../components/PagoPedido.jsx'
import ComprobantesPedido from '../components/ComprobantesPedido.jsx'
import ProcesoCarga from '../components/ProcesoCarga.jsx'
import Paginacion from '../components/Paginacion.jsx'
import usePagination from '../components/usePagination.js'
import { fechaVisible } from '../components/pedidoListado.js'
import { moneda } from '../components/importes.js'
import '../pages/Pedidos.css'

const ESTADOS = ['EN STOCK', 'EN PREPARACIÓN', 'EN ENVÍO', 'ENTREGADO', 'PAGADO']
const ETIQUETAS = ['En stock', 'En preparación', 'En envío', 'Entregado', 'Pagado']

export default function PedidoDetallePage() {
  const { id } = useParams()
  return <ContenidoPedido key={id} id={id}/>
}

function ContenidoPedido({ id }) {
  const [pedido, setPedido] = useState(null)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  const [vista, setVista] = useState('historial')
  const geo = usePagination(pedido?.intentos ?? [], `${id}-${intento}`)
  useEffect(() => {
    let vigente = true
    Promise.allSettled([obtenerPedido(id), listarAsignaciones()]).then(([detalle, asignaciones]) => {
      if (detalle.status === 'rejected') throw detalle.reason
      const asignacion = asignaciones.status === 'fulfilled' ? asignaciones.value.find(p => String(p.id) === String(id)) : null
      if (vigente) setPedido({ ...detalle.value, chofer_id: asignacion?.chofer_id, chofer_nombre: asignacion?.chofer_nombre, asignacion_desconocida: !asignacion })
    })
      .catch(e => { if (vigente) setError(mensajeError(e)) })
    return () => { vigente = false }
  }, [id, intento])
  return <main className="main-content pedido-detail-page">
    <Link className="detail-back" to="/">← Todos los pedidos</Link>
    <header className="page-header"><div><p className="eyebrow">Pedidos / Detalle del envío</p><h1>{pedido ? `Pedido ${pedido.codigo || `#${pedido.id}`}` : 'Detalle del pedido'}</h1><p className="subtitle">{pedido ? `Creado ${fechaVisible(pedido.created_at) || 'sin fecha informada'}` : 'Toda la información del envío, en un solo lugar.'}</p></div>
      {pedido && <div className="detail-header-actions"><span className="detail-state">{pedido.estado}</span><Link className="button button-outline" to={`/pedidos/${id}/revision`}>Revisar dirección</Link><Link className="button button-primary" to="/asignaciones">Preparación y despacho →</Link></div>}
    </header>
    {error && <div className="users-alert" role="alert">{error} <button className="button button-outline" onClick={() => { setError(''); setIntento(i => i + 1) }}>Reintentar detalle</button></div>}
    {!pedido && !error && <ProcesoCarga titulo="Abriendo tu pedido…" detalle="Consultando datos y ubicación registrados."/>}
    {pedido && <>
      <div className="detail-grid"><div className="detail-main-column">
        <section className="panel detail-information-panel"><div className="section-heading"><h2>Todo lo que necesitás saber</h2></div>
          <dl className="detail-quick-summary"><div><dt>Destino</dt><dd>{[pedido.calle, pedido.altura].filter(Boolean).join(' ') || 'Sin dirección'}<small>{[pedido.piso_depto, pedido.localidad].filter(Boolean).join(' · ')}</small></dd></div><div><dt>Chofer</dt><dd>{pedido.chofer_nombre || (pedido.asignacion_desconocida ? 'No disponible' : 'Sin asignar')}<small>{pedido.chofer_nombre ? 'Asignación registrada' : 'Consultá en Asignaciones'}</small></dd></div><div><dt>Importe total</dt><dd>{pedido.importe_total == null ? 'Sin importe' : moneda(pedido.importe_total)}<small>{pedido.pago_metodo ? pedido.estado === 'PAGADO' ? 'Pago confirmado' : 'Pago pendiente de acreditación' : 'Sin pago registrado'}</small></dd></div></dl>
          <details className="detail-expanded-info"><summary>Datos del cliente e indicaciones</summary><PedidoInformacion pedido={pedido}/></details>
          <details className="detail-expanded-info"><summary>Etapas del envío</summary><ol className="detail-stages">{ESTADOS.map((estado, i) => <li key={estado} className={pedido.estado === estado ? 'active' : ''} aria-current={pedido.estado === estado ? 'step' : undefined}><span>{i + 1}</span>{ETIQUETAS[i]}</li>)}</ol></details>
          <CompletarImporte pedido={pedido} onGuardado={p => setPedido(actual => ({ ...actual, ...p }))}/></section>
        <section className="panel detail-history-panel"><h2>Cada paso queda registrado.</h2><nav className="detail-tabs" aria-label="Información del pedido"><button aria-pressed={vista === 'historial'} onClick={() => setVista('historial')}>Historial del pedido</button><button aria-pressed={vista === 'ubicacion'} onClick={() => setVista('ubicacion')}>Historial geográfico</button><button aria-pressed={vista === 'pago'} onClick={() => setVista('pago')}>Pago y comprobantes</button></nav>
          {vista === 'historial' && <HistorialPedido pedidoId={id} operador pedido={pedido}/>}
          {vista === 'ubicacion' && <section aria-label="Historial geográfico"><h2>Revisión de la ubicación</h2>{geo.items.map(h => <article className="geo-history-event" key={h.id}><strong>{h.accion_operador || h.resultado || 'Búsqueda de ubicación'}</strong><time>{fechaVisible(h.fecha) || 'Sin fecha informada'}</time><p>{h.direccion_enviada}</p><small>{[h.resultado, h.nivel_confianza].filter(Boolean).join(' · ')}</small></article>)}{!geo.items.length && <p>Todavía no hay intentos de geocodificación.</p>}<Paginacion datos={geo} nombre="eventos geográficos"/></section>}
          {vista === 'pago' && <><PagoPedido pedido={pedido} soloLectura/><ComprobantesPedido pedidoId={id}/></>}
        </section>
      </div><aside className="detail-map-column"><section className="panel detail-map-panel"><h2>Ubicación del pedido</h2><EstadoValidacionBadge estado={pedido.estado_validacion}/><MapPreview latitud={pedido.latitud} longitud={pedido.longitud} etiqueta={pedido.direccion_original}/><p>{pedido.direccion_original || [pedido.calle, pedido.altura, pedido.localidad].filter(Boolean).join(' ')}</p><Link className="button button-outline" to={`/pedidos/${id}/revision`}>Revisar ubicación →</Link></section><div className="detail-safe-note">Cada cambio conserva su historial. La entrega y el pago se registran por separado.</div></aside></div>
    </>}
  </main>
}
