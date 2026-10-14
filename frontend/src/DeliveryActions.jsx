import { useEffect, useRef, useState } from 'react'
import { api } from './api.js'
import './DeliveryActions.css'

const reasons = { cliente_ausente: 'Cliente ausente', rechazado: 'Entrega rechazada', direccion_incorrecta: 'Dirección incorrecta', sin_acceso: 'No se pudo acceder', otro: 'Otro motivo' }

export default function DeliveryActions({ order, onSaved, allowRetry = false }) {
  const [outcome, setOutcome] = useState(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const retryKey = useRef(null)
  async function retry() {
    setPending(true); setError('')
    try { retryKey.current ||= crypto.randomUUID(); onSaved(await api(`/pedidos/${order.id}/reintentar`, { method: 'POST', headers: { 'Idempotency-Key': retryKey.current }, body: {} })); retryKey.current = null }
    catch (failure) { setError(failure.message) }
    finally { setPending(false) }
  }
  return <div className="delivery-actions">
    {order.estado === 'en_camino' && <><button className="button button-primary" type="button" onClick={() => setOutcome('entregado')}>Registrar entrega</button><button className="button button-outline" type="button" onClick={() => setOutcome('fallido')}>Intento fallido</button></>}
    {allowRetry && order.estado === 'fallido' && <button className="button button-outline" type="button" disabled={pending} onClick={retry}>{pending ? 'Preparando…' : 'Preparar reintento'}</button>}
    {error && <p role="alert" className="delivery-error">{error}</p>}
    {outcome && <ResultModal order={order} outcome={outcome} onClose={() => setOutcome(null)} onSaved={(result) => { onSaved(result); setOutcome(null) }}/>}
  </div>
}

function ResultModal({ order, outcome, onClose, onSaved }) {
  const dialog = useRef(null)
  const [key] = useState(() => crypto.randomUUID())
  const [receptor, setReceiver] = useState('')
  const [metodoPago, setPaymentMethod] = useState('')
  const [motivo, setReason] = useState('cliente_ausente')
  const [observacion, setNote] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { const element = dialog.current; element.showModal(); return () => { if (element.open) element.close() } }, [])
  async function save(event) {
    event.preventDefault(); if (pending) return
    setPending(true); setError('')
    try {
      const body = { resultado: outcome, ...(outcome === 'entregado' ? { receptor, metodoPago } : { motivo }), observacion }
      const result = await api(`/pedidos/${order.id}/resultado`, { method: 'POST', headers: { 'Idempotency-Key': key }, body })
      onSaved(result)
    } catch (failure) { setError(failure.message) }
    finally { setPending(false) }
  }
  return <dialog ref={dialog} className="delivery-modal" aria-labelledby={`delivery-title-${order.id}`} onClose={() => { if (!dialog.current?.open) onClose() }} onCancel={(event) => { if (pending) event.preventDefault() }} onClick={(event) => { if (!pending && event.target === event.currentTarget) dialog.current.close() }}>
    <form onSubmit={save}><header><div><p>{order.codigo}</p><h2 id={`delivery-title-${order.id}`}>{outcome === 'entregado' ? 'Registrar entrega' : 'Registrar intento fallido'}</h2></div><button type="button" className="order-map-close" disabled={pending} aria-label="Cerrar registro" onClick={() => dialog.current.close()}>×</button></header>
      <p className="delivery-destination">{order.calle} {order.altura}, {order.localidad}</p>
      {outcome === 'entregado' ? <label>Nombre de quien recibió<input required maxLength={150} value={receptor} disabled={pending} onChange={(event) => setReceiver(event.target.value)}/></label> : <label>Motivo<select value={motivo} disabled={pending} onChange={(event) => setReason(event.target.value)}>{Object.entries(reasons).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
      {outcome === 'entregado' && <fieldset className="delivery-payment-options" disabled={pending}><legend>Método de pago</legend>{[['efectivo', 'Efectivo'], ['transferencia', 'Transferencia']].map(([value, label]) => <label key={value}><input type="radio" name={`payment-${order.id}`} value={value} required checked={metodoPago === value} onChange={(event) => setPaymentMethod(event.target.value)}/><span>{label}</span></label>)}</fieldset>}
      <label>Observación (opcional)<textarea maxLength={1000} rows={3} value={observacion} disabled={pending} onChange={(event) => setNote(event.target.value)}/></label>
      {outcome === 'entregado' && <p className="delivery-hint">Este registro confirma la entrega. El pago se registra por separado.</p>}
      {error && <p role="alert" className="delivery-error">{error}</p>}
      <footer><button type="button" className="button button-outline" disabled={pending} onClick={() => dialog.current.close()}>Cancelar</button><button type="submit" className="button button-primary" disabled={pending}>{pending ? 'Guardando…' : 'Confirmar registro'}</button></footer>
    </form>
  </dialog>
}

export function DeliveryHistory({ orderId, version }) {
  const [history, setHistory] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    api(`/pedidos/${orderId}/entregas`, { signal: controller.signal }).then((data) => { if (!controller.signal.aborted) { setHistory(data); setError('') } }).catch((failure) => { if (!controller.signal.aborted) setError(failure.message) })
    return () => controller.abort()
  }, [orderId, version])
  return <section className="order-detail-card delivery-history"><h3>Historial de entregas e intentos</h3>{error && <p role="alert" className="delivery-error">{error}</p>}{!history && !error && <p role="status">Cargando historial…</p>}{history?.length === 0 && <p>Todavía no se registraron entregas ni intentos.</p>}
    {history?.map((event) => <article key={event.id}><strong>{event.accion === 'reintento' ? 'Reintento preparado' : event.resultado === 'entregado' ? 'Entregado' : 'Intento fallido'}</strong><small>{new Date(event.fecha).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} · {event.responsableNombre || event.responsable}</small>{event.receptor && <p>Recibió: {event.receptor}</p>}{event.metodoPago && <p>Método de pago: {event.metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia'}</p>}{event.motivo && <p>Motivo: {reasons[event.motivo] || event.motivo}</p>}{event.observacion && <p>{event.observacion}</p>}</article>)}
  </section>
}
