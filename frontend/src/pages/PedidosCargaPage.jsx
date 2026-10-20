import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import ClienteSelector from '../components/ClienteSelector.jsx'
import ClienteCampos from '../components/ClienteCampos.jsx'
import DireccionForm from '../components/DireccionForm.jsx'
import ProblemasDireccion from '../components/ProblemasDireccion.jsx'
import { DIRECCION_VACIA, motivoConfirmar, motivoGeocodificar, tieneCoordenadas } from '../components/direccion.js'
import { CLIENTE_VACIO, datosDeCliente } from '../components/cliente.js'
import MapPreview from '../components/MapPreview.jsx'
import EstadoValidacionBadge from '../components/EstadoValidacionBadge.jsx'
import { mensajeError } from '../api/client'
import { confirmarDireccion, crearCliente, crearPedido, geocodificarPedido } from '../api/pedidos'
import './Pedidos.css'

const RESULTADOS = {
  OK: 'El proveedor encontró una coincidencia precisa.',
  APPROXIMATE: 'El proveedor encontró una coincidencia aproximada. Revisá el punto antes de confirmar.',
  ZERO_RESULTS: 'El proveedor no encontró la dirección. Corregí los datos o confirmá de forma manual.',
  ERROR: 'No se pudo geocodificar. Revisá la dirección o intentá más tarde.',
}

function PedidosCargaPage() {
  const navegar = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [datosCliente, setDatosCliente] = useState({ ...CLIENTE_VACIO })
  const [direccion, setDireccion] = useState({ ...DIRECCION_VACIA })
  const [observaciones, setObservaciones] = useState('')
  const [pedido, setPedido] = useState(null)
  const [problemas, setProblemas] = useState([])
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [geocodificando, setGeocodificando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const ocupado = guardando || geocodificando || confirmando
  const motivoGeo = motivoGeocodificar(pedido, ocupado)
  const motivoConf = motivoConfirmar(pedido, ocupado)

  function cambiarDireccion(campo, valor) {
    setDireccion((actual) => ({ ...actual, [campo]: valor }))
  }

  function cambiarCliente(campo, valor) {
    setDatosCliente((actual) => ({ ...actual, [campo]: valor }))
  }

  function seleccionarCliente(opcion) {
    setCliente(opcion)
    setDatosCliente(datosDeCliente(opcion))
  }

  async function guardar(event) {
    event.preventDefault()
    const nombre = datosCliente.nombre.trim()
    if (!cliente && !nombre) {
      setError('Elegí un cliente de la lista o completá el nombre para dar de alta uno nuevo.')
      return
    }
    setGuardando(true)
    setError('')
    setAviso('')
    try {
      let clienteId = cliente?.id
      let avisoCliente = ''
      if (!clienteId) {
        const creado = await crearCliente({
          nombre,
          dni: datosCliente.dni.trim() || null,
          telefono: datosCliente.telefono.trim() || null,
          email: datosCliente.email.trim() || null,
        })
        clienteId = creado.cliente.id
        setCliente(creado.cliente)
        setDatosCliente(datosDeCliente(creado.cliente))
        const repetidos = creado.posiblesDuplicados || []
        if (repetidos.length) {
          avisoCliente = `Cliente creado. Atención: hay ${repetidos.length} cliente(s) con teléfono o email parecido.`
        }
      }
      const data = await crearPedido({ cliente_id: clienteId, observaciones: observaciones || null, direccion })
      setPedido(data.pedido)
      setProblemas(data.problemas || [])
      setResultado(null)
      const duplicados = data.posiblesDuplicados || []
      const avisoPedido = duplicados.length
        ? `Pedido guardado. Atención: hay ${duplicados.length} pedido(s) de este cliente con la misma dirección.`
        : 'Pedido guardado como borrador. Geocodificá la dirección para continuar.'
      setAviso([avisoCliente, avisoPedido].filter(Boolean).join(' '))
    } catch (fallo) {
      setError(mensajeError(fallo))
    } finally {
      setGuardando(false)
    }
  }

  async function geocodificar() {
    setGeocodificando(true)
    setError('')
    setAviso('')
    try {
      const data = await geocodificarPedido(pedido.id)
      setPedido(data.pedido)
      setResultado(data)
    } catch (fallo) {
      setError(mensajeError(fallo))
    } finally {
      setGeocodificando(false)
    }
  }

  async function confirmar() {
    setConfirmando(true)
    setError('')
    setAviso('')
    try {
      const actualizado = await confirmarDireccion(pedido.id)
      setPedido(actualizado)
      setResultado(null)
      setAviso('Dirección confirmada. El pedido ya puede despacharse.')
    } catch (fallo) {
      setError(mensajeError(fallo))
    } finally {
      setConfirmando(false)
    }
  }

  function nuevaCarga() {
    setCliente(null)
    setDatosCliente({ ...CLIENTE_VACIO })
    setDireccion({ ...DIRECCION_VACIA })
    setObservaciones('')
    setPedido(null)
    setProblemas([])
    setResultado(null)
    setError('')
    setAviso('')
  }

  return <main className="main-content form-page">
    <header className="page-header">
      <div><p className="eyebrow">Nuevo envío</p><h1>Carga Manual de Pedido</h1><p className="subtitle">Elegí o cargá el cliente, completá la dirección y confirmá la ubicación antes de despachar.</p></div>
      <button className="button button-outline header-action" onClick={() => navegar('/pedidos/revision')}>Bandeja de revisión</button>
    </header>

    {error && <p className="users-alert" role="alert">{error}</p>}
    {aviso && <p className="users-ok" role="status">{aviso}</p>}

    <div className="order-layout">
      <section className="panel order-panel">
        <div className="section-heading"><span className="step-number">1</span><div><h2>Cliente y dirección de entrega</h2><p>Los campos marcados con * son obligatorios.</p></div></div>
        <ClienteSelector cliente={cliente} onSeleccionar={seleccionarCliente} bloqueado={Boolean(pedido) || ocupado}/>
        <div className="form-divider cliente-divider"><span>{cliente ? 'Datos del cliente elegido' : 'o cargá los datos de un cliente nuevo'}</span></div>
        <ClienteCampos valor={datosCliente} onChange={cambiarCliente} bloqueado={Boolean(pedido) || ocupado || Boolean(cliente)}/>
        <div className="form-divider address-divider"><span>Dirección de entrega</span></div>
        <DireccionForm valor={direccion} onChange={cambiarDireccion} bloqueado={Boolean(pedido) || ocupado} problemas={problemas}/>
        <ProblemasDireccion problemas={problemas}/>
        {pedido && problemas.length > 0 && <div className="order-actions">
          <Link className="button button-outline" to={`/pedidos/${pedido.id}/revision`}>Corregir dirección</Link>
        </div>}
        <label className="form-field span-2" htmlFor="pedido-observaciones"><span>Notas / Instrucciones de entrega</span>
          <textarea id="pedido-observaciones" rows="3" value={observaciones} onChange={(event) => setObservaciones(event.target.value)} placeholder="Ej. Tocar timbre B, dejar en recepción..." disabled={Boolean(pedido) || ocupado}/>
        </label>
        {!pedido && <div className="order-actions">
          <button className="button button-primary" onClick={guardar} disabled={ocupado}>{guardando ? 'Guardando…' : 'Guardar pedido'}</button>
        </div>}
      </section>

      <aside className="validation-column">
        <section className="panel geo-panel">
          <div className="section-heading"><span className="step-number">2</span><div><h2>Validación Geográfica</h2><p>La confirmación final siempre es humana.</p></div></div>
          <MapPreview latitud={pedido?.latitud} longitud={pedido?.longitud} etiqueta={pedido?.direccion_original}/>

          {pedido
            ? <div className="validacion-estado">
                <span>Estado de la dirección</span>
                <EstadoValidacionBadge estado={pedido.estado_validacion}/>
              </div>
            : <div className="address-alert"><Icon name="alert" size={15}/><div><b>Sin pedido guardado</b><span>Guardá el borrador para geocodificar y confirmar la ubicación.</span></div></div>}

          {resultado && resultado.motivo && <p className="geo-nota">{resultado.motivo}</p>}
          {resultado && !resultado.motivo && <p className="geo-nota">{RESULTADOS[resultado.resultado]}</p>}
          {pedido?.nivel_confianza && <p className="geo-nota">Confianza del proveedor: <b>{pedido.nivel_confianza}</b> ({resultado?.proveedor || 'nominatim'}).</p>}

          <button type="button" className="button button-outline" onClick={geocodificar} disabled={!pedido || ocupado || pedido.estado_validacion !== 'VALIDA'}><Icon name="pin" size={14}/> {geocodificando ? 'Geocodificando…' : 'Geocodificar dirección'}</button>
          {motivoGeo && <p className="geo-motivo">{motivoGeo}</p>}
          <button type="button" className="button confirm-button" onClick={confirmar} disabled={!pedido || ocupado || pedido.estado_validacion !== 'VALIDA' || !tieneCoordenadas(pedido)}><Icon name="check" size={14}/> {confirmando ? 'Confirmando…' : 'Confirmar ubicación y habilitar despacho'}</button>
          {motivoConf && <p className="geo-motivo">{motivoConf}</p>}
          {pedido && <button type="button" className="button button-outline correct-button" onClick={nuevaCarga} disabled={ocupado}>Cargar otro pedido</button>}
        </section>
        <div className="safe-note"><span><Icon name="check" size={12}/></span><div><b>Despacho seguro</b><small>Una dirección sin confirmar no habilita el despacho.</small></div></div>
      </aside>
    </div>
  </main>
}

export default PedidosCargaPage
