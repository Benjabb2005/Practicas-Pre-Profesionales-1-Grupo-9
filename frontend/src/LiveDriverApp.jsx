import { useEffect, useRef, useState } from 'react'
import { api } from './api.js'
import { OrderMapLink } from './LocationReview.jsx'
import './DriverApp.css'
import './LiveDriverApp.css'
import DeliveryActions, { DeliveryHistory } from './DeliveryActions.jsx'

const views = { en_camino: 'Pendientes', entregado: 'Entregadas', fallido: 'Fallidas' }
const statuses = { en_camino: { label: 'EN ENVÍO', style: 'next' }, entregado: { label: 'ENTREGADO', style: 'completed' }, fallido: { label: 'INTENTO FALLIDO', style: 'failed' } }

export default function LiveDriverApp({ user, onLogout, logoutError }) {
  const [result, setResult] = useState(null)
  const [page, setPage] = useState(1)
  const [retry, setRetry] = useState(0)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState('')
  const [view, setView] = useState('en_camino')
  const [detail, setDetail] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    api(`/chofer/pedidos?page=${page}&vista=${view}`, { signal: controller.signal }).then((data) => { if (!controller.signal.aborted) { setResult(data); setError('') } }).catch((failure) => { if (!controller.signal.aborted) setError(failure.message) })
    return () => controller.abort()
  }, [page, retry, view])
  const initials = user.nombre.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const summary = result?.summary
  const finished = summary ? summary.entregados + summary.fallidos : 0
  function changeView(value) { setView(value); setPage(1); setResult(null); setError('') }
  function saved(outcome) {
    setResult(null); setPage(1); setView(outcome.estado); setRetry((value) => value + 1); setError('')
    setCompleted(outcome.estado === 'entregado' ? 'Entrega registrada correctamente.' : 'Intento fallido registrado. El equipo podrá preparar otro intento.')
  }
  return <main className="driver-page live-driver"><div className="driver-shell">
    <header className="driver-header"><div className="driver-brand">
      <span className="driver-brand-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7.5" cy="19" r="1.7"/><circle cx="18" cy="19" r="1.7"/></svg></span>
      <span className="driver-brand-copy"><strong>MandáTodo</strong><small>TUS ENVÍOS{summary ? ` · ${summary.total} PARADAS` : ''}</small></span>
    </div><button className="driver-logout" type="button" onClick={onLogout}>Cerrar sesión</button></header>
    <section className="driver-intro" aria-labelledby="live-driver-title"><div><p className="driver-eyebrow">¡Hola! Estas son tus entregas</p><h1 id="live-driver-title">{user.nombre}</h1><span className="driver-online"><span/>{error ? 'Sin actualizar' : 'Sesión activa'}</span></div><span className="driver-avatar" aria-label={user.nombre}>{initials}</span></section>
    <section className="driver-progress" aria-label="Avance de tus envíos"><div className="driver-progress-heading"><h2>Avance de tus envíos</h2><strong>{summary ? `${finished} / ${summary.total}` : '—'} <span>Finalizados</span></strong></div><progress value={finished} max={summary?.total || 1} aria-label={summary ? `${finished} de ${summary.total} envíos finalizados` : 'Cargando avance'}/><div className="live-driver-counts"><span><strong>{summary?.pendientes ?? '—'}</strong> pendientes</span><span><strong>{summary?.entregados ?? '—'}</strong> entregados</span><span><strong>{summary?.fallidos ?? '—'}</strong> fallidos</span></div></section>
    <div className="live-driver-list-heading"><h2>Mis paradas</h2><button className="button button-outline" type="button" onClick={() => { setResult(null); setError(''); setRetry((value) => value + 1) }}>Actualizar</button></div>
    <nav className="live-driver-tabs" aria-label="Vista de envíos">{Object.entries(views).map(([value, label]) => <button type="button" key={value} aria-pressed={view === value} onClick={() => changeView(value)}>{label}</button>)}</nav>
    <p className="live-driver-hint">Pedidos que siguen asignados a vos. Los pendientes aparecen después del despacho.</p>
    {completed && <p role="status" className="live-driver-hint">{completed}</p>}
    {(error || logoutError) && <p className="login-error" role="alert">{error || logoutError}</p>}{!result && !error && <section className="live-driver-empty" role="status">Cargando tus envíos…</section>}
    {result && <><section className="driver-stops" aria-label="Envíos asignados">{result.data.map((order, index) => <article className="driver-stop" key={order.id}>
      <div className="driver-stop-heading"><span className="driver-stop-number" aria-hidden="true">{(page - 1) * 20 + index + 1}</span><strong className="live-driver-code">{order.codigo}</strong><span className={`driver-stop-status ${statuses[order.estado].style}`}>{statuses[order.estado].label}</span></div>
      <div className="driver-stop-detail"><span>DESTINATARIO</span><h3>{order.nombre} {order.apellido}</h3><p className="live-driver-address">{order.calle} {order.altura}{order.pisoDepto ? ` · ${order.pisoDepto}` : ''}</p><p className="live-driver-locality">{order.localidad}, {order.provincia} · CP {order.codigoPostal}</p><a className="live-driver-phone" href={`tel:${order.telefono.replace(/[^+\d]/g, '')}`}>{order.telefono}</a>{order.observaciones && <p className="live-driver-notes"><strong>Indicaciones</strong>{order.observaciones}</p>}</div>
      <div className="live-driver-card-tools"><OrderMapLink orderId={order.id} className="driver-map-button"/><button type="button" className="driver-map-button" onClick={() => setDetail(order)}>Ver detalle</button></div>
      <DeliveryActions order={order} onSaved={saved}/>
      {order.estado !== 'en_camino' && <p className="live-driver-result-hint">{order.estado === 'entregado' ? 'Entrega registrada. Consultá el receptor y el método de pago en el detalle.' : 'Intento registrado. Consultá el motivo en el detalle.'}</p>}
    </article>)}</section>
      {result.data.length === 0 && <section className="live-driver-empty"><span className="live-driver-empty-icon" aria-hidden="true">⌖</span><h2>{view === 'en_camino' ? 'No tenés entregas pendientes' : view === 'entregado' ? 'Todavía no tenés entregas registradas' : 'No tenés intentos fallidos en esta vista'}</h2><p>{view === 'en_camino' ? 'Cuando el equipo despache un pedido a tu nombre, aparecerá acá con sus datos y ubicación.' : 'Los resultados de tus envíos aparecen acá después de registrarlos.'}</p></section>}
      {(page > 1 || result.hasMore) && <div className="order-pagination"><button className="button button-outline" disabled={page === 1} onClick={() => { setResult(null); setPage(page - 1) }}>Anterior</button><span>Página {page}</span><button className="button button-outline" disabled={!result.hasMore} onClick={() => { setResult(null); setPage(page + 1) }}>Siguiente</button></div>}</>}
    {detail && <DriverOrderDetail key={detail.id} order={detail} onClose={() => setDetail(null)}/>}
  </div></main>
}

function DriverOrderDetail({ order, onClose }) {
  const dialog = useRef(null)
  useEffect(() => { const element = dialog.current; element.showModal(); return () => { if (element.open) element.close() } }, [])
  return <dialog ref={dialog} className="delivery-modal driver-details-modal" aria-labelledby={`driver-detail-${order.id}`} onClose={() => { if (!dialog.current?.open) onClose() }} onClick={(event) => { if (event.target === event.currentTarget) dialog.current.close() }}>
    <div className="driver-details-content"><header><div><p>Detalle de {order.codigo}</p><h2 id={`driver-detail-${order.id}`}>{order.nombre} {order.apellido}</h2></div><button type="button" className="order-map-close" aria-label="Cerrar detalle" onClick={() => dialog.current.close()}>×</button></header>
      <p className={`driver-stop-status ${statuses[order.estado].style}`}>{statuses[order.estado].label}</p><section className="driver-details-address"><h3>Dirección de entrega</h3><p>{order.calle} {order.altura}{order.pisoDepto ? ` · ${order.pisoDepto}` : ''}</p><p>{order.localidad}, {order.provincia} · CP {order.codigoPostal}</p><a href={`tel:${order.telefono.replace(/[^+\d]/g, '')}`}>Llamar al {order.telefono}</a>{order.observaciones && <p>Indicaciones: {order.observaciones}</p>}<OrderMapLink orderId={order.id}/></section>
      <DeliveryHistory orderId={order.id} version={order.estado}/>
    </div>
  </dialog>
}
