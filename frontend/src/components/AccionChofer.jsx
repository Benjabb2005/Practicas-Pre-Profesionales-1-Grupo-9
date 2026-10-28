import { useEffect, useRef, useState } from 'react'
import { registrarEntrega, registrarPago } from '../api/asignaciones.js'
import { moneda } from './importes.js'
import { mensajeError } from '../api/client.js'
import HistorialPedido from './HistorialPedido.jsx'
import './EntregaChofer.css'
import SelectorComprobante from './SelectorComprobante.jsx'
import ComprobantesPedido from './ComprobantesPedido.jsx'
import {subirComprobante,errorArchivo} from '../api/comprobantes.js'
import { crearIdOperacion } from './operacionEntrega.js'

export default function AccionChofer({ pedido, tipo, onClose, onGuardado,onComprobanteSubido }) {
  const dialogo = useRef(null)
  const enviando = useRef(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [motivo, setMotivo] = useState('')
  const [metodo, setMetodo] = useState('EFECTIVO')
  const [archivo,setArchivo]=useState(null)
  const [archivoError,setArchivoError]=useState('')
  const [pagoGuardado,setPagoGuardado]=useState(false)
  const [operacion] = useState(() => ['entrega', 'fallo'].includes(tipo) ? crearIdOperacion() : null)
  useEffect(() => {
    const d = dialogo.current
    const anterior = document.body.style.overflow
    d.showModal(); document.body.style.overflow = 'hidden'
    return () => { if (d.open) d.close(); document.body.style.overflow = anterior }
  }, [])
  const titulo = { entrega: 'Confirmar entrega', fallo: 'No se pudo entregar', pago: 'Registrar pago', historial: 'Historial',comprobantes:'Comprobantes del pago' }[tipo]
  async function guardar(e) {
    e.preventDefault()
    if (tipo === 'pago' && pedido.importe_total == null) return
    if(tipo==='pago'&&metodo==='TRANSFERENCIA'&&archivoError)return
    if (enviando.current) return
    enviando.current = true; setOcupado(true); setError('')
    try {
      let pago
      if (tipo === 'pago') {
        pago = await registrarPago(pedido.id, { metodo });setPagoGuardado(true)
        if(metodo==='TRANSFERENCIA'&&archivo)await subirComprobante(pedido.id,archivo)
      }
      else await registrarEntrega(pedido.id, tipo === 'fallo'
        ? { resultado: 'FALLIDA', operacion_id: operacion, motivo: motivo.trim() }
        : { resultado: 'ENTREGADO', operacion_id: operacion })
      onGuardado(tipo, pedido, pago)
    } catch (err) {
      const campos = err.response?.data?.error?.campos
      setError((tipo==='pago'&&metodo==='TRANSFERENCIA'?'Si la transferencia ya quedó registrada, podés reintentar el adjunto sin duplicar el pago. ':'')+(campos ? Object.values(campos).flat().join(' ') : mensajeError(err)))
    } finally { enviando.current = false; setOcupado(false) }
  }
  return <dialog className="entrega-modal" ref={dialogo} aria-labelledby="entrega-titulo" aria-busy={ocupado}
    onCancel={e => { if (enviando.current) e.preventDefault() }}
    onClose={() => { if (!dialogo.current?.open) onClose() }}>
    <header><h2 id="entrega-titulo">{titulo}</h2><button type="button" disabled={ocupado} onClick={() => dialogo.current.close()} aria-label="Cerrar panel">Cerrar</button></header>
    <p><strong>{pedido.codigo || `Pedido #${pedido.id}`}</strong> · {pedido.cliente_nombre}</p>
    {tipo === 'historial' ? <HistorialPedido pedidoId={pedido.id}/> : tipo==='comprobantes'?<ComprobantesPedido pedidoId={pedido.id} puedeSubir={['ENTREGADO','PAGADO'].includes(pedido.estado)&&pedido.pago_metodo==='TRANSFERENCIA'} onSubido={onComprobanteSubido}/>:<form onSubmit={guardar}>
      {tipo === 'entrega' && <p>Confirmá que el cliente recibió el pedido. Se guardarán la fecha, la hora y tu usuario.</p>}
      {tipo === 'fallo' && <><p>El pedido volverá a preparación y se reprogramará para la próxima jornada. Se sumará un recargo del 50% del envío base, facturable al emisor.</p>
        <label htmlFor="entrega-motivo">Motivo del intento fallido<textarea id="entrega-motivo" required minLength={3} maxLength={500} value={motivo} disabled={ocupado} onChange={e => setMotivo(e.target.value)}/></label></>}
      {tipo === 'pago' && <><p>La entrega ya está confirmada.</p>
        <label htmlFor="pago-metodo">Método de pago<select id="pago-metodo" value={metodo} disabled={ocupado||pagoGuardado} onChange={e => setMetodo(e.target.value)}><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option></select></label>
        <p role="status">{pedido.importe_total == null ? 'Este pedido todavía no tiene importe. Pedile al operador que lo complete desde el detalle del pedido; después actualizá la lista y volvé a registrar el pago.' : `Importe a registrar: ${moneda(pedido.importe_total)}.`}</p>
        <p>{metodo === 'EFECTIVO' ? 'Confirmá sólo si recibiste el efectivo. El pedido pasará a PAGADO.' : 'Informá la transferencia. El pedido seguirá ENTREGADO hasta que administración confirme la acreditación.'}</p></>}
      {tipo==='pago'&&metodo==='TRANSFERENCIA'&&<SelectorComprobante archivo={archivo} error={archivoError} disabled={ocupado} onChange={f=>{setArchivo(f);setArchivoError(errorArchivo(f))}}/>}
      {error && <p role="alert" className="entrega-error">{error}</p>}
      <footer><button type="button" disabled={ocupado} onClick={() => dialogo.current.close()}>Cancelar</button><button type="submit" className="button button-primary" disabled={ocupado || (tipo === 'pago' && (pedido.importe_total == null || (metodo==='TRANSFERENCIA'&&Boolean(archivoError))))}>{ocupado ? 'Guardando…' : tipo === 'fallo' ? 'Registrar intento fallido' : tipo === 'pago' ? pedido.importe_total == null ? 'Falta cargar el importe' : 'Guardar pago' : 'Sí, confirmar entrega'}</button></footer>
    </form>}
  </dialog>
}
