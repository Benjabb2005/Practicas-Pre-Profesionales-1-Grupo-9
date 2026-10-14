import { useEffect, useState } from 'react'
import { api } from './api.js'
import DeliveryActions from './DeliveryActions.jsx'

export default function DispatchPanel({ order, onUpdated, compact = false, driverOptions, driverError, stateLabel }) {
  const [drivers, setDrivers] = useState(null)
  const [assigned, setAssigned] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [assignedName, setAssignedName] = useState('')
  const [operationLoaded, setOperationLoaded] = useState(false)
  const [operationRefresh, setOperationRefresh] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    const options = compact ? Promise.resolve(driverOptions) : api('/choferes', { signal: controller.signal })
    options.then(async (data) => {
      if (controller.signal.aborted) return
      setError('')
      setOperationLoaded(false)
      setDrivers(data)
      if (data?.enabled) {
        const operation = await api(`/pedidos/${order.id}/operacion`, { signal: controller.signal })
        if (!controller.signal.aborted) { setAssigned(String(operation.choferId || '')); setAssignedName(operation.choferNombre || ''); setOperationLoaded(true) }
      }
    }).catch((failure) => { if (!controller.signal.aborted) setError(failure.message) })
    return () => controller.abort()
  }, [order.id, compact, driverOptions, operationRefresh])
  async function act(action, body = {}) {
    setPending(true); setError('')
    try { const updated = await api(`/pedidos/${order.id}/${action}`, { method: 'POST', body }); setAssigned(String(updated.choferId || '')); setAssignedName(updated.choferNombre || ''); onUpdated(updated) }
    catch (failure) { setError(failure.message) }
    finally { setPending(false) }
  }
  const beforeDeparture = ['pendiente_validacion', 'requiere_revision', 'direccion_validada', 'listo_despacho', 'en_preparacion'].includes(order.estado)
  if (compact) return <>
    <td className="order-driver-cell" data-label="Chofer">{drivers?.enabled ? <select aria-label={`Chofer de ${order.codigo}`} disabled={pending || !operationLoaded || !beforeDeparture} value={assigned} onChange={(event) => act('asignar', { choferId: event.target.value ? Number(event.target.value) : null })}>
      <option value="">Sin asignar</option>{assigned && !drivers.drivers.some((driver) => String(driver.id) === assigned) && <option value={assigned}>{assignedName || 'Chofer asignado'} · Inactivo</option>}{drivers.drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.nombre}</option>)}
    </select> : <span>{driverError || error ? 'Chofer no disponible' : drivers ? 'Operación no activada' : 'Cargando…'}</span>}</td>
    <td className="order-state-cell" data-label="Estado"><span className={`order-state-badge ${order.estado}`}>{stateLabel}</span>
      <DeliveryActions order={order} allowRetry onSaved={(saved) => { if (saved.estado === 'en_preparacion') { setAssigned(''); setAssignedName('') } onUpdated({ ...order, ...saved }) }}/>
      {drivers?.enabled && beforeDeparture && <button type="button" className={`button ${order.estado === 'en_preparacion' ? 'button-primary' : 'button-outline'}`} disabled={pending || !operationLoaded} onClick={() => act(order.estado === 'en_preparacion' ? 'despachar' : 'preparar')} aria-label={`${order.estado === 'en_preparacion' ? 'Despachar' : 'Preparar'} ${order.codigo}`}>{order.estado === 'en_preparacion' ? 'Despachar' : 'Pasar a preparación'}</button>}
      {pending && <span role="status">Guardando…</span>}{error && <p role="alert" className="order-row-error">{error} <button type="button" className="button button-outline" disabled={pending} onClick={() => setOperationRefresh((value) => value + 1)}>Reintentar</button></p>}
    </td>
  </>
  return <section className="location-review" aria-label="Asignación y despacho"><h3>Asignación y despacho</h3>
    {!drivers && !error && <p role="status">Cargando choferes…</p>}
    {drivers?.enabled === false && <p>La operación todavía no está activada en este entorno.</p>}
    {drivers?.enabled && <><label htmlFor={`driver-${order.id}`}>Chofer<select id={`driver-${order.id}`} disabled={pending || !beforeDeparture} value={assigned} onChange={(event) => setAssigned(event.target.value)}><option value="">Sin asignar</option>{drivers.drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.nombre}</option>)}</select></label>
      {beforeDeparture ? <><button type="button" className="button button-outline" disabled={pending} onClick={() => act('asignar', { choferId: assigned ? Number(assigned) : null })}>Guardar asignación</button>
        {order.estado !== 'en_preparacion' && <button type="button" className="button button-outline" disabled={pending || !order.confirmation} onClick={() => act('preparar')}>Pasar a En preparación</button>}
        {order.estado === 'en_preparacion' && <button type="button" className="button button-primary" disabled={pending || !order.confirmation} onClick={() => act('despachar')}>Despachar · En envío</button>}
        <p>Para salir debe tener ubicación confirmada y chofer activo asignado. Guardá la asignación antes de despachar.</p></> : <p>El pedido ya salió; la asignación no se puede cambiar.</p>}
    </>}{pending && <p role="status">Guardando operación…</p>}{error && <p role="alert" className="login-error">{error}</p>}
  </section>
}
