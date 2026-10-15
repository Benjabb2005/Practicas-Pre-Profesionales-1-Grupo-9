import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import DireccionForm from '../components/DireccionForm.jsx'
import MapPreview from '../components/MapPreview.jsx'
import EstadoValidacionBadge from '../components/EstadoValidacionBadge.jsx'
import { mensajeError } from '../api/client'
import { actualizarDireccion, confirmarDireccion, geocodificarPedido, obtenerPedido } from '../api/pedidos'
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

function PedidoRevisionDetallePage() {
  const { id } = useParams()
  const [pedido, setPedido] = useState(null)
  const [direccion, setDireccion] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    let vigente = true
    obtenerPedido(id)
      .then((detalle) => {
        if (!vigente) return
        setPedido(detalle)
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
      setDireccion(direccionDesdePedido(data.pedido))
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
        setAviso(data.motivo || 'Geocodificación registrada.')
      })
      .catch((fallo) => setError(mensajeError(fallo)))
      .finally(() => setOcupado(false))
  }

  const confirmar = () => ejecutar(
    () => confirmarDireccion(id),
    () => 'Dirección confirmada. El pedido ya puede despacharse.'
  )

  if (cargando) {
    return <main className="main-content revision-page"><p className="users-state" role="status">Cargando pedido…</p></main>
  }
  if (!pedido) {
    return <main className="main-content revision-page">
      {error && <p className="users-alert" role="alert">{error}</p>}
      <p className="users-state">No se pudo cargar el pedido.</p>
      <Link className="button button-outline" to="/pedidos/revision">Volver a la bandeja</Link>
    </main>
  }

  const puedeConfirmar = ['VALIDA', 'CON_ADVERTENCIAS'].includes(pedido.estado_validacion)

  return <main className="main-content revision-page">
    <header className="page-header">
      <div><p className="eyebrow">Revisión de dirección</p><h1>Pedido #{pedido.id}</h1><p className="subtitle">{pedido.cliente_nombre || 'Sin cliente'} · {pedido.codigo || 'Sin código interno'}</p></div>
      <Link className="button button-outline header-action" to="/pedidos/revision">Volver a la bandeja</Link>
    </header>

    {error && <p className="users-alert" role="alert">{error}</p>}
    {aviso && <p className="users-ok" role="status">{aviso}</p>}

    <div className="order-layout">
      <section className="panel order-panel">
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
        <DireccionForm valor={direccion} onChange={cambiarDireccion} bloqueado={ocupado}/>
        <div className="order-actions">
          <button className="button button-primary" type="button" onClick={guardarCambios} disabled={ocupado}>Guardar cambios</button>
        </div>

        <div className="form-divider"><span>Historial de geocodificación</span></div>
        {pedido.intentos?.length
          ? <div className="users-table-wrap">
              <table className="users-table">
                <thead><tr><th scope="col">Fecha</th><th scope="col">Resultado</th><th scope="col">Confianza</th><th scope="col">Acción</th></tr></thead>
                <tbody>
                  {pedido.intentos.map((intento) => <tr key={intento.id}>
                    <td>{intento.fecha ? new Date(intento.fecha).toLocaleString('es-AR') : '—'}</td>
                    <td>{intento.resultado}</td>
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
          <MapPreview latitud={pedido.latitud} longitud={pedido.longitud} etiqueta={pedido.direccion_original}/>
          <div className="validacion-estado"><span>Estado de la dirección</span><EstadoValidacionBadge estado={pedido.estado_validacion}/></div>
          {pedido.nivel_confianza && <p className="geo-nota">Confianza del proveedor: <b>{pedido.nivel_confianza}</b>.</p>}
          <button type="button" className="button button-outline" onClick={geocodificar} disabled={ocupado}><Icon name="pin" size={14}/> Geocodificar dirección</button>
          <button type="button" className="button confirm-button" onClick={confirmar} disabled={ocupado || !puedeConfirmar}><Icon name="check" size={14}/> Confirmar ubicación y habilitar despacho</button>
        </section>
        <div className="safe-note"><span><Icon name="check" size={12}/></span><div><b>Despacho seguro</b><small>Cambiar calle o altura invalida la confirmación anterior.</small></div></div>
      </aside>
    </div>
  </main>
}

export default PedidoRevisionDetallePage
