import { lazy, Suspense, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { misPedidos } from '../api/asignaciones'
import { mensajeError } from '../api/client'
import '../DriverApp.css'
import ThemeToggle from '../ThemeToggle.jsx'
import Paginacion from '../components/Paginacion.jsx'
import usePagination from '../components/usePagination.js'
import { filtrarEntregas, ubicacionConfirmada as mapa } from '../components/chofer.js'
import Icon from '../components/Icon.jsx'

const MapaChofer = lazy(() => import('../components/MapaChofer.jsx'))

export default function ChoferPedidosPage({ onLogout }) {
  const { usuario } = useAuth()
  const [pedidos, setPedidos] = useState(null)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [actualizado, setActualizado] = useState(null)
  const [mapaId, setMapaId] = useState(null)
  const visibles = filtrarEntregas(pedidos ?? [], busqueda)
  const paginado = usePagination(visibles, `${busqueda}-${version}`)
  useEffect(() => {
    let vigente = true
    misPedidos().then(p => { if (vigente) { setPedidos(p); setError(''); setActualizado(new Date()) } })
      .catch(e => { if (vigente) { setPedidos(null); setError(mensajeError(e)) } })
    return () => { vigente = false }
  }, [version])
  return <main className="driver-page driver-live-page">
    <div className="driver-topbar"><header className="driver-header"><div className="driver-brand"><span className="driver-brand-icon"><Icon name="truck"/></span><span className="driver-brand-copy"><strong>MandáTodo</strong><small>Sistema Logístico</small></span></div><div className="driver-header-actions"><ThemeToggle/><button className="driver-logout" onClick={onLogout}>Cerrar sesión</button></div></header></div>
    <div className="driver-shell">
    <section className="driver-intro"><div><p className="driver-eyebrow">Mis entregas</p><h1>{usuario.nombre}</h1><p>Pedidos despachados a tu nombre.</p></div></section>
    <div className="driver-list-tools"><span role="status">{pedidos ? `${pedidos.length} entrega(s) pendiente(s)` : 'Consultando entregas'}</span>
    <button type="button" className="button button-outline" disabled={!pedidos && !error} onClick={() => { setPedidos(null); setError(''); setVersion(v => v + 1) }}>{error ? 'Reintentar' : 'Actualizar'}</button></div>
    {actualizado && pedidos && <p className="driver-updated">Última consulta: {actualizado.toLocaleTimeString('es-AR')}</p>}
    <label className="driver-search">Buscar una entrega<input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Pedido, cliente o dirección"/></label>
    {error && <p role="alert" className="users-alert">{error}</p>}
    {!pedidos && !error && <p role="status">Cargando tus pedidos…</p>}
    {pedidos?.length === 0 && <p role="status">No tenés pedidos en envío. Aparecerán cuando el equipo los asigne y despache.</p>}
    {pedidos?.length > 0 && !visibles.length && <p role="status">No hay entregas con esa búsqueda.</p>}
    <section className="driver-stops" aria-label="Tus pedidos">{paginado.items.map(p => <article className="driver-stop" key={p.id}>
      <div className="driver-stop-heading"><h2>{p.codigo || `Pedido #${p.id}`}</h2><span className="driver-stop-status queued">En envío</span></div>
      <div className="driver-stop-detail"><span>Cliente</span><strong>{p.cliente_nombre}</strong>
        {p.cliente_telefono && <a href={`tel:${p.cliente_telefono.replace(/[^+\d]/g, '')}`}>Llamar: {p.cliente_telefono}</a>}</div>
      <div className="driver-stop-detail"><span>Dirección</span><strong>{[p.calle, p.altura, p.piso_depto, p.localidad, p.provincia].filter(Boolean).join(' ')}</strong>
        {p.entre_calles && <p>Entre calles: {p.entre_calles}</p>}{p.codigo_postal && <p>CP: {p.codigo_postal}</p>}</div>
      {p.observaciones && <p>Indicaciones: {p.observaciones}</p>}
      {mapa(p) ? <div className="driver-location-actions"><button type="button" className="driver-map-button" onClick={() => setMapaId(p.id)}>Ver mapa</button><a className="driver-map-button" href={mapa(p)} target="_blank" rel="noreferrer">Ver ubicación en Google Maps</a></div> : <p>Ubicación no disponible.</p>}
    </article>)}</section>
    {pedidos && <Paginacion datos={paginado} nombre="tus entregas"/>}
  </div>
    {mapaId !== null && <Suspense fallback={<p role="status">Abriendo mapa…</p>}><MapaChofer pedidoId={mapaId} onClose={() => setMapaId(null)}/></Suspense>}
  </main>
}
