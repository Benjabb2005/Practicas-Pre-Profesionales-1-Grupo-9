import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { api, initialAddressVersion } from './api.js'
import { browserGeoref } from './georef.js'
import './LocationReview.css'

export function OrderMapLink({ orderId, className = 'button button-outline' }) {
  const [open, setOpen] = useState(false)
  return <><button type="button" className={className} onClick={() => setOpen(true)}>Ver ubicación</button>{open && <OrderMapModal orderId={orderId} onClose={() => setOpen(false)}/>}</>
}

function OrderMapModal({ orderId, onClose }) {
  const dialog = useRef(null)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    const controller = new AbortController()
    async function load() {
      try {
        const session = await api('/sesion', { signal: controller.signal })
        const path = session.usuario.rol === 'chofer' ? `/chofer/pedidos/${orderId}` : `/pedidos/${orderId}`
        const data = await api(path, { signal: controller.signal })
        if (!controller.signal.aborted) setOrder(data)
      } catch (failure) { if (!controller.signal.aborted) setError(failure.message) }
    }
    load()
    return () => { controller.abort(); if (element.open) element.close() }
  }, [orderId])
  return <dialog ref={dialog} className="order-map-modal" aria-labelledby={`map-title-${orderId}`} onClose={() => { if (!dialog.current?.open) onClose() }} onClick={(event) => { if (event.target === event.currentTarget) dialog.current.close() }}>
    <div className="order-map-content"><header><div><p>Ubicación del pedido</p><h2 id={`map-title-${orderId}`}>{order?.codigo || 'Mapa de entrega'}</h2></div><button type="button" className="order-map-close" aria-label="Cerrar mapa" onClick={() => dialog.current.close()}>×</button></header>
      {error && <p role="alert" className="login-error">{error}</p>}
      {!order && !error && <p role="status">Cargando ubicación…</p>}
      {order && <><p className="order-map-address">{order.calle} {order.altura}, {order.localidad}, {order.provincia}</p><ConfirmedMap confirmation={order.confirmation}/></>}
    </div>
  </dialog>
}

function Map({ point, onPoint }) {
  const element = useRef(null)
  const [tileError, setTileError] = useState(false)
  useEffect(() => {
    const validPoint = Number.isFinite(point?.lat) && Number.isFinite(point?.lng) && Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180
    const map = L.map(element.current).setView(validPoint ? [point.lat, point.lng] : [-38.4, -63.6], validPoint ? 16 : 4)
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map)
    tiles.on('tileerror', () => setTileError(true))
    if (validPoint) {
      const marker = L.marker([point.lat, point.lng], { draggable: Boolean(onPoint), icon: L.divIcon({ className: 'location-pin', iconSize: [20, 20], iconAnchor: [10, 10] }), title: onPoint ? 'Arrastrá para ajustar la ubicación' : 'Ubicación confirmada' }).addTo(map)
      if (onPoint) marker.on('dragend', () => { const position = marker.getLatLng(); onPoint({ lat: position.lat, lng: position.lng }) })
    }
    if (onPoint) map.on('click', (event) => onPoint({ lat: event.latlng.lat, lng: event.latlng.lng }))
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(element.current)
    return () => { observer.disconnect(); map.remove() }
  }, [point, onPoint])
  return <>{tileError && <p role="alert">La cartografía no pudo cargarse. No confirmes sin revisar la ubicación.</p>}<div className="location-map" ref={element} aria-label="Mapa de revisión de ubicación"/></>
}

export function ConfirmedMap({ confirmation }) {
  return confirmation ? <Map point={{ lat: confirmation.lat, lng: confirmation.lng }}/> : <p>La ubicación requiere revisión del equipo antes de continuar.</p>
}

export function LocationReview({ order, onConfirmed }) {
  const [editing, setEditing] = useState(false)
  const canEdit = ['pendiente_validacion', 'requiere_revision', 'direccion_validada', 'en_preparacion'].includes(order.estado)
  if (editing && canEdit) return <section><LocationEditor order={order} onConfirmed={(updated) => { onConfirmed(updated); setEditing(false) }}/><button type="button" className="button button-outline" onClick={() => setEditing(false)}>Cancelar edición</button></section>
  return <section className="location-review" aria-label="Ubicación del pedido"><h3>{order.confirmation ? 'Ubicación confirmada' : 'Ubicación pendiente de revisión'}</h3>
    {order.confirmation && <><OrderMapLink orderId={order.id}/><p>{order.confirmation.observation}</p></>}
    {canEdit ? <button type="button" className="button button-outline" onClick={() => setEditing(true)}>Editar ubicación</button> : <p>En este estado, la ubicación está disponible solo para consulta.</p>}
  </section>
}

function LocationEditor({ order, onConfirmed }) {
  const [result, setResult] = useState(null)
  const [point, setPoint] = useState(order.confirmation ? { lat: order.confirmation.lat, lng: order.confirmation.lng } : null)
  const [observation, setObservation] = useState('')
  const [reviewed, setReviewed] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const controller = useRef(null)
  useEffect(() => () => controller.current?.abort(), [])
  async function locate() {
    controller.current?.abort()
    controller.current = new AbortController()
    setPending(true); setError(''); setResult(null); setReviewed(false)
    try {
      let data
      try { data = await api(`/pedidos/${order.id}/ubicacion/candidatos`, { method: 'POST', body: {}, signal: controller.current.signal }) }
      catch (failure) {
        if (controller.current.signal.aborted || !['GEOREF_TIMEOUT', 'GEOREF_UNAVAILABLE'].includes(failure.code)) throw failure
        data = { ...await browserGeoref(order, controller.current.signal), version: order.version }
      }
      if (data.version !== order.version) throw new Error('La dirección cambió. Volvé a abrir el detalle.')
      setResult(data)
    } catch (failure) { if (!controller.current.signal.aborted) setError(failure.message) }
    finally { setPending(false) }
  }
  async function confirm() {
    controller.current?.abort()
    controller.current = new AbortController()
    setPending(true); setError('')
    try {
      const confirmed = await api(`/pedidos/${order.id}/ubicacion/confirmacion`, { method: 'POST', body: { version: order.version, ...point, observation }, signal: controller.current.signal })
      if (!controller.current.signal.aborted) { onConfirmed(confirmed); setReviewed(false); setObservation('') }
    }
    catch (failure) { if (!controller.current.signal.aborted) setError(failure.message) }
    finally { setPending(false) }
  }
  const choose = useCallback((value) => { setPoint(value); setReviewed(false) }, [])
  return <section className="location-review" aria-label="Revisión de ubicación"><h3>Ubicación del pedido</h3>
    {order.addressRevision === null && <p role="status">La confirmación todavía no está activada en este entorno. Podés consultar el mapa.</p>}
    {order.confirmation && <p role="status">Confirmada por {order.confirmation.user} · {new Date(order.confirmation.date).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}. {order.confirmation.observation}</p>}
    <p>Georef sugiere ubicaciones aproximadas. Revisá el destino; seleccionar un candidato no lo confirma.</p>
    <button type="button" className="button button-outline" disabled={pending} onClick={locate}>{pending ? 'Procesando…' : 'Consultar Georef'}</button>
    {error && <p role="alert" className="login-error">{error}</p>}
    {result && <><p role="status">{result.status === 'zero_results' ? 'Sin resultados. Podés ubicar el destino manualmente.' : `${result.candidates.length} candidato(s). Revisá calle, altura y localidad.`}</p><div className="location-candidates">{result.candidates.map((candidate) => <button key={candidate.id} type="button" className="button button-outline" disabled={candidate.lat === null || pending} onClick={() => choose({ lat: candidate.lat, lng: candidate.lng })}>{candidate.label}{candidate.lat === null ? ' · Sin coordenadas' : ' · Aproximada'}</button>)}</div></>}
    <p>Hacé clic en el mapa o arrastrá el pin para corregir la ubicación.</p>
    <Map point={point} onPoint={choose}/>
    <label>Observación de revisión / corrección<textarea maxLength={1000} value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="Explicá cómo verificaste el destino y cualquier corrección."/></label>
    <label className="location-ack"><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)}/>Revisé personalmente la dirección y el punto del mapa.</label>
    <button type="button" className="button button-primary" disabled={order.addressRevision === null || pending || !reviewed || !observation.trim() || !Number.isFinite(point?.lat) || Math.abs(point.lat) > 90 || !Number.isFinite(point?.lng) || Math.abs(point.lng) > 180} onClick={confirm}>Confirmar ubicación</button>
    <p>La nueva revisión se guarda en el historial de este pedido.</p>
  </section>
}

export function DraftLocationReview({ address, onSave, disabled, saving, saveError }) {
  const complete = ['calle', 'altura', 'localidad', 'provincia', 'codigoPostal'].every((field) => address[field].trim()) && /^\d+$/.test(address.altura) && Number(address.altura) > 0
  const [result, setResult] = useState(null)
  const [point, setPoint] = useState(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState(complete ? 'waiting' : 'incomplete')
  const [observation, setObservation] = useState('')
  const [manual, setManual] = useState(false)
  const [retry, setRetry] = useState(0)
  const [version, setVersion] = useState('')
  useEffect(() => {
    if (!complete) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setStatus('loading'); setError(''); setResult(null); setPoint(null); setManual(false)
      try {
        const fingerprint = await initialAddressVersion(address)
        if (controller.signal.aborted) return
        setVersion(fingerprint)
        let data
        try { data = await api('/ubicacion/candidatos', { method: 'POST', body: { direccion: address }, signal: controller.signal }) }
        catch (failure) {
          if (controller.signal.aborted || !['GEOREF_TIMEOUT', 'GEOREF_UNAVAILABLE'].includes(failure.code)) throw failure
          data = { ...await browserGeoref(address, controller.signal), version: fingerprint }
        }
        if (controller.signal.aborted) return
        setResult(data); setStatus('ready')
        if (data.candidates.length === 1 && data.candidates[0].lat !== null) setPoint({ lat: data.candidates[0].lat, lng: data.candidates[0].lng })
      } catch (failure) {
        if (!controller.signal.aborted) { setError(failure.message); setStatus('error') }
      }
    }, 500)
    return () => { clearTimeout(timer); controller.abort() }
  }, [address, complete, retry])
  const choose = useCallback((value, corrected = true) => { setPoint(value); setManual(corrected) }, [])
  const validPoint = Number.isFinite(point?.lat) && Number.isFinite(point?.lng) && Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180
  return <section className="panel geo-panel draft-location"><h2>Validación Geográfica</h2><p>La ubicación se actualiza al completar la dirección.</p>
    {status === 'incomplete' && <div className="location-placeholder" role="status">Completá calle, altura, localidad, provincia y CP para visualizar la ubicación.</div>}
    {['waiting', 'loading'].includes(status) && <div className="location-placeholder" role="status">Buscando la dirección en Georef…</div>}
    {error && <p role="alert" className="login-error">{error}</p>}
    {result?.status === 'zero_results' && <p role="status">No se encontró la dirección. Ubicá el destino manualmente y explicá la corrección.</p>}
    {result?.candidates.length > 1 && <p role="status">Hay varias coincidencias. Seleccioná la dirección correcta.</p>}
    {result && <div className="location-candidates">{result.candidates.map((candidate) => <button type="button" className="button button-outline" key={candidate.id} disabled={disabled || candidate.lat === null} onClick={() => choose({ lat: candidate.lat, lng: candidate.lng }, false)}>{candidate.label}{candidate.lat === null && ' · Sin coordenadas'}</button>)}</div>}
    {['ready', 'error'].includes(status) && <><Map point={point} onPoint={disabled ? undefined : choose}/><p>Ubicación aproximada. Hacé clic en el mapa o arrastrá el pin para ajustarla.</p>
      <label>{manual ? 'Observación de la corrección (obligatoria)' : 'Observación (opcional)'}<textarea disabled={disabled} maxLength={1000} value={observation} onChange={(event) => setObservation(event.target.value)}/></label>
    </>}
    <button type="button" className="button button-primary" disabled={disabled || !version || !validPoint} onClick={() => { if (manual && !observation.trim()) { setError('Explicá la corrección del punto antes de confirmar.'); return } setError(''); onSave({ ...point, observation: observation.trim() || 'Ubicación propuesta por Georef revisada y confirmada en el mapa.', version }) }}>{saving ? 'Guardando…' : 'Confirmar ubicación y guardar pedido'}</button>
    {saveError && <p role="alert" className="login-error">{saveError}</p>}<p>Al confirmar declarás que revisaste personalmente el punto del mapa.</p>
    {complete && <button type="button" className="button button-outline" disabled={disabled || status === 'loading'} onClick={() => { setRetry((value) => value + 1); setManual(false) }}>Volver a buscar</button>}
    <p>La confirmación queda vinculada a estos datos. Después, asigná un chofer y prepará el despacho desde el tablero.</p>
  </section>
}
