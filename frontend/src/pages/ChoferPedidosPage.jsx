import { lazy, Suspense, useEffect, useState } from 'react'
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

const MapaChofer = lazy(() => import('../components/MapaChofer.jsx'))

export default function ChoferPedidosPage({ onLogout }) {
  const { usuario } = useAuth()
  const [pedidos, setPedidos] = useState(null)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [actualizado, setActualizado] = useState(null)
  const [mapaId, setMapaId] = useState(null)
  const [vista, setVista] = useState('pendientes')
  const [accion, setAccion] = useState(null)
  const [aviso, setAviso] = useState('')
  const [recienEntregado, setRecienEntregado] = useState(null)
  const deVista = entregasDeVista(pedidos ?? [], vista)
  const visibles = filtrarEntregas(deVista, busqueda)
  const paginado = usePagination(visibles, `${busqueda}-${version}-${vista}`)
  useEffect(() => {
    let vigente = true
    ;(vista === 'pendientes' ? misPedidos() : misEntregados()).then(p => { if (vigente) { setPedidos(p); setError(''); setActualizado(new Date()) } })
      .catch(e => { if (vigente) { setPedidos(null); setError(mensajeError(e)) } })
    return () => { vigente = false }
  }, [version, vista])
  function cambiarVista(nueva) { setVista(nueva); setPedidos(null); setError(''); setBusqueda('') }
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
    <section className="driver-intro"><div><p className="driver-eyebrow">Mis entregas</p><h1>{usuario.nombre}</h1><p>Pedidos despachados a tu nombre.</p></div></section>
    <nav className="driver-view-tabs" aria-label="Vista de entregas"><button type="button" aria-pressed={vista === 'pendientes'} onClick={() => cambiarVista('pendientes')}>En envío</button><button type="button" aria-pressed={vista === 'entregados'} onClick={() => cambiarVista('entregados')}>Entregados</button><button type="button" aria-pressed={vista === 'historial'} onClick={() => cambiarVista('historial')}>Historial</button></nav>
    <p className="driver-pago-nota">{vista==='historial'?'Entregas con pago confirmado y comprobante completo cuando corresponde.':vista==='entregados'?'Entregas con pago o comprobante pendiente.':'Pedidos despachados pendientes de entrega.'}</p>
    {aviso && <p className="users-ok" role="status">{aviso}</p>}
    {recienEntregado && <div className="driver-result-actions"><button type="button" onClick={() => setAccion({ tipo: 'pago', pedido: recienEntregado })}>Registrar pago del pedido {recienEntregado.codigo || `#${recienEntregado.id}`}</button><button type="button" onClick={() => setRecienEntregado(null)}>Más tarde</button></div>}
    <div className="driver-list-tools"><span role="status">{pedidos ? `${deVista.length} entrega(s) ${vista === 'pendientes' ? 'en envío' : vista === 'historial' ? 'completada(s)' : 'con pendientes'}` : 'Consultando entregas'}</span>
    <button type="button" className="button button-outline" disabled={!pedidos && !error} onClick={() => { setPedidos(null); setError(''); setVersion(v => v + 1) }}>{error ? 'Reintentar' : 'Actualizar'}</button></div>
    {actualizado && pedidos && <p className="driver-updated">Última consulta: {actualizado.toLocaleTimeString('es-AR')}</p>}
    <label className="driver-search">Buscar una entrega<input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Pedido, cliente o dirección"/></label>
    {error && <p role="alert" className="users-alert">{error}</p>}
    {!pedidos && !error && <p role="status">Cargando tus pedidos…</p>}
    {pedidos && deVista.length === 0 && <p role="status">{vista === 'pendientes' ? 'No tenés pedidos en envío. Aparecerán cuando el equipo los asigne y despache.' : vista === 'historial' ? 'Todavía no tenés entregas completas en el historial.' : 'No tenés entregas con pago o comprobante pendiente.'}</p>}
    {deVista.length > 0 && !visibles.length && <p role="status">No hay entregas con esa búsqueda.</p>}
    <section className="driver-stops" aria-label="Tus pedidos">{paginado.items.map(p => <article className="driver-stop" key={p.id}>
      <div className="driver-stop-heading"><h2>{p.codigo || `Pedido #${p.id}`}</h2><span className={`driver-stop-status ${vista === 'pendientes' ? 'in-transit' : 'delivered'}`}>{vista === 'pendientes' ? 'En envío' : 'Entregado'}</span></div>
      {vista!=='pendientes'&&<div className="driver-payment-status" aria-label="Estado del pago y comprobante"><span className={`driver-stop-status ${p.estado==='PAGADO'?'payment-confirmed':p.pago_metodo?'payment-review':'payment-pending'}`}>{p.estado==='PAGADO'?'Pago confirmado':p.pago_metodo?'Esperando acreditación de administración':'Falta registrar el pago'}</span><EstadoComprobante pedido={p}/></div>}
      <div className="driver-stop-detail"><span>Cliente</span><strong>{p.cliente_nombre}</strong>
        {p.cliente_telefono && <a href={`tel:${p.cliente_telefono.replace(/[^+\d]/g, '')}`}>Llamar: {p.cliente_telefono}</a>}</div>
      <div className="driver-stop-detail"><span>Dirección</span><strong>{[p.calle, p.altura, p.piso_depto, p.localidad, p.provincia].filter(Boolean).join(' ')}</strong>
        {p.entre_calles && <p>Entre calles: {p.entre_calles}</p>}{p.codigo_postal && <p>CP: {p.codigo_postal}</p>}</div>
      {p.observaciones && <p>Indicaciones: {p.observaciones}</p>}
      <ImportePedido pedido={p}/>
      {vista === 'pendientes' && (mapa(p) ? <div className="driver-location-actions"><button type="button" className="driver-map-button" onClick={() => setMapaId(p.id)}>Ver mapa</button><a className="driver-map-button" href={mapa(p)} target="_blank" rel="noreferrer">Ver ubicación en Google Maps</a></div> : <p>Ubicación no disponible.</p>)}
      {vista !== 'pendientes' && <p className="driver-pago-nota">{p.entregado_fecha && <>Entrega: {new Date(p.entregado_fecha).toLocaleString('es-AR')}. </>}{p.pago_metodo ? `Pago registrado: ${p.pago_metodo === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'} · $${Number(p.pago_monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}. ${p.estado === 'PAGADO' ? 'Pago confirmado.' : 'Pendiente de acreditación por administración.'}` : 'Sin pago registrado.'}</p>}
      <div className="driver-result-actions">{vista === 'pendientes' ? <><button type="button" className="entrega-exito" onClick={() => setAccion({ tipo: 'entrega', pedido: p })}>Confirmar entrega</button><button type="button" className="entrega-fallo" onClick={() => setAccion({ tipo: 'fallo', pedido: p })}>No se pudo entregar</button></> : !p.pago_metodo && <button type="button" onClick={() => setAccion({ tipo: 'pago', pedido: p })}>Registrar pago</button>}
        {p.pago_metodo==='TRANSFERENCIA'&&<button type="button" onClick={()=>setAccion({tipo:'comprobantes',pedido:p})}>Adjuntar / ver comprobante</button>}
        <button type="button" onClick={() => setAccion({ tipo: 'historial', pedido: p })}>Ver historial</button></div>
    </article>)}</section>
    {pedidos && <Paginacion datos={paginado} nombre="tus entregas"/>}
  </div>
    {mapaId !== null && <Suspense fallback={<p role="status">Abriendo mapa…</p>}><MapaChofer pedidoId={mapaId} onClose={() => setMapaId(null)}/></Suspense>}
    {accion && <AccionChofer key={`${accion.pedido.id}-${accion.tipo}`} {...accion} onClose={() => setAccion(null)} onGuardado={guardado} onComprobanteSubido={()=>setVersion(v=>v+1)}/>}
  </main>
}
