import { useState } from 'react'
import { useAuth } from '../auth/useAuth.js'
import { api,mensajeError } from '../api/client.js'
import { moneda } from './importes.js'
import EstadoComprobante from './EstadoComprobante.jsx'

export default function PagoPedido({ pedido,onActualizado,confirmacionInicial=false,soloLectura=false }) {
  const { usuario } = useAuth()
  const [confirmar,setConfirmar] = useState(confirmacionInicial)
  const [ocupado,setOcupado] = useState(false)
  const [error,setError] = useState('')
  async function acreditar() {
    if (ocupado) return
    setOcupado(true);setError('')
    try {
      await api.put(`/asignaciones/${pedido.id}/acreditar-pago`,{})
      const actualizado = (await api.get(`/pedidos/${pedido.id}`)).data.pedido
      onActualizado(actualizado);setConfirmar(false)
    } catch(e) { setError(mensajeError(e)) }
    finally { setOcupado(false) }
  }
  return <section className="pago-pedido" aria-label="Pago del pedido"><h3>Pago</h3>
    {!pedido.pago_metodo ? <p>Sin pago registrado.</p> : <>
      <p>{pedido.pago_metodo === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'} · {moneda(pedido.pago_monto)}</p>
      <EstadoComprobante pedido={pedido}/>
      <p role="status">{pedido.estado === 'PAGADO' ? 'Pago confirmado · PAGADO' : 'Pendiente de acreditación'}</p>
      {!soloLectura && pedido.estado === 'ENTREGADO' && pedido.pago_metodo === 'TRANSFERENCIA' && usuario.rol === 'ADMINISTRADOR' && (confirmar ? <>
        <p>¿Verificaste la acreditación de esta transferencia? Al confirmar, el pedido pasará a PAGADO y quedará registrado tu usuario.</p>
        <div className="asignacion-confirmar-acciones"><button type="button" className="button button-outline" disabled={ocupado} onClick={() => setConfirmar(false)}>Cancelar acreditación</button><button type="button" className="button button-primary" disabled={ocupado} onClick={acreditar}>{ocupado ? 'Confirmando…' : 'Sí, acreditar transferencia'}</button></div>
      </> : <button type="button" className="button button-primary" onClick={() => setConfirmar(true)}>Acreditar transferencia</button>)}
    </>}
    {error && <p role="alert" className="users-alert">{error}</p>}
  </section>
}
