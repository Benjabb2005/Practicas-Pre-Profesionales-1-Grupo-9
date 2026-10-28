import { useEffect, useState } from 'react'
import { obtenerTarifa, guardarTarifa, guardarSucursal } from '../api/tarifas.js'
import { listarProvincias } from '../api/localidades.js'
import { mensajeError } from '../api/client.js'
import MapPreview from '../components/MapPreview.jsx'
import './Pedidos.css'

const SUCURSAL_VACIA = { calle: '', altura: '', localidad: '', provincia: '' }

function sucursalDesdeTarifa(tarifa) {
  return {
    calle: tarifa.sucursal_calle ?? '',
    altura: tarifa.sucursal_altura ?? '',
    localidad: tarifa.sucursal_localidad ?? '',
    provincia: tarifa.sucursal_provincia ?? '',
  }
}

function mensajesPorCampo(campos = {}) {
  return Object.fromEntries(Object.entries(campos).map(([campo, mensaje]) => [
    campo,
    Array.isArray(mensaje) ? mensaje.join(' ') : String(mensaje),
  ]))
}

export default function TarifasPage() {
  const [tarifa, setTarifa] = useState(null)
  const [precio, setPrecio] = useState('')
  const [sucursal, setSucursal] = useState(SUCURSAL_VACIA)
  const [provincias, setProvincias] = useState([])
  const [errorProvincias, setErrorProvincias] = useState('')
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [ocupadoSucursal, setOcupadoSucursal] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [errorSucursal, setErrorSucursal] = useState('')
  const [avisoSucursal, setAvisoSucursal] = useState('')
  const [erroresSucursal, setErroresSucursal] = useState({})
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    obtenerTarifa().then((actual) => {
      if (!vigente) return
      setTarifa(actual)
      setPrecio(actual.precio_km ?? '')
      setSucursal(sucursalDesdeTarifa(actual))
    }).catch((fallo) => {
      if (vigente) setError(mensajeError(fallo))
    }).finally(() => {
      if (vigente) setCargando(false)
    })
    return () => { vigente = false }
  }, [intento])

  useEffect(() => {
    let vigente = true
    listarProvincias().then((nombres) => {
      if (vigente) setProvincias(nombres)
    }).catch((fallo) => {
      if (vigente) setErrorProvincias(mensajeError(fallo))
    })
    return () => { vigente = false }
  }, [])

  async function guardar(e) {
    e.preventDefault(); if (ocupado) return
    setOcupado(true); setError(''); setAviso('')
    try {
      const actual = await guardarTarifa(precio.trim().replace(',', '.'))
      setTarifa(actual)
      setPrecio(actual.precio_km)
      setAviso('Precio por km guardado. Los importes de pedidos existentes se conservan.')
    } catch (fallo) {
      setError(mensajeError(fallo))
    } finally { setOcupado(false) }
  }

  async function guardarDatosSucursal(e) {
    e.preventDefault(); if (ocupadoSucursal) return
    setOcupadoSucursal(true); setErrorSucursal(''); setAvisoSucursal(''); setErroresSucursal({})
    try {
      const actual = await guardarSucursal(sucursal)
      setTarifa(actual)
      setSucursal(sucursalDesdeTarifa(actual))
      setAvisoSucursal('Sucursal guardada y ubicada por Georef.')
    } catch (fallo) {
      const campos = mensajesPorCampo(fallo.response?.data?.error?.campos)
      setErroresSucursal(campos)
      setErrorSucursal(mensajeError(fallo))
    } finally { setOcupadoSucursal(false) }
  }

  const provinciaFueraDeLista = sucursal.provincia !== '' && !provincias.includes(sucursal.provincia)

  return <main className="main-content"><header className="page-header"><div><h1>Tarifa de envío</h1><p>Configuración exclusiva del administrador.</p></div></header>
    <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
      <section className="panel" style={{ padding: 24 }}>
        <h2>Sucursal de salida</h2>
        <p className="subtitle">Georef ubica la sucursal para calcular las sugerencias de envío.</p>
        {errorSucursal && <p role="alert" className="users-alert">{errorSucursal}</p>}
        {avisoSucursal && <p role="status" className="users-ok">{avisoSucursal}</p>}
        <form onSubmit={guardarDatosSucursal}>
          <div className="fields-grid">
            <label className="form-field" htmlFor="sucursal-calle"><span>Calle *</span><input id="sucursal-calle" className={erroresSucursal.calle ? 'campo-error' : ''} required value={sucursal.calle} disabled={cargando || ocupadoSucursal} aria-invalid={Boolean(erroresSucursal.calle)} aria-describedby={erroresSucursal.calle ? 'error-sucursal-calle' : undefined} onChange={(e) => setSucursal((actual) => ({ ...actual, calle: e.target.value }))}/>{erroresSucursal.calle && <small id="error-sucursal-calle" className="campo-ayuda" style={{ color: '#b42318' }}>{erroresSucursal.calle}</small>}</label>
            <label className="form-field" htmlFor="sucursal-altura"><span>Altura *</span><input id="sucursal-altura" className={erroresSucursal.altura ? 'campo-error' : ''} required value={sucursal.altura} disabled={cargando || ocupadoSucursal} aria-invalid={Boolean(erroresSucursal.altura)} aria-describedby={erroresSucursal.altura ? 'error-sucursal-altura' : undefined} onChange={(e) => setSucursal((actual) => ({ ...actual, altura: e.target.value }))}/>{erroresSucursal.altura && <small id="error-sucursal-altura" className="campo-ayuda" style={{ color: '#b42318' }}>{erroresSucursal.altura}</small>}</label>
            <label className="form-field" htmlFor="sucursal-localidad"><span>Localidad *</span><input id="sucursal-localidad" className={erroresSucursal.localidad ? 'campo-error' : ''} required value={sucursal.localidad} disabled={cargando || ocupadoSucursal} aria-invalid={Boolean(erroresSucursal.localidad)} aria-describedby={erroresSucursal.localidad ? 'error-sucursal-localidad' : undefined} onChange={(e) => setSucursal((actual) => ({ ...actual, localidad: e.target.value }))}/>{erroresSucursal.localidad && <small id="error-sucursal-localidad" className="campo-ayuda" style={{ color: '#b42318' }}>{erroresSucursal.localidad}</small>}</label>
            <label className="form-field" htmlFor="sucursal-provincia"><span>Provincia *</span>
              <select id="sucursal-provincia" className={erroresSucursal.provincia ? 'campo-error' : ''} required value={sucursal.provincia} disabled={cargando || ocupadoSucursal} aria-invalid={Boolean(erroresSucursal.provincia)} aria-describedby={erroresSucursal.provincia ? 'error-sucursal-provincia' : undefined} onChange={(e) => setSucursal((actual) => ({ ...actual, provincia: e.target.value }))}>
                <option value="">Elegí una provincia</option>
                {provinciaFueraDeLista && <option value={sucursal.provincia}>{sucursal.provincia}</option>}
                {provincias.map((provincia) => <option key={provincia} value={provincia}>{provincia}</option>)}
              </select>
              {erroresSucursal.provincia && <small id="error-sucursal-provincia" className="campo-ayuda" style={{ color: '#b42318' }}>{erroresSucursal.provincia}</small>}
              {errorProvincias && <small className="campo-ayuda">{errorProvincias}</small>}
            </label>
          </div>
          <button className="button button-primary" disabled={cargando || ocupadoSucursal}>{ocupadoSucursal ? 'Ubicando sucursal…' : 'Guardar sucursal'}</button>
        </form>
        {tarifa?.sucursal_direccion && <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
          <p className="geo-direccion-enviada"><b>Georef ubicó la sucursal en:</b> {tarifa.sucursal_direccion}</p>
          <MapPreview latitud={tarifa.sucursal_latitud} longitud={tarifa.sucursal_longitud} etiqueta={tarifa.sucursal_direccion}/>
        </div>}
      </section>

      <section className="panel" style={{ padding: 24 }}>
        <h2>Precio por kilómetro</h2>
        {cargando && <p role="status">Cargando tarifa…</p>}{error && <p role="alert" className="users-alert">{error}</p>}{aviso && <p role="status" className="users-ok">{aviso}</p>}
        <form onSubmit={guardar}><label className="form-field" htmlFor="tarifa-km"><span>Precio fijo por km (ARS)</span><input id="tarifa-km" inputMode="decimal" required pattern="[0-9]{1,10}([.,][0-9]{1,2})?" value={precio} onChange={e => setPrecio(e.target.value)} disabled={cargando || ocupado}/></label>
          <button className="button button-primary" disabled={cargando || ocupado}>{ocupado ? 'Guardando…' : 'Guardar tarifa'}</button>
          {error && <button type="button" className="button button-outline" disabled={ocupado || cargando} onClick={() => { setError(''); setCargando(true); setIntento(i => i + 1) }}>Reintentar consulta</button>}
        </form>
      </section>
    </div>
  </main>
}
