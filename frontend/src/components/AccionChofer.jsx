import { useEffect, useRef, useState } from 'react'
import { registrarEntrega } from '../api/asignaciones.js'
import { mensajeError } from '../api/client.js'
import HistorialPedido from './HistorialPedido.jsx'
import './EntregaChofer.css'

export default function AccionChofer({ pedido, tipo, onClose, onGuardado }) {
  const dialogo = useRef(null)
  const enviando = useRef(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [motivo, setMotivo] = useState('')
  const [metodo, setMetodo] = useState('EFECTIVO')
  const [operacion] = useState(() => crypto.randomUUID())
  useEffect(() => {
    const d = dialogo.current
    const anterior = document.body.style.overflow
    d.showModal(); document.body.style.overflow = 'hidden'
    return () => { if (d.open) d.close(); document.body.style.overflow = anterior }
  }, [])
  const titulo = { entrega: 'Confirmar entrega', fallo: 'No se pudo entregar', pago: 'Registrar pago', historial: 'Historial' }[tipo]
  async function guardar(e) {
    e.preventDefault()
    if (tipo === 'pago') return
    if (enviando.current) return
    enviando.current = true; setOcupado(true); setError('')
    try {
      await registrarEntrega(pedido.id, tipo === 'fallo'
        ? { resultado: 'FALLIDA', operacion_id: operacion, motivo: motivo.trim() }
        : { resultado: 'ENTREGADO', operacion_id: operacion })
      onGuardado(tipo, pedido)
    } catch (err) {
      const campos = err.response?.data?.error?.campos
      setError(campos ? Object.values(campos).flat().join(' ') : mensajeError(err))
    } finally { enviando.current = false; setOcupado(false) }
  }
  return <dialog className="entrega-modal" ref={dialogo} aria-labelledby="entrega-titulo"
    onCancel={e => { if (enviando.current) e.preventDefault() }}
    onClose={() => { if (!dialogo.current?.open) onClose() }}>
    <header><h2 id="entrega-titulo">{titulo}</h2><button type="button" disabled={ocupado} onClick={() => dialogo.current.close()} aria-label="Cerrar panel">Cerrar</button></header>
    <p><strong>{pedido.codigo || `Pedido #${pedido.id}`}</strong> · {pedido.cliente_nombre}</p>
    {tipo === 'historial' ? <HistorialPedido pedidoId={pedido.id}/> : <form onSubmit={guardar}>
      {tipo === 'entrega' && <p>Confirmá que el cliente recibió el pedido. Se guardarán la fecha, la hora y tu usuario.</p>}
      {tipo === 'fallo' && <><p>El pedido volverá a preparación para que el operador lo revise antes de despacharlo otra vez.</p>
        <label htmlFor="entrega-motivo">Motivo del intento fallido<textarea id="entrega-motivo" required minLength={3} maxLength={500} value={motivo} disabled={ocupado} onChange={e => setMotivo(e.target.value)}/></label></>}
      {tipo === 'pago' && <><p>La entrega ya está confirmada.</p>
        <label htmlFor="pago-metodo">Método de pago<select id="pago-metodo" value={metodo} disabled={ocupado} onChange={e => setMetodo(e.target.value)}><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option></select></label>
        <p role="status">El registro del pago se habilitará cuando el pedido tenga su importe cargado.</p></>}
      {error && <p role="alert" className="entrega-error">{error}</p>}
      <footer><button type="button" disabled={ocupado} onClick={() => dialogo.current.close()}>Cancelar</button><button type="submit" className="button button-primary" disabled={ocupado || tipo === 'pago'}>{ocupado ? 'Guardando…' : tipo === 'fallo' ? 'Registrar intento fallido' : tipo === 'pago' ? 'Guardar pago' : 'Sí, confirmar entrega'}</button></footer>
    </form>}
  </dialog>
}
