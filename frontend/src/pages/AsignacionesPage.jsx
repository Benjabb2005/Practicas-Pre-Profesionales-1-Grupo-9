import { useEffect, useRef, useState } from 'react'
import MapPreview from '../components/MapPreview.jsx'
import { obtenerPedido } from '../api/pedidos'
import { listarAsignaciones, listarChoferes, asignarChofer } from '../api/asignaciones'
import { mensajeError } from '../api/client'
import './Asignaciones.css'

function ContenidoDetalle({ pedidoId, tipo }) {
  const [pedido, setPedido] = useState(null)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    let vigente = true
    obtenerPedido(pedidoId).then(p => { if (vigente) setPedido(p) })
      .catch(e => { if (vigente) setError(mensajeError(e)) })
    return () => { vigente = false }
  }, [pedidoId, intento])
  if (error) return <div className="asignacion-detalle-contenido"><p role="alert">{error}</p><button className="button button-outline" onClick={() => { setError(''); setIntento(i => i + 1) }}>Reintentar</button></div>
  if (!pedido) return <p className="asignacion-detalle-contenido" role="status">Cargando pedido…</p>
  const direccion = [pedido.calle, pedido.altura, pedido.localidad, pedido.provincia].filter(Boolean).join(' ')
  if (tipo === 'mapa') return <div className="asignacion-detalle-contenido asignacion-solo-mapa">
    <MapPreview latitud={pedido.latitud} longitud={pedido.longitud} etiqueta={direccion}/>
    <p>{direccion || 'Sin dirección registrada'}</p>
    <p className="asignacion-detalle-nota">{pedido.estado_validacion === 'CONFIRMADA' ? 'Ubicación confirmada.' : 'Ubicación pendiente de confirmación humana.'}</p>
  </div>
  const datos = [
    ['Cliente', pedido.cliente_nombre], ['DNI', pedido.cliente_dni],
    ['Teléfono', pedido.cliente_telefono], ['Email', pedido.cliente_email],
    ['Dirección', direccion], ['Piso / Depto', pedido.piso_depto],
    ['Código postal', pedido.codigo_postal], ['Entre calles', pedido.entre_calles],
    ['Estado del pedido', pedido.estado], ['Validación', pedido.estado_validacion],
    ['Canal de origen', pedido.canal_origen], ['Observaciones', pedido.observaciones],
  ]
  return <div className="asignacion-detalle-contenido"><dl className="asignacion-datos">{datos.map(([nombre, valor]) => <div key={nombre}><dt>{nombre}</dt><dd>{valor || 'No informado'}</dd></div>)}</dl></div>
}

function DetalleDireccion({ pedidoId, tipo, onClose }) {
  const dialogoRef = useRef(null)
  useEffect(() => {
    const dialogo = dialogoRef.current
    dialogo.showModal()
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      if (dialogo.open) dialogo.close()
      document.body.style.overflow = overflowAnterior
    }
  }, [])
  return <dialog ref={dialogoRef} className="asignacion-detalle-modal" aria-labelledby="asignacion-detalle-titulo"
    onClose={() => { if (!dialogoRef.current?.open) onClose() }} onClick={event => {
      if (event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close()
    }}>
    <header className="asignacion-detalle-header"><h2 id="asignacion-detalle-titulo">{tipo === 'mapa' ? 'Mapa' : 'Información'} del pedido #{pedidoId}</h2><button type="button" className="button button-outline" onClick={() => dialogoRef.current.close()}>Cerrar detalle</button></header>
    <ContenidoDetalle pedidoId={pedidoId} tipo={tipo}/>
  </dialog>
}

function FilaAsignacion({ pedido, choferes, onGuardar, onVerDireccion, ocupado }) {
  const [choferId, setChoferId] = useState(String(pedido.chofer_id ?? ''))
  const motivo = pedido.motivo_bloqueo
  const seleccionadoDisponible = choferes.some(c => String(c.id) === choferId)
  const cambio = choferId !== String(pedido.chofer_id ?? '')
  return <article className="panel asignacion-card">
    <div className="asignacion-info">
      <div className="asignacion-titulo"><h2>Pedido {pedido.codigo || `#${pedido.id}`}</h2><span className={`asignacion-badge ${pedido.puede_asignar ? 'lista' : 'bloqueada'}`}>{pedido.puede_asignar ? 'Habilitado' : 'Bloqueado'}</span></div>
      <p className="asignacion-cliente">{pedido.cliente_nombre}</p>
      <p>{[pedido.calle, pedido.altura, pedido.localidad, pedido.provincia].filter(Boolean).join(' ')}</p>
      <p className="asignacion-estado">{pedido.estado} · {pedido.chofer_nombre || 'Sin asignar'}</p>
      {motivo && <p className="asignacion-motivo">{motivo}</p>}
    </div>
    <label className="form-field" htmlFor={`chofer-${pedido.id}`}><span>Chofer</span>
      <select id={`chofer-${pedido.id}`} value={choferId} disabled={ocupado || !pedido.puede_asignar || !choferes.length} onChange={e => setChoferId(e.target.value)}>
        <option value="">Elegí un chofer</option>
        {pedido.chofer_id && !choferes.some(c => c.id === pedido.chofer_id) && <option value={pedido.chofer_id}>{pedido.chofer_nombre} (no disponible)</option>}
        {choferes.map(c => <option value={c.id} key={c.id}>{c.nombre}</option>)}
      </select>
    </label>
    <div className="asignacion-actions">
      <button className="button button-primary" disabled={ocupado || !pedido.puede_asignar || !seleccionadoDisponible || !cambio} onClick={() => onGuardar(pedido.id, Number(choferId))}>Asignar</button>
      {pedido.puede_quitar && <button className="button button-outline" disabled={ocupado} onClick={() => onGuardar(pedido.id, null)}>Quitar chofer</button>}
      <button type="button" className="asignacion-revisar" disabled={ocupado} aria-label={`Ver mapa del pedido #${pedido.id}`} onClick={() => onVerDireccion({ id: pedido.id, tipo: 'mapa' })}>Ver mapa</button>
      <button type="button" className="asignacion-revisar" disabled={ocupado} aria-label={`Más información del pedido #${pedido.id}`} onClick={() => onVerDireccion({ id: pedido.id, tipo: 'informacion' })}>Más información</button>
    </div>
  </article>
}

export default function AsignacionesPage() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [version, setVersion] = useState(0)
  const [soloHabilitados, setSoloHabilitados] = useState(false)
  const [detalleId, setDetalleId] = useState(null)
  useEffect(() => {
    let vigente = true
    Promise.all([listarAsignaciones(), listarChoferes()])
      .then(([pedidos, choferes]) => { if (vigente) { setDatos({ pedidos, choferes }); setError('') } })
      .catch(e => { if (vigente) setError(mensajeError(e)) })
    return () => { vigente = false }
  }, [version])
  async function guardar(id, choferId) {
    setOcupado(true); setError(''); setAviso('')
    try {
      const pedido = await asignarChofer(id, choferId)
      setDatos(actual => ({ ...actual, pedidos: actual.pedidos.map(p => p.id === id ? pedido : p) }))
      setAviso(choferId === null ? `Se quitó el chofer del pedido #${id}.` : `Chofer asignado al pedido #${id}. La asignación quedó guardada; el pedido aún no fue despachado.`)
    } catch (e) { setError(mensajeError(e)) }
    finally { setOcupado(false) }
  }
  const cargando = !datos && !error
  const habilitados = datos?.pedidos.filter(p => p.puede_asignar).length ?? 0
  const visibles = datos?.pedidos.filter(p => !soloHabilitados || p.puede_asignar) ?? []
  return <main className="main-content asignaciones-page">
    <header className="page-header"><div><h1>Asignación de choferes</h1><p>Elegí un chofer para cada pedido con dirección confirmada. El despacho se realiza después.</p></div>
      <button className="button button-outline" disabled={ocupado || cargando} onClick={() => { setDatos(null); setError(''); setAviso(''); setVersion(v => v + 1) }}>{error && !datos ? 'Reintentar' : 'Actualizar'}</button></header>
    {error && <p className="users-alert" role="alert">{error}</p>}
    {aviso && <p className="users-ok" role="status">{aviso}</p>}
    {!datos && !error && <p role="status">Cargando asignaciones…</p>}
    {datos && !datos.choferes.length && <p>No hay choferes activos disponibles.</p>}
    {datos && !datos.pedidos.length && <p>No hay pedidos cargados.</p>}
    {datos && <>
      <div className="asignaciones-resumen" aria-label="Resumen de asignaciones"><p><strong>{habilitados}</strong> habilitados</p><p><strong>{datos.pedidos.length - habilitados}</strong> bloqueados</p><p><strong>{datos.choferes.length}</strong> choferes activos</p></div>
      <label className="asignaciones-filtro"><input type="checkbox" checked={soloHabilitados} onChange={e => setSoloHabilitados(e.target.checked)}/> Mostrar solo pedidos habilitados</label>
      {soloHabilitados && !visibles.length && <p>No hay pedidos habilitados. Revisá y confirmá las direcciones de los pedidos bloqueados.</p>}
    </>}
    <section className="asignaciones-grid" aria-label="Pedidos para asignar">{visibles.map(p => <FilaAsignacion key={`${p.id}-${p.chofer_id}`} pedido={p} choferes={datos.choferes} ocupado={ocupado} onGuardar={guardar} onVerDireccion={setDetalleId}/>)}</section>
    {detalleId !== null && <DetalleDireccion pedidoId={detalleId.id} tipo={detalleId.tipo} onClose={() => setDetalleId(null)}/>}
  </main>
}
