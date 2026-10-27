import { useState } from 'react'
import { api, mensajeError } from '../api/client.js'
export default function CompletarImporte({ pedido, onGuardado }) {
  const [importe, setImporte] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  if (pedido.importe_base != null || ['ENTREGADO', 'PAGADO'].includes(pedido.estado)) return null
  async function guardar(e) {
    e.preventDefault(); if (ocupado) return
    setOcupado(true); setError('')
    try { onGuardado((await api.put(`/pedidos/${pedido.id}/importe`, { importe_base: importe.trim().replace(',', '.') })).data.pedido) }
    catch (err) { setError(Object.values(err.response?.data?.error?.campos ?? {}).join(' ') || mensajeError(err)) }
    finally { setOcupado(false) }
  }
  return <form onSubmit={guardar}><label className="form-field" htmlFor={`importe-antiguo-${pedido.id}`}><span>Completar importe base pendiente (ARS)</span><input id={`importe-antiguo-${pedido.id}`} required inputMode="decimal" pattern="[0-9]{1,10}([.,][0-9]{1,2})?" value={importe} disabled={ocupado} onChange={e => setImporte(e.target.value)}/></label>
    <p>Si hubo intentos fallidos desde la nueva regla, se sumará el 50% del base por cada uno.</p>
    {error && <p role="alert">{error}</p>}<button className="button button-primary" disabled={ocupado}>{ocupado ? 'Guardando…' : 'Guardar importe base'}</button>
  </form>
}
