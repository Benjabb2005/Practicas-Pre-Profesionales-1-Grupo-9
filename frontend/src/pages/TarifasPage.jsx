import { useEffect, useState } from 'react'
import { obtenerTarifa, guardarTarifa } from '../api/tarifas.js'
import { mensajeError } from '../api/client.js'
export default function TarifasPage() {
  const [precio, setPrecio] = useState('')
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    let vigente = true
    obtenerTarifa().then(t => { if (vigente) setPrecio(t.precio_km ?? '') })
      .catch(e => { if (vigente) setError(mensajeError(e)) })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [intento])
  async function guardar(e) {
    e.preventDefault(); if (ocupado) return
    setOcupado(true); setError(''); setAviso('')
    try { const t = await guardarTarifa(precio.trim().replace(',', '.')); setPrecio(t.precio_km); setAviso('Precio por km guardado. Los importes de pedidos existentes se conservan.') }
    catch (e) { setError(Object.values(e.response?.data?.error?.campos ?? {}).join(' ') || mensajeError(e)) }
    finally { setOcupado(false) }
  }
  return <main className="main-content"><header className="page-header"><div><h1>Tarifa de envío</h1><p>Configuración exclusiva del administrador.</p></div></header>
    <section className="panel" style={{ maxWidth: 540, padding: 24 }}>
      {cargando && <p role="status">Cargando tarifa…</p>}{error && <p role="alert" className="users-alert">{error}</p>}{aviso && <p role="status" className="users-ok">{aviso}</p>}
      <form onSubmit={guardar}><label className="form-field" htmlFor="tarifa-km"><span>Precio fijo por km (ARS)</span><input id="tarifa-km" inputMode="decimal" required pattern="[0-9]{1,10}([.,][0-9]{1,2})?" value={precio} onChange={e => setPrecio(e.target.value)} disabled={cargando || ocupado}/></label>
        <p className="subtitle">La sugerencia por distancia se habilitará cuando esté definido el origen del envío. Por ahora, el importe se carga manualmente.</p>
        <button className="button button-primary" disabled={cargando || ocupado}>{ocupado ? 'Guardando…' : 'Guardar tarifa'}</button>
        {error && <button type="button" className="button button-outline" disabled={ocupado || cargando} onClick={() => { setError(''); setCargando(true); setIntento(i => i + 1) }}>Reintentar consulta</button>}
      </form>
    </section>
  </main>
}
