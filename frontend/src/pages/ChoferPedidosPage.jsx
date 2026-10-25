import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { misPedidos } from '../api/asignaciones'
import { mensajeError } from '../api/client'
import '../DriverApp.css'
import ThemeToggle from '../ThemeToggle.jsx'

function mapa(pedido) {
  if (pedido.estado_validacion !== 'CONFIRMADA' || pedido.latitud == null || pedido.longitud == null) return null
  const lat = Number(pedido.latitud), lon = Number(pedido.longitud)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lon}`)}`
}

export default function ChoferPedidosPage({ onLogout }) {
  const { usuario } = useAuth()
  const [pedidos, setPedidos] = useState(null)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let vigente = true
    misPedidos().then(p => { if (vigente) { setPedidos(p); setError('') } })
      .catch(e => { if (vigente) setError(mensajeError(e)) })
    return () => { vigente = false }
  }, [version])
  return <main className="driver-page"><div className="driver-shell">
    <header className="driver-header"><strong>MandáTodo</strong><div className="driver-header-actions"><ThemeToggle/><button className="driver-logout" onClick={onLogout}>Cerrar sesión</button></div></header>
    <section className="driver-intro"><div><p>Mis entregas</p><h1>{usuario.nombre}</h1><p>Pedidos despachados a tu nombre.</p></div></section>
    <button className="button button-outline" onClick={() => { setPedidos(null); setError(''); setVersion(v => v + 1) }}>Actualizar</button>
    {error && <p role="alert" className="users-alert">{error}</p>}
    {!pedidos && !error && <p role="status">Cargando tus pedidos…</p>}
    {pedidos?.length === 0 && <p role="status">No tenés pedidos en envío. Aparecerán cuando el equipo los asigne y despache.</p>}
    <section className="driver-stops" aria-label="Tus pedidos">{pedidos?.map(p => <article className="driver-stop" key={p.id}>
      <h2>{p.codigo || `Pedido #${p.id}`}</h2><p>{p.estado}</p>
      <div className="driver-stop-detail"><span>Cliente</span><strong>{p.cliente_nombre}</strong>
        {p.cliente_telefono && <a href={`tel:${p.cliente_telefono.replace(/[^+\d]/g, '')}`}>Llamar: {p.cliente_telefono}</a>}</div>
      <div className="driver-stop-detail"><span>Dirección</span><strong>{[p.calle, p.altura, p.piso_depto, p.localidad, p.provincia].filter(Boolean).join(' ')}</strong>
        {p.entre_calles && <p>Entre calles: {p.entre_calles}</p>}{p.codigo_postal && <p>CP: {p.codigo_postal}</p>}</div>
      {p.observaciones && <p>Indicaciones: {p.observaciones}</p>}
      {mapa(p) ? <a className="driver-map-button" href={mapa(p)} target="_blank" rel="noreferrer">Abrir ubicación confirmada</a> : <p>Ubicación no disponible.</p>}
    </article>)}</section>
  </div></main>
}
