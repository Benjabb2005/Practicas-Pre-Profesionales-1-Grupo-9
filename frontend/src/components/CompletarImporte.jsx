import { useEffect, useState } from 'react'
import { api, mensajeError } from '../api/client.js'
import { obtenerImporteSugerido } from '../api/pedidos.js'
import { importeParaPrecargar, puedeCompletarImporte, puedeConsultarSugerencia, textoImporteSugerido } from './importeSugerido.js'

export default function CompletarImporte({ pedido, onGuardado }) {
  const [campoImporte, setCampoImporte] = useState({ pedidoId: pedido.id, valor: '' })
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [consulta, setConsulta] = useState({ clave: '', sugerencia: null, error: '' })
  const [intento, setIntento] = useState(0)
  const puedeCompletar = puedeCompletarImporte(pedido)
  const puedeConsultar = puedeConsultarSugerencia(pedido)
  const claveConsulta = `${pedido.id}:${pedido.estado_validacion}:${puedeCompletar}:${intento}`

  useEffect(() => {
    let vigente = true
    if (!puedeConsultar) return undefined
    obtenerImporteSugerido(pedido.id)
      .then((sugerencia) => {
        if (!vigente) return
        setConsulta({ clave: claveConsulta, sugerencia, error: '' })
        const importeSugerido = importeParaPrecargar(sugerencia)
        if (importeSugerido) {
          setCampoImporte((actual) => actual.pedidoId === pedido.id && actual.valor.trim()
            ? actual
            : { pedidoId: pedido.id, valor: importeSugerido })
        }
      })
      .catch((fallo) => {
        if (vigente) setConsulta({ clave: claveConsulta, sugerencia: null, error: mensajeError(fallo) })
      })
    return () => { vigente = false }
  }, [claveConsulta, puedeConsultar, pedido.id])

  const consultaActual = consulta.clave === claveConsulta ? consulta : null
  const sugerenciaActual = consultaActual?.sugerencia ?? null
  const cargandoSugerencia = puedeConsultar && !consultaActual
  const errorSugerencia = consultaActual?.error ?? ''
  const importe = campoImporte.pedidoId === pedido.id ? campoImporte.valor : ''
  const textoSugerencia = textoImporteSugerido(sugerenciaActual)

  if (!puedeCompletar) return null

  async function guardar(e) {
    e.preventDefault(); if (ocupado) return
    setOcupado(true); setError('')
    try { onGuardado((await api.put(`/pedidos/${pedido.id}/importe`, { importe_base: importe.trim().replace(',', '.') })).data.pedido) }
    catch (err) { setError(Object.values(err.response?.data?.error?.campos ?? {}).join(' ') || mensajeError(err)) }
    finally { setOcupado(false) }
  }

  return <form onSubmit={guardar}>
    {!puedeConsultar && <p style={{ color: 'var(--theme-muted)' }}>La sugerencia aparece cuando la ubicación esté confirmada.</p>}
    {cargandoSugerencia && <p role="status" style={{ color: 'var(--theme-muted)' }}>Consultando importe sugerido…</p>}
    {textoSugerencia && <p role="status" style={{ color: 'var(--theme-muted)' }}>{textoSugerencia}</p>}
    {sugerenciaActual && !sugerenciaActual.disponible && <p style={{ color: 'var(--theme-muted)' }}>{sugerenciaActual.motivo}</p>}
    {errorSugerencia && <p role="alert">{errorSugerencia} <button type="button" className="button button-outline" onClick={() => setIntento((actual) => actual + 1)}>Reintentar sugerencia</button></p>}
    <label className="form-field" htmlFor={`importe-antiguo-${pedido.id}`}><span>Completar importe base pendiente (ARS)</span><input id={`importe-antiguo-${pedido.id}`} required inputMode="decimal" pattern="[0-9]{1,10}([.,][0-9]{1,2})?" value={importe} disabled={ocupado} onChange={e => setCampoImporte({ pedidoId: pedido.id, valor: e.target.value })}/></label>
    <p>Si hubo intentos fallidos desde la nueva regla, se sumará el 50% del base por cada uno.</p>
    {error && <p role="alert">{error}</p>}<button className="button button-primary" disabled={ocupado}>{ocupado ? 'Guardando…' : 'Guardar importe base'}</button>
  </form>
}
