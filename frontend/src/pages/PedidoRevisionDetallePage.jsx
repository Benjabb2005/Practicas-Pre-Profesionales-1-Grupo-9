import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Paginacion from '../components/Paginacion.jsx'
import usePagination from '../components/usePagination.js'
import Icon from '../components/Icon.jsx'
import DireccionForm from '../components/DireccionForm.jsx'
import ProblemasDireccion from '../components/ProblemasDireccion.jsx'
import MapPreview from '../components/MapPreview.jsx'
import EstadoValidacionBadge from '../components/EstadoValidacionBadge.jsx'
import CompletarImporte from '../components/CompletarImporte.jsx'
import { motivoConfirmar, motivoGeocodificar, tieneCoordenadas } from '../components/direccion.js'
import { mensajeError } from '../api/client'
import { actualizarDireccion, confirmarDireccion, geocodificarPedido, obtenerPedido, rechazarUbicacion } from '../api/pedidos'
import './Pedidos.css'

function direccionDesdePedido(pedido) {
  return {
    calle: pedido?.calle || '',
    altura: pedido?.altura || '',
    piso_depto: pedido?.piso_depto || '',
    entre_calles: pedido?.entre_calles || '',
    localidad: pedido?.localidad || '',
    provincia: pedido?.provincia || '',
    codigo_postal: pedido?.codigo_postal || '',
  }
}

function PedidoRevisionDetallePage({ pedidoId } = {}) {
  const { id: idRuta } = useParams()
  const id = pedidoId ?? idRuta
  const Contenedor = pedidoId == null ? 'main' : 'div'
  const [pedido, setPedido] = useState(null)
  const [problemas, setProblemas] = useState([])
  const [direccion, setDireccion] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [candidatos, setCandidatos] = useState([])
  const [indiceCandidato, setIndiceCandidato] = useState(null)
  const historialPaginado = usePagination(pedido?.intentos ?? [], String(id))
  const candidatosPaginados = usePagination(candidatos, String(id), 5)
  const formularioRef = useRef(null)

  useEffect(() => {
    let vigente = true
    obtenerPedido(id)
      .then((detalle) => {
        if (!vigente) return
        setPedido(detalle)
        setProblemas(detalle.problemas || [])
        setDireccion(direccionDesdePedido(detalle))
      })
      .catch((fallo) => { if (vigente) setError(mensajeError(fallo)) })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [id])

  function cambiarDireccion(campo, valor) {
    setDireccion((actual) => ({ ...actual, [campo]: valor }))
  }

  async function ejecutar(accion, exito) {
    setOcupado(true)
    setError('')
    setAviso('')
    try {
      const actualizado = await accion()
      setPedido(actualizado)
      setDireccion(direccionDesdePedido(actualizado))
      setAviso(exito(actualizado))
    } catch (fallo) {
      setError(mensajeError(fallo))
    } finally {
      setOcupado(false)
    }
  }

  const guardarCambios = async () => {
    setOcupado(true)
    setError('')
    setAviso('')
    try {
      const data = await actualizarDireccion(id, direccion)
      setPedido(data.pedido)
      setProblemas(data.problemas || [])
      setDireccion(direccionDesdePedido(data.pedido))
      setCandidatos([])
      setIndiceCandidato(null)
      setAviso(data.invalidada ? 'La dirección cambió: se invalidó la confirmación previa.' : 'Dirección actualizada.')
    } catch (fallo) {
      setError(mensajeError(fallo))
    } finally {
      setOcupado(false)
    }
  }

  const geocodificar = () => {
    setOcupado(true)
    setError('')
    setAviso('')
    return geocodificarPedido(id)
      .then((data) => {
        setPedido(data.pedido)
        setCandidatos(data.candidatos || [])
        setIndiceCandidato(null)
        setAviso(data.motivo || 'Geocodificación registrada.')
      })
      .catch((fallo) => setError(mensajeError(fallo)))
      .finally(() => setOcupado(false))
  }

  const usarCandidato = async () => {
    if (indiceCandidato === null) return
    setOcupado(true)
    setError('')
    try {
      const data = await geocodificarPedido(id, indiceCandidato)
      setPedido(data.pedido)
      setCandidatos([])
      setIndiceCandidato(null)
      setAviso('Ubicación seleccionada. Revisala en el mapa y confirmala si es correcta.')
    } catch (fallo) {
      setError(mensajeError(fallo))
    } finally { setOcupado(false) }
  }

  const corregirUbicacion = async () => {
    setOcupado(true)
    setError('')
    try {
      const actualizado = await rechazarUbicacion(id)
      setPedido(actualizado)
      setCandidatos([])
      setIndiceCandidato(null)
      setAviso('Marcaste la ubicación como incorrecta. Corregí la dirección y guardá para validarla de nuevo.')
      formularioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (fallo) { setError(mensajeError(fallo)) }
    finally { setOcupado(false) }
  }

  const confirmar = () => ejecutar(
    () => confirmarDireccion(id),
    () => 'Dirección confirmada. El pedido ya puede despacharse.'
  )

  if (cargando) {
    return <Contenedor className="main-content revision-page"><p className="users-state" role="status">Cargando pedido…</p></Contenedor>
  }
  if (!pedido) {
    return <Contenedor className="main-content revision-page">
      {error && <p className="users-alert" role="alert">{error}</p>}
      <p className="users-state">No se pudo cargar el pedido.</p>
      {pedidoId == null && <Link className="button button-outline" to="/pedidos/revision">Volver a la bandeja</Link>}
    </Contenedor>
  }

  const motivoGeo = motivoGeocodificar(pedido, ocupado)
  const motivoConf = motivoConfirmar(pedido, ocupado)
  const candidatoElegido = candidatos.find((candidato) => candidato.indice === indiceCandidato)

  return <Contenedor className="main-content revision-page">
    {pedidoId == null && <header className="page-header">
      <div><p className="eyebrow">Revisión de dirección</p><h1>Pedido #{pedido.id}</h1><p className="subtitle">{pedido.cliente_nombre || 'Sin cliente'} · {pedido.codigo || 'Sin código interno'}</p></div>
      <Link className="button button-outline header-action" to="/pedidos/revision">Volver a la bandeja</Link>
    </header>}

    {error && <p className="users-alert" role="alert">{error}</p>}
    {aviso && <p className="users-ok" role="status">{aviso}</p>}

    <div className="order-layout">
      <section className="panel order-panel" ref={formularioRef}>
        <div className="section-heading"><span className="step-number">1</span><div><h2>Datos del cliente y dirección</h2><p>Corregí lo que haga falta y guardá los cambios.</p></div></div>
        <dl className="detalle-datos">
          <div><dt>Cliente</dt><dd>{pedido.cliente_nombre || 'Sin cliente'}</dd></div>
          <div><dt>DNI</dt><dd>{pedido.cliente_dni || '—'}</dd></div>
          <div><dt>Teléfono</dt><dd>{pedido.cliente_telefono || '—'}</dd></div>
          <div><dt>Email</dt><dd>{pedido.cliente_email || '—'}</dd></div>
          <div><dt>Estado</dt><dd>{pedido.estado}</dd></div>
          <div><dt>Validación</dt><dd><EstadoValidacionBadge estado={pedido.estado_validacion}/></dd></div>
        </dl>
        <div className="form-divider address-divider"><span>Dirección de entrega</span></div>
        <DireccionForm valor={direccion} onChange={cambiarDireccion} bloqueado={ocupado} problemas={problemas}/>
        <ProblemasDireccion problemas={problemas}/>
        <div className="order-actions">
          <button className="button button-primary" type="button" onClick={guardarCambios} disabled={ocupado}>Guardar cambios</button>
        </div>

        <Paginacion datos={historialPaginado} nombre="historial de geocodificación" disabled={ocupado}/>
        <div className="form-divider"><span>Historial de geocodificación</span></div>
        {pedido.intentos?.length
          ? <div className="users-table-wrap">
              <table className="users-table">
                <thead><tr><th scope="col">Fecha</th><th scope="col">Dirección enviada</th><th scope="col">Resultado</th><th scope="col">Coordenadas</th><th scope="col">Confianza</th><th scope="col">Acción</th></tr></thead>
                <tbody>
                  {historialPaginado.items.map((intento) => <tr key={intento.id}>
                    <td>{intento.fecha ? new Date(intento.fecha).toLocaleString('es-AR') : '—'}</td>
                    <td>{intento.direccion_enviada || '—'}</td>
                    <td>{intento.resultado}</td>
                    <td>{intento.latitud == null || intento.longitud == null ? '—' : `${intento.latitud}, ${intento.longitud}`}</td>
                    <td>{intento.nivel_confianza || '—'}</td>
                    <td>{intento.accion_operador || 'Automático'}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          : <p className="users-state">Todavía no hay intentos de geocodificación.</p>}
      </section>

      <aside className="validation-column">
        <section className="panel geo-panel">
          <div className="section-heading"><span className="step-number">2</span><div><h2>Validación Geográfica</h2><p>La confirmación final siempre es humana.</p></div></div>
          <MapPreview latitud={candidatoElegido?.latitud ?? pedido.latitud} longitud={candidatoElegido?.longitud ?? pedido.longitud} etiqueta={candidatoElegido?.direccion || pedido.direccion_original}/>
          <p className="geo-direccion-enviada"><b>Dirección enviada:</b> {pedido.direccion_original || 'Sin texto original'}</p>
          <div className="validacion-estado"><span>Estado de la dirección</span><EstadoValidacionBadge estado={pedido.estado_validacion}/></div>
          {(candidatoElegido?.nivelConfianza || pedido.nivel_confianza) && <p className="geo-nota">Confianza del proveedor: <b>{candidatoElegido?.nivelConfianza || pedido.nivel_confianza}</b>.</p>}
          <button type="button" className="button button-outline" onClick={geocodificar} disabled={ocupado || pedido.estado_validacion !== 'VALIDA'}><Icon name="pin" size={14}/> Geocodificar dirección</button>
          {motivoGeo && <p className="geo-motivo">{motivoGeo}</p>}
          {candidatos.length > 1 && <fieldset className="geo-candidatos">
            <legend>Encontramos varias ubicaciones. Elegí la correcta:</legend>
            {candidatosPaginados.items.map((candidato) => <label key={candidato.indice}>
              <input type="radio" name="candidato-geo" checked={indiceCandidato === candidato.indice} onChange={() => setIndiceCandidato(candidato.indice)}/>
              <span>{candidato.direccion}<small>Confianza: {candidato.nivelConfianza || 'BAJO'}</small></span>
            </label>)}
            <Paginacion datos={candidatosPaginados} nombre="ubicaciones candidatas" disabled={ocupado}/>
            <button className="button button-outline" type="button" disabled={ocupado || indiceCandidato === null} onClick={usarCandidato}>Usar ubicación seleccionada</button>
          </fieldset>}
          {tieneCoordenadas(pedido) && pedido.estado_validacion !== 'CONFIRMADA' && <button type="button" className="button button-outline" onClick={corregirUbicacion} disabled={ocupado}>No es correcta</button>}
          <button type="button" className="button confirm-button" onClick={confirmar} disabled={ocupado || pedido.estado_validacion !== 'VALIDA' || !tieneCoordenadas(pedido)}><Icon name="check" size={14}/> Confirmar ubicación</button>
          {motivoConf && <p className="geo-motivo">{motivoConf}</p>}
        </section>
        {pedido.estado_validacion === 'CONFIRMADA' && pedido.importe_base == null && <section className="panel" style={{ padding: 18 }}>
          <h2>Completar importe</h2>
          <CompletarImporte pedido={pedido} onGuardado={setPedido}/>
        </section>}
        <div className="safe-note"><span><Icon name="check" size={12}/></span><div><b>Despacho seguro</b><small>Cambiar calle o altura invalida la confirmación anterior.</small></div></div>
      </aside>
    </div>
  </Contenedor>
}

export default PedidoRevisionDetallePage
