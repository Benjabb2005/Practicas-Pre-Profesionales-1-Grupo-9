import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { misPedidos, misEntregados } from '../api/asignaciones'
import { mensajeError } from '../api/client'
import '../DriverApp.css'
import ThemeToggle from '../ThemeToggle.jsx'
import Paginacion from '../components/Paginacion.jsx'
import usePagination from '../components/usePagination.js'
import { entregasDeVista, filtrarEntregas, ubicacionConfirmada as mapa } from '../components/chofer.js'
import Icon from '../components/Icon.jsx'
import AccionChofer from '../components/AccionChofer.jsx'
import ImportePedido from '../components/ImportePedido.jsx'
import EstadoComprobante from '../components/EstadoComprobante.jsx'
import ProcesoCarga from '../components/ProcesoCarga.jsx'
import MapaTarjeta from '../components/MapPreview.jsx'
import { conCargaMinima } from '../components/cargaMinima.js'

const MapaChofer = lazy(() => import('../components/MapaChofer.jsx'))
const DetalleChofer = lazy(() => import('../components/DetalleChofer.jsx'))

export default function ChoferPedidosPage({ onLogout }) {
  const { usuario } = useAuth()
  const perfilRef = useRef(null)
  const [pedidos, setPedidos] = useState(null)
  const [resumen, setResumen] = useState(null)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [actualizado, setActualizado] = useState(null)
  const [mapaId, setMapaId] = useState(null)
  const [vista, setVista] = useState('pendientes')
  const [accion, setAccion] = useState(null)
  const [aviso, setAviso] = useState('')
  const [detalleId, setDetalleId] = useState(null)
  const [recienEntregado, setRecienEntregado] = useState(null)
  const deVista = entregasDeVista(pedidos ?? [], vista)
  const visibles = filtrarEntregas(deVista, busqueda)
  const paginado = usePagination(visibles, `${busqueda}-${version}-${vista}`)
  useEffect(() => {
    let vigente = true
    const solicitud = Promise.allSettled([misPedidos(), misEntregados()]).then(resultados => {
      const seleccion = resultados[vista === 'pendientes' ? 0 : 1]
      if (seleccion.status === 'rejected') throw seleccion.reason
      return resultados
    })
    conCargaMinima(solicitud, 1200).then(([enRuta, entregados]) => {
      const seleccion = vista === 'pendientes' ? enRuta : entregados
      if (vigente) {
        setPedidos(seleccion.value); setError(''); setActualizado(new Date())
        setResumen({ enRuta: enRuta.status === 'fulfilled' ? enRuta.value.length : null,
          entregados: entregados.status === 'fulfilled' ? entregados.value.length : null,
          pendientes: entregados.status === 'fulfilled' ? entregasDeVista(entregados.value, 'entregados').length : null })
      }
    })
      .catch(e => { if (vigente) { setPedidos(null); setResumen(null); setError(mensajeError(e)) } })
    return () => { vigente = false }
  }, [version, vista])
  function cambiarVista(nueva) {
    if (nueva === vista) return
    setVista(nueva); setPedidos(null); setError(''); setBusqueda('')
  }
  function guardado(tipo, pedido, pago) {
    setAccion(null); setPedidos(null); setError(''); setVersion(v => v + 1)
    setAviso(tipo === 'entrega' ? 'Entrega confirmada. Podés registrar el pago ahora o desde Entregados.'
      : tipo === 'fallo' ? 'Intento fallido registrado. El pedido volvió a preparación para revisión del operador.'
        : pago?.estado_pedido === 'PAGADO' ? 'Cobro en efectivo confirmado. El pedido está PAGADO.' : 'Transferencia informada. Pendiente de acreditación por administración.')
    setRecienEntregado(tipo === 'entrega' ? pedido : null)
  }
  return <main className="driver-page driver-live-page">
    <div className="driver-topbar"><header className="driver-header"><div className="driver-brand"><span className="driver-brand-icon"><Icon name="truck"/></span><span className="driver-brand-copy"><strong>MandáTodo</strong><small>Sistema Logístico</small></span></div><div className="driver-header-actions"><ThemeToggle/><button className="driver-logout" onClick={onLogout}>Cerrar sesión</button></div></header></div>
    <div className="driver-shell">
    <section className="driver-intro"><div><p className="driver-eyebrow">Mi jornada · {usuario.nombre}</p><h1>Vamos a destino.</h1><p>Tus pedidos, en el orden que necesitás.</p></div></section>
    <section className="driver-day-summary" aria-label="Resumen de entregas"><div><strong>{resumen?.enRuta ?? '—'}</strong><span>En envío</span></div><div><strong>{resumen?.entregados ?? '—'}</strong><span>Entregados</span></div><div><strong>{resumen?.pendientes ?? '—'}</strong><span>Con pendientes</span></div></section>
    {vista !== 'historial' && <nav className="driver-view-tabs" aria-label="Vista de entregas"><button type="button" aria-pressed={vista === 'pendientes'} onClick={() => cambiarVista('pendientes')}>En envío</button><button type="button" aria-pressed={vista === 'entregados'} onClick={() => cambiarVista('entregados')}>Entregados</button></nav>}
    {aviso && <p className="users-ok" role="status">{aviso}</p>}
    {recienEntregado && <div className="driver-result-actions"><button type="button" onClick={() => setAccion({ tipo: 'pago', pedido: recienEntregado })}>Registrar pago del pedido {recienEntregado.codigo || `#${recienEntregado.id}`}</button><button type="button" onClick={() => setRecienEntregado(null)}>Más tarde</button></div>}
    <details className="driver-list-options"><summary>Buscar y actualizar entregas</summary>
    <p className="driver-pago-nota">{vista==='historial'?'Entregas con pago confirmado y comprobante completo cuando corresponde.':vista==='entregados'?'Entregas con pago o comprobante pendiente.':'Pedidos despachados pendientes de entrega.'}</p>
    <div className="driver-list-tools"><span role="status">{pedidos ? `${deVista.length} entrega(s) ${vista === 'pendientes' ? 'en envío' : vista === 'historial' ? 'completada(s)' : 'con pendientes'}` : 'Consultando entregas'}</span>
    <button type="button" className="button button-outline" disabled={!pedidos && !error} onClick={() => { setPedidos(null); setError(''); setVersion(v => v + 1) }}>{error ? 'Reintentar' : 'Actualizar'}</button></div>
    {actualizado && pedidos && <p className="driver-updated">Última consulta: {actualizado.toLocaleTimeString('es-AR')}</p>}
    <label className="driver-search">Buscar una entrega<input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Pedido, cliente o dirección"/></label>
    </details>
    {error && <p role="alert" className="users-alert">{error}</p>}
    {!pedidos && !error && <ProcesoCarga breve titulo="Cargando tus pedidos…" detalle="Consultando las entregas asignadas a tu cuenta."/>}
    {pedidos && deVista.length === 0 && <p role="status">{vista === 'pendientes' ? 'No tenés pedidos en envío. Aparecerán cuando el equipo los asigne y despache.' : vista === 'historial' ? 'Todavía no tenés entregas completas en el historial.' : 'No tenés entregas con pago o comprobante pendiente.'}</p>}
    {deVista.length > 0 && !visibles.length && <p role="status">No hay entregas con esa búsqueda.</p>}
    {pedidos && visibles.length > 0 && vista === 'pendientes' && <div className="driver-section-heading"><h2>Tus próximas entregas</h2><span>En el orden de tu listado</span></div>}
    <section className="driver-stops" aria-label="Tus pedidos">{paginado.items.map((p, indice) => <article className={`driver-stop${vista === 'pendientes' && indice === 0 && paginado.pagina === 1 ? ' driver-stop-featured' : ''}`} key={p.id}>
      <div className="driver-stop-heading"><h2>{p.codigo || `Pedido #${p.id}`}</h2><span className={`driver-stop-status ${vista === 'pendientes' ? 'in-transit' : 'delivered'}`}>{vista === 'pendientes' ? 'En envío' : 'Entregado'}</span></div>
      {vista!=='pendientes'&&<div className="driver-payment-status" aria-label="Estado del pago y comprobante"><span className={`driver-stop-status ${p.estado==='PAGADO'?'payment-confirmed':p.pago_metodo?'payment-review':'payment-pending'}`}>{p.estado==='PAGADO'?'Pago confirmado':p.pago_metodo?'Esperando acreditación de administración':'Falta registrar el pago'}</span><EstadoComprobante pedido={p}/></div>}
      <h3 className="driver-client-name">{p.cliente_nombre}</h3>
      <p className="driver-destination-copy">{[p.calle, p.altura, p.piso_depto].filter(Boolean).join(' ')}<br/>{[p.localidad, p.provincia].filter(Boolean).join(', ')}</p>
      {vista === 'pendientes' && indice === 0 && mapa(p) && <div className="driver-inline-map"><MapaTarjeta latitud={p.latitud} longitud={p.longitud} etiqueta={p.codigo || `Pedido #${p.id}`}/></div>}
      <div className="driver-contact-row">{p.cliente_telefono && <a className="driver-map-button" href={`tel:${p.cliente_telefono.replace(/[^+\d]/g, '')}`}>Llamar</a>}{mapa(p) && <button type="button" className="driver-map-button" onClick={() => setMapaId(p.id)}>Ver mapa</button>}</div>
      <details className="driver-extra-information"><summary>Datos e indicaciones del envío</summary>{p.entre_calles && <p>Entre calles: {p.entre_calles}</p>}{p.codigo_postal && <p>CP: {p.codigo_postal}</p>}{p.observaciones && <p>Indicaciones: {p.observaciones}</p>}<ImportePedido pedido={p}/>{mapa(p) ? <a href={mapa(p)} target="_blank" rel="noreferrer">Ver ubicación en Google Maps →</a> : <p>Ubicación no disponible.</p>}</details>
      {vista !== 'pendientes' && <p className="driver-pago-nota">{p.entregado_fecha && <>Entrega: {new Date(p.entregado_fecha).toLocaleString('es-AR')}. </>}{p.pago_metodo ? `Pago registrado: ${p.pago_metodo === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'} · $${Number(p.pago_monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}. ${p.estado === 'PAGADO' ? 'Pago confirmado.' : 'Pendiente de acreditación por administración.'}` : 'Sin pago registrado.'}</p>}
      <div className="driver-result-actions">{vista === 'pendientes' ? <><button type="button" className="entrega-exito driver-action-primary" onClick={() => setAccion({ tipo: 'entrega', pedido: p })}><Icon name="check" size={18}/>Confirmar entrega</button><button type="button" className="entrega-fallo driver-action-failure" onClick={() => setAccion({ tipo: 'fallo', pedido: p })}><Icon name="alert" size={16}/>No se pudo entregar</button></> : !p.pago_metodo && <button type="button" className="driver-action-primary" onClick={() => setAccion({ tipo: 'pago', pedido: p })}><Icon name="wallet" size={18}/>Registrar pago</button>}
        {p.pago_metodo==='TRANSFERENCIA'&&<button type="button" className="driver-action-document" onClick={()=>setAccion({tipo:'comprobantes',pedido:p})}><Icon name="receipt" size={21}/><span>Adjuntar / ver comprobante<small>Fotos y documentos del pago</small></span><span aria-hidden="true">→</span></button>}
        <button type="button" className="driver-action-secondary" onClick={() => setDetalleId(p.id)}><Icon name="eye" size={16}/>Ver detalle del pedido</button><button type="button" className="driver-action-secondary" onClick={() => setAccion({ tipo: 'historial', pedido: p })}><Icon name="history" size={16}/>Ver historial</button></div>
    </article>)}</section>
    {pedidos && <Paginacion datos={paginado} nombre="tus entregas"/>}
  </div>
    <nav className="driver-bottom-nav" aria-label="Navegación del chofer"><button type="button" aria-pressed={vista !== 'historial'} onClick={() => { cambiarVista('pendientes'); window.scrollTo({ top: 0 }) }}><Icon name="box" size={16}/>Pedidos</button><button type="button" aria-pressed={vista === 'historial'} onClick={() => { cambiarVista('historial'); window.scrollTo({ top: 0 }) }}><Icon name="route" size={16}/>Historial</button><button type="button" onClick={() => perfilRef.current.showModal()}><Icon name="users" size={16}/>Perfil</button></nav>
    <dialog ref={perfilRef} className="driver-detail-dialog" aria-labelledby="driver-profile-title"><header><div><p className="eyebrow">Tu cuenta</p><h2 id="driver-profile-title">Perfil del chofer</h2></div><button type="button" className="button button-outline" onClick={() => perfilRef.current.close()}>Cerrar perfil</button></header><p><strong>{usuario.nombre}</strong></p><p>{usuario.email}</p><p>Chofer · MandáTodo</p><button type="button" className="button button-outline" onClick={onLogout}>Cerrar sesión</button></dialog>
    {mapaId !== null && <Suspense fallback={<p role="status">Abriendo mapa…</p>}><MapaChofer pedidoId={mapaId} onClose={() => setMapaId(null)}/></Suspense>}
    {accion && <AccionChofer key={`${accion.pedido.id}-${accion.tipo}`} {...accion} onClose={() => setAccion(null)} onGuardado={guardado} onComprobanteSubido={()=>setVersion(v=>v+1)}/>}
    {detalleId !== null && <Suspense fallback={<p role="status">Abriendo detalle…</p>}><DetalleChofer key={detalleId} pedidoId={detalleId} entregado={vista !== 'pendientes'} onClose={() => setDetalleId(null)}/></Suspense>}
  </main>
}
