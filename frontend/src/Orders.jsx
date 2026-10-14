import { useEffect, useRef, useState } from 'react'
import { api } from './api.js'
import './Orders.css'
import DispatchPanel from './DispatchPanel.jsx'
import { DeliveryHistory } from './DeliveryActions.jsx'
import { LocationReview, DraftLocationReview, OrderMapLink } from './LocationReview.jsx'

const labels = { pendiente_validacion: 'Pendiente de validación', en_preparacion: 'En preparación', requiere_revision: 'Requiere revisión', direccion_validada: 'Dirección validada', listo_despacho: 'Listo para despacho', en_camino: 'En envío', entregado: 'Entregado', fallido: 'Fallido', cancelado: 'Cancelado' }
const customerFields = [['nombre', 'Nombre', 'text', 100], ['apellido', 'Apellido', 'text', 100], ['dni', 'DNI sin puntos', 'text', 20], ['telefono', 'Teléfono', 'tel', 50], ['email', 'Email', 'email', 150]]
const addressFields = [['calle', 'Calle', 'text', 150], ['altura', 'Altura', 'number', 20], ['pisoDepto', 'Piso/Depto (opcional)', 'text', 100], ['localidad', 'Localidad', 'text', 100], ['provincia', 'Provincia / CABA', 'text', 100], ['codigoPostal', 'Código postal', 'text', 10]]

function Header({ title, subtitle, action, onAction }) {
  return <header className="page-header"><div><p className="eyebrow">Centro de operaciones</p><h1>{title}</h1>{subtitle && <p className="subtitle">{subtitle}</p>}</div><button type="button" className="button button-primary" onClick={onAction}>{action}</button></header>
}

function Input({ field, value, onChange, onBlur, error, disabled }) {
  const [key, label, type, max] = field
  return <label className={`form-field ${key === 'email' ? 'span-2' : key === 'calle' ? 'street-field' : ''}`} htmlFor={`order-${key}`}><span>{label}{key !== 'pisoDepto' && ' *'}</span><input id={`order-${key}`} type={type} value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} required={key !== 'pisoDepto'} maxLength={max} min={type === 'number' ? 1 : undefined} step={type === 'number' ? 1 : undefined} disabled={disabled} aria-invalid={Boolean(error)} aria-describedby={error ? `error-${key}` : undefined}/>{error && <span id={`error-${key}`} className="field-error">{error}</span>}</label>
}

export function OrderForm({ setPage }) {
  const formRef = useRef(null)
  const [cliente, setCliente] = useState(Object.fromEntries(customerFields.map(([key]) => [key, ''])))
  const [direccion, setDireccion] = useState({ direccionOriginal: '', ...Object.fromEntries(addressFields.map(([key]) => [key, ''])) })
  const [observaciones, setObservaciones] = useState('')
  const [query, setQuery] = useState('')
  const [candidates, setCandidates] = useState([])
  const [clienteId, setClienteId] = useState(null)
  const [conflict, setConflict] = useState(false)
  const customerRevision = useRef(0)
  const [searchResult, setSearchResult] = useState({ query: '', rows: [], error: '' })
  const [pending, setPending] = useState(false)
  const [fields, setFields] = useState({})
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(null)
  const [key, setKey] = useState(() => crypto.randomUUID())

  useEffect(() => {
    const term = query.trim()
    if (!term) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      api(`/clientes/frecuentes?q=${encodeURIComponent(term)}`, { signal: controller.signal }).then((rows) => {
        if (!controller.signal.aborted) setSearchResult({ query: term, rows, error: '' })
      }).catch((failure) => {
        if (!controller.signal.aborted) setSearchResult({ query: term, rows: [], error: failure.message })
      })
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query])

  const searching = Boolean(query.trim()) && searchResult.query !== query.trim()
  const searchError = searchResult.query === query.trim() ? searchResult.error : ''
  const visibleCandidates = query.trim() ? searching ? [] : searchResult.rows : candidates

  function selectCustomer(c) {
    customerRevision.current++
    setCliente(Object.fromEntries(customerFields.map(([field]) => [field, field === 'dni' ? String(c[field] || '').replace(/\D/g, '') : c[field] || ''])))
    setClienteId(c.id); setConflict(false); setError(''); setFields({}); setQuery(''); setCandidates([]); setKey(crypto.randomUUID())
  }

  function change(section, field, value) {
    if (section === 'cliente') { customerRevision.current++; setCliente((current) => ({ ...current, [field]: value })); setClienteId(null); setConflict(false); setError(''); setFields({}) }
    else setDireccion((current) => ({ ...current, [field]: value }))
    setKey(crypto.randomUUID())
  }

  async function checkIdentity(field) {
    if (clienteId || !['dni', 'email', 'telefono'].includes(field)) return
    const value = cliente[field].trim()
    if (value.length < 3) return
    if (field === 'email' ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) : value.replace(/\D/g, '').length < 7) return
    const revision = customerRevision.current
    const normalize = (v) => field === 'email' ? String(v || '').trim().toLowerCase() : String(v || '').replace(/\D/g, '')
    try {
      const found = await api(`/clientes/frecuentes?q=${encodeURIComponent(value)}`)
      if (revision !== customerRevision.current) return
      const matches = found.filter((c) => normalize(c[field]) === normalize(value))
      if (matches.length) {
        setCandidates(matches); setConflict(true)
        setFields((current) => ({ ...current, [field]: 'Este dato ya pertenece a un cliente registrado.' }))
        setError('Ya existe un cliente con ese DNI, email o teléfono. Seleccioná el cliente frecuente para cargar otro pedido.')
      }
    } catch (failure) { if (revision === customerRevision.current) setError(failure.message) }
  }

  async function save(event, ubicacion) {
    event?.preventDefault()
    if (!formRef.current?.reportValidity()) { setError('Completá o corregí el campo señalado del formulario antes de guardar.'); return }
    if (pending || conflict) return
    setPending(true); setFields({}); setError('')
    try {
      const pedido = await api('/pedidos', { method: 'POST', headers: { 'Idempotency-Key': key }, body: {
        cliente, direccion, observaciones, ...(clienteId ? { clienteId } : {}), ...(ubicacion ? { ubicacion } : {}),
      } })
      setSaved(pedido)
    } catch (failure) { setFields(failure.fields || {}); setError(failure.message) }
    finally { setPending(false) }
  }

  if (saved) return <main className="main-content"><Header title="Pedido guardado" subtitle={`${saved.codigo} · ${labels[saved.estado]}`} action="Ver tablero" onAction={() => setPage('board')}/><section className="panel persisted-panel" role="status"><h2>El pedido ya está en la base de datos.</h2><p>{saved.calle} {saved.altura}, {saved.localidad}, {saved.provincia}</p><p>{saved.confirmation ? 'Ubicación confirmada y guardada para esta dirección. Podés asignar un chofer, preparar y despachar desde el tablero.' : 'La ubicación todavía requiere revisión y confirmación antes del despacho.'}</p></section></main>

  return <main className="main-content form-page"><Header title="Carga Manual de Pedido" subtitle="Completá los datos obligatorios. El guardado no habilita despacho." action="Ver tablero" onAction={() => setPage('board')}/><div className="order-layout"><form ref={formRef} onSubmit={(event) => event.preventDefault()} className="panel order-panel persisted-form">
    <h2>Cliente y envío</h2><p>Dirección original, Piso/Depto y notas son opcionales.</p>
    <div className="frequent-search"><label htmlFor="frequent-query">Buscar cliente frecuente por DNI, email o teléfono</label><input id="frequent-query" type="search" autoComplete="off" placeholder="Escribí para filtrar clientes…" value={query} maxLength={150} disabled={pending} aria-controls="frequent-results" aria-describedby="frequent-status" onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault() }} onChange={(event) => { setQuery(event.target.value); setSearchResult({ query: '', rows: [], error: '' }) }}/></div>
    <p id="frequent-status" role="status">{searching ? 'Buscando clientes…' : query.trim() && !searchError ? visibleCandidates.length ? `${visibleCandidates.length} ${visibleCandidates.length === 1 ? 'cliente coincidente' : 'clientes coincidentes'}${visibleCandidates.length === 20 ? ' (primeros 20; completá más datos para afinar)' : ''}.` : 'No se encontraron clientes con esos datos.' : 'La lista se actualiza mientras escribís.'}</p>
    {searchError && <p className="login-error" role="alert">{searchError}</p>}
    <ul id="frequent-results" className="candidate-list">{visibleCandidates.map((c) => <li key={c.id}><span><strong>{c.nombre} {c.apellido || ''}</strong><small>DNI: {c.dni || 'Pendiente'} · {c.email || 'Email pendiente'} · {c.telefono || 'Teléfono pendiente'}</small></span><button type="button" disabled={pending || !c.apellido || !c.dni || !c.telefono || !c.email} className="button button-outline" onClick={() => selectCustomer(c)}>Seleccionar</button></li>)}</ul>
    {visibleCandidates.some((c) => !c.apellido || !c.dni || !c.telefono || !c.email) && <p>Los clientes con datos incompletos necesitan corregirse antes de usarlos en un pedido nuevo. No se puede registrar otra persona con sus mismos datos.</p>}
    {clienteId && <p role="status">Cliente frecuente seleccionado. Sus datos no se modificarán.</p>}
    {conflict && error && <p className="login-error" role="alert">{error}</p>}
    <div className="form-divider"><span>Datos del cliente</span></div><div className="fields-grid customer-fields">{customerFields.map((field) => <Input key={field[0]} field={field} value={cliente[field[0]]} disabled={pending} error={fields[field[0]]} onChange={(value) => change('cliente', field[0], value)} onBlur={() => checkIdentity(field[0])}/>)}</div>
    <div className="form-divider"><span>Dirección de entrega</span></div>
    <label className="form-field" htmlFor="order-original"><span>Dirección original recibida (opcional)</span><textarea id="order-original" maxLength={1000} rows={3} value={direccion.direccionOriginal} disabled={pending} onChange={(event) => change('direccion', 'direccionOriginal', event.target.value)} aria-invalid={Boolean(fields.direccionOriginal)}/>{fields.direccionOriginal && <span className="field-error">{fields.direccionOriginal}</span>}</label>
    <div className="fields-grid address-fields">{addressFields.map((field) => <Input key={field[0]} field={field} value={direccion[field[0]]} disabled={pending} error={fields[field[0]]} onChange={(value) => change('direccion', field[0], value)}/>)}</div>
    <label className="form-field" htmlFor="order-notes"><span>Notas / instrucciones (opcional)</span><textarea id="order-notes" rows={3} maxLength={2000} value={observaciones} disabled={pending} onChange={(event) => { setObservaciones(event.target.value); setKey(crypto.randomUUID()) }}/></label>
    {error && !conflict && <p className="login-error" role="alert">{error}</p>}
  </form><aside className="validation-column"><DraftLocationReview key={JSON.stringify(direccion)} address={direccion} disabled={pending || conflict} saving={pending} saveError={error} onSave={(ubicacion) => save(null, ubicacion)}/></aside></div></main>
}

function DetailModal({ children, onClose }) {
  const dialog = useRef(null)
  useEffect(() => { const element = dialog.current; element.showModal(); return () => { if (element.open) element.close() } }, [])
  return <dialog ref={dialog} className="order-detail-modal" aria-labelledby="order-detail-title" onClose={() => { if (!dialog.current?.open) onClose() }} onClick={(event) => { if (event.target === event.currentTarget) dialog.current.close() }}>{children}</dialog>
}

export function Board({ setPage }) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [state, setState] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [dates, setDates] = useState({ fechaDesde: '', fechaHasta: '' })
  const [page, setPageNumber] = useState(1)
  const [refresh, setRefresh] = useState(0)
  const [detail, setDetail] = useState(null)
  const [detailError, setDetailError] = useState('')
  const [driverOptions, setDriverOptions] = useState(null)
  const [driverError, setDriverError] = useState('')
  const [driverRefresh, setDriverRefresh] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    api('/choferes', { signal: controller.signal }).then((data) => { if (!controller.signal.aborted) { setDriverOptions(data); setDriverError('') } }).catch((failure) => { if (!controller.signal.aborted) setDriverError(failure.message) })
    return () => controller.abort()
  }, [driverRefresh])
  useEffect(() => {
    const controller = new AbortController()
    api(`/pedidos?q=${encodeURIComponent(search)}&page=${page}&estado=${encodeURIComponent(state)}&fechaDesde=${dates.fechaDesde}&fechaHasta=${dates.fechaHasta}`, { fullResponse: true, signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) { setResult(data); setError('') }
    }).catch((failure) => { if (!controller.signal.aborted) setError(failure.message) })
    return () => controller.abort()
  }, [page, state, refresh, dates, search])
  async function inspect(id) {
    setDetail(null); setDetailError('')
    try { setDetail(await api(`/pedidos/${id}`)) }
    catch (failure) { setDetailError(failure.message) }
  }
  return <main className="main-content board-page"><Header title="Tablero General de Despacho" action="Cargar nuevo pedido" onAction={() => setPage('form')}/>
    <section className="shipments-card persisted-panel"><form className="filters order-search" onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); setPageNumber(1); setResult(null); setError(''); setRefresh((value) => value + 1) }}>
      <label htmlFor="order-search">Buscar pedido<input id="order-search" type="search" placeholder="N.º de pedido, nombre, DNI o teléfono" maxLength={150} value={searchInput} onChange={(event) => setSearchInput(event.target.value)}/></label>
      <button className="button button-outline" type="submit">Buscar</button>
      {(searchInput || search) && <button className="button button-outline" type="button" onClick={() => { setSearchInput(''); setSearch(''); setPageNumber(1); setResult(null); setError(''); setRefresh((value) => value + 1) }}>Limpiar búsqueda</button>}
    </form><div className="filters"><label htmlFor="order-state">Estado<select id="order-state" value={state} onChange={(event) => { setState(event.target.value); setPageNumber(1); setResult(null) }}><option value="">Todos</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button type="button" className="button button-outline" onClick={() => { setRefresh((v) => v + 1); setDriverRefresh((value) => value + 1); setResult(null); setError('') }}>Actualizar</button></div>
      <div className="filters">{[['fechaDesde', 'Desde'], ['fechaHasta', 'Hasta']].map(([field, label]) => <label key={field} htmlFor={`filter-${field}`}>{label}<input id={`filter-${field}`} type="date" value={dates[field]} onChange={(event) => { setDates((current) => ({ ...current, [field]: event.target.value })); setPageNumber(1); setResult(null) }}/></label>)}</div>
      {driverError && <div role="alert" className="login-error">No se pudieron cargar los choferes. {driverError} <button type="button" className="button button-outline" onClick={() => setDriverRefresh((value) => value + 1)}>Reintentar choferes</button></div>}
      {error && <p className="login-error" role="alert">{error}</p>}{!result && !error && <p role="status">Cargando pedidos…</p>}
      {result && <><p role="status">{result.pagination.total} pedidos con este filtro.</p>{result.data.length === 0 ? <p>Todavía no hay pedidos para este filtro.</p> : <div className="order-table-wrap"><table className="order-table"><thead><tr><th>Código</th><th>Cliente</th><th>Dirección</th><th>Chofer</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{result.data.map((p) => <tr key={p.id} aria-label={`Pedido ${p.codigo}`}><td data-label="Código">{p.codigo}</td><td data-label="Cliente">{p.nombre} {p.apellido || ''}</td><td data-label="Dirección">{p.calle || 'Pendiente'} {p.altura || ''}, {p.localidad || 'Localidad pendiente'}</td>
        <DispatchPanel compact order={p} driverOptions={driverOptions} driverError={driverError} stateLabel={labels[p.estado] || p.estado} onUpdated={(updated) => { setResult((current) => current ? ({ ...current, data: current.data.map((item) => item.id === updated.id ? updated : item) }) : current); setDetail((current) => current?.id === updated.id ? { ...current, ...updated } : current); setRefresh((value) => value + 1) }}/>
        <td data-label="Acciones"><div className="order-row-actions"><OrderMapLink orderId={p.id}/><button className="button button-outline" type="button" onClick={() => inspect(p.id)} aria-label={`Ver pedido ${p.codigo}`}>Ver detalle</button></div></td></tr>)}</tbody></table></div>}<div className="order-pagination"><button type="button" className="button button-outline" disabled={page === 1} onClick={() => { setPageNumber(page - 1); setResult(null) }}>Anterior</button><span>Página {page}</span><button type="button" className="button button-outline" disabled={page * result.pagination.pageSize >= result.pagination.total} onClick={() => { setPageNumber(page + 1); setResult(null) }}>Siguiente</button></div></>}
    </section>{detailError && <p className="login-error" role="alert">{detailError}</p>}{detail && <DetailModal key={detail.id} onClose={() => setDetail(null)}><section className="panel persisted-panel order-detail" aria-label="Detalle del pedido">
      <header className="order-detail-header"><div className="order-detail-title"><span className="order-detail-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9"/></svg></span><div><p>Detalle del pedido</p><h2 id="order-detail-title">{detail.codigo}</h2></div></div><div className="order-detail-header-actions"><span className={`order-state-badge ${detail.estado}`}>{labels[detail.estado] || detail.estado}</span><button type="button" className="button button-outline" onClick={() => setDetail(null)}>Cerrar detalle</button></div></header>
      <div className="order-detail-grid">
        <section className="order-detail-card"><h3><span aria-hidden="true">01</span> Cliente</h3><p className="order-detail-name">{detail.nombre} {detail.apellido || ''}</p><dl><div><dt>DNI</dt><dd>{detail.dni || 'No informado'}</dd></div><div><dt>Teléfono</dt><dd>{detail.telefono ? <a href={`tel:${detail.telefono.replace(/[^+\d]/g, '')}`}>{detail.telefono}</a> : 'No informado'}</dd></div><div className="order-detail-wide"><dt>Email</dt><dd>{detail.email ? <a href={`mailto:${detail.email}`}>{detail.email}</a> : 'No informado'}</dd></div></dl></section>
        <section className="order-detail-card"><h3><span aria-hidden="true">02</span> Dirección de entrega</h3><p className="order-detail-name">{detail.calle || 'Calle pendiente'} {detail.altura || ''}</p><dl><div><dt>Piso / Departamento</dt><dd>{detail.pisoDepto || 'No informado'}</dd></div><div><dt>Código postal</dt><dd>{detail.codigoPostal || 'No informado'}</dd></div><div><dt>Localidad</dt><dd>{detail.localidad || 'No informada'}</dd></div><div><dt>Provincia</dt><dd>{detail.provincia || 'No informada'}</dd></div></dl><div className="order-detail-original"><span>Dirección original recibida</span><p>{detail.direccionOriginal || 'No se informó una dirección original.'}</p></div></section>
        <section className="order-detail-card order-detail-location"><h3><span aria-hidden="true">03</span> Ubicación y revisión</h3><LocationReview key={detail.id} order={detail} onConfirmed={setDetail}/></section>
        <section className="order-detail-card"><h3><span aria-hidden="true">04</span> Indicaciones de entrega</h3><p className={`order-detail-notes ${detail.observaciones ? '' : 'empty'}`}>{detail.observaciones || 'Este pedido no tiene indicaciones adicionales.'}</p></section>
        <DeliveryHistory orderId={detail.id} version={detail.estado}/>
      </div>
    </section></DetailModal>}
  </main>
}
