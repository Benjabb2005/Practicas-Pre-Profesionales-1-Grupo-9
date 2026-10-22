import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import ClienteSelector from '../components/ClienteSelector.jsx'
import ClienteCampos from '../components/ClienteCampos.jsx'
import DireccionForm from '../components/DireccionForm.jsx'
import ProblemasDireccion from '../components/ProblemasDireccion.jsx'
import { DIRECCION_VACIA, motivoConfirmar, motivoGeocodificar, tieneCoordenadas } from '../components/direccion.js'
import { CLIENTE_VACIO, datosDeCliente, describirCoincidenciasClientes } from '../components/cliente.js'
import { CANALES_ORIGEN, CANAL_PREDETERMINADO, etiquetaCanal } from '../components/canal.js'
import MapPreview from '../components/MapPreview.jsx'
import EstadoValidacionBadge from '../components/EstadoValidacionBadge.jsx'
import { mensajeError } from '../api/client'
import { crearCliente } from '../api/clientes'
import { confirmarDireccion, crearPedido, geocodificarPedido, pedidosDuplicadosDeError } from '../api/pedidos'
import './Pedidos.css'

const RESULTADOS = {
  OK: 'El proveedor encontró una coincidencia precisa.',
  APPROXIMATE: 'El proveedor encontró una coincidencia aproximada. Revisá el punto antes de confirmar.',
  ZERO_RESULTS: 'No se encontró la dirección. Corregí los datos y volvé a buscar.',
  ERROR: 'No se pudo buscar la dirección. Revisá la conexión o intentá más tarde.',
}

const ETIQUETAS_RESULTADO = {
  OK: 'Coincidencia precisa',
  APPROXIMATE: 'Coincidencia aproximada',
  ZERO_RESULTS: 'Sin resultados',
  ERROR: 'Error de búsqueda',
}

function tonoResultado(resultado) {
  if (resultado === 'OK') return 'ok'
  if (resultado === 'APPROXIMATE') return 'aviso'
  return 'error'
}

function ayudaValidacion(pedido, buscando = false) {
  if (buscando) return 'Buscando la dirección en OpenStreetMap…'
  if (!pedido) return 'Guardá el borrador para buscar el punto en el mapa y confirmar la ubicación.'
  if (pedido.estado_validacion === 'CONFIRMADA') return 'La ubicación ya está confirmada y el despacho está habilitado.'
  if (pedido.estado_validacion === 'VALIDA') {
    return 'Revisá el punto en el mapa. Si es correcto, confirmá la ubicación para habilitar el despacho.'
  }
  if (pedido.estado_validacion === 'CON_ADVERTENCIAS') {
    return 'La dirección tiene advertencias. Corregilas antes de geocodificar o confirmar la ubicación.'
  }
  return 'La dirección todavía no tiene un punto validado. Corregí los datos antes de buscar la dirección en el mapa.'
}

function fechaVisible(valor) {
  if (!valor) return ''
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return ''
  return fecha.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

function PedidosCargaPage() {
  const navegar = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [datosCliente, setDatosCliente] = useState({ ...CLIENTE_VACIO })
  const [direccion, setDireccion] = useState({ ...DIRECCION_VACIA })
  const [canalOrigen, setCanalOrigen] = useState(CANAL_PREDETERMINADO)
  const [observaciones, setObservaciones] = useState('')
  const [pedido, setPedido] = useState(null)
  const [problemas, setProblemas] = useState([])
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [duplicados, setDuplicados] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [geocodificando, setGeocodificando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [versionFormulario, setVersionFormulario] = useState(0)

  const ocupado = guardando || geocodificando || confirmando
  const puedeGeocodificar = Boolean(pedido) && pedido.estado_validacion === 'VALIDA'
  const puedeConfirmar = puedeGeocodificar && tieneCoordenadas(pedido)
  const motivoGeo = motivoGeocodificar(pedido, ocupado)
  const motivoConf = motivoConfirmar(pedido, ocupado)

  function descartarDuplicados() {
    setDuplicados((actuales) => (actuales.length ? [] : actuales))
  }

  function cambiarDireccion(campo, valor) {
    setDireccion((actual) => ({ ...actual, [campo]: valor }))
    descartarDuplicados()
  }

  function cambiarCliente(campo, valor) {
    setDatosCliente((actual) => ({ ...actual, [campo]: valor }))
    descartarDuplicados()
  }

  function seleccionarCliente(opcion) {
    setCliente(opcion)
    setDatosCliente(datosDeCliente(opcion))
    descartarDuplicados()
  }

  async function guardar(event, confirmarDuplicado = false) {
    event?.preventDefault()
    const nombre = datosCliente.nombre.trim()
    if (!cliente && !nombre) {
      setError('Elegí un cliente de la lista o completá el nombre para dar de alta uno nuevo.')
      return
    }
    setGuardando(true)
    setError('')
    setAviso('')
    let avisoCliente = ''
    try {
      let clienteId = cliente?.id
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
          avisoCliente = `Cliente creado. ${describirCoincidenciasClientes(repetidos)}`
        }
      }
      const cuerpo = { cliente_id: clienteId, canal_origen: canalOrigen, observaciones: observaciones || null, direccion }
      if (confirmarDuplicado) cuerpo.confirmar_duplicado = true
      const data = await crearPedido(cuerpo)
      setPedido(data.pedido)
      setProblemas(data.problemas || [])
      setResultado(null)
      setDuplicados([])
      const confirmados = data.posiblesDuplicados || []
      const canal = etiquetaCanal(data.pedido.canal_origen)
      const avisoPedido = confirmados.length
        ? `Pedido guardado en EN STOCK (canal: ${canal}) después de confirmar la coincidencia con ${confirmados.length} pedido(s) existente(s).`
        : `Pedido guardado como borrador EN STOCK (canal: ${canal}).`
      setAviso([avisoCliente, avisoPedido].filter(Boolean).join(' '))
      // La búsqueda automática no bloquea el alta: si falla, el pedido ya quedó
      // guardado y el operador puede reintentarla con el botón del panel. Sólo se
      // intenta con una dirección VALIDA; si hay advertencias, primero se corrigen.
      if (data.pedido.estado_validacion === 'VALIDA') {
        void buscarDireccion(data.pedido.id)
      } else if ((data.problemas || []).length) {
        setAviso((actual) => `${actual} Corregí las advertencias de la dirección antes de buscarla en el mapa.`)
      }
    } catch (fallo) {
      if (avisoCliente) setAviso(avisoCliente)
      const pendientes = pedidosDuplicadosDeError(fallo)
      if (pendientes.length) {
        setDuplicados(pendientes)
        setError('')
        return
      }
      setError(mensajeError(fallo))
    } finally {
      setGuardando(false)
    }
  }

  async function buscarDireccion(id) {
    if (!id) return
    setGeocodificando(true)
    setError('')
    setResultado(null)
    try {
      const data = await geocodificarPedido(id)
      setPedido(data.pedido)
      setResultado(data)
    } catch (fallo) {
      setError(`El pedido se guardó, pero no se pudo buscar la dirección. ${mensajeError(fallo)}`)
    } finally {
      setGeocodificando(false)
    }
  }

  function geocodificar() {
    if (!pedido) return
    setAviso('')
    return buscarDireccion(pedido.id)
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
    setCanalOrigen(CANAL_PREDETERMINADO)
    setObservaciones('')
    setPedido(null)
    setProblemas([])
    setResultado(null)
    setError('')
    setAviso('Formulario limpio. Cargá el próximo pedido.')
    setDuplicados([])
    // Fuerza el remount del selector para borrar también su búsqueda y resultados.
    setVersionFormulario((actual) => actual + 1)
  }

  return <main className="main-content form-page">
    <header className="page-header">
      <div><p className="eyebrow">Nuevo envío</p><h1>Carga Manual de Pedido</h1><p className="subtitle">Buscá al cliente frecuente por DNI, nombre o teléfono, o cargá sus datos como cliente nuevo. Después completá la dirección y confirmá la ubicación antes de despachar.</p></div>
      <button className="button button-outline header-action" onClick={() => navegar('/pedidos/revision')}>Bandeja de revisión</button>
    </header>

    {error && <p className="users-alert" role="alert">{error}</p>}
    {aviso && <p className="users-ok" role="status">{aviso}</p>}

    <div className="order-layout">
      <section className="panel order-panel">
        <div className="section-heading"><span className="step-number">1</span><div><h2>Cliente y dirección de entrega</h2><p>Los campos marcados con * son obligatorios.</p></div></div>
        <ClienteSelector key={versionFormulario} cliente={cliente} onSeleccionar={seleccionarCliente} bloqueado={Boolean(pedido) || ocupado}/>
        <div className="form-divider cliente-divider"><span>{cliente ? 'Datos del cliente elegido' : 'o cargá los datos de un cliente nuevo'}</span></div>
        <ClienteCampos valor={datosCliente} onChange={cambiarCliente} bloqueado={Boolean(pedido) || ocupado || Boolean(cliente)}/>
        <div className="form-divider address-divider"><span>Dirección de entrega</span></div>
        <DireccionForm valor={direccion} onChange={cambiarDireccion} bloqueado={Boolean(pedido) || ocupado} problemas={problemas}/>
        <ProblemasDireccion problemas={problemas}/>
        {pedido && problemas.length > 0 && <div className="order-actions">
          <Link className="button button-outline" to={`/pedidos/${pedido.id}/revision`}>Corregir dirección</Link>
        </div>}
        <div className="form-divider order-data-divider"><span>Datos del pedido</span></div>
        <label className="form-field" htmlFor="pedido-canal"><span>Canal de origen</span>
          <select id="pedido-canal" value={canalOrigen} onChange={(event) => { setCanalOrigen(event.target.value); descartarDuplicados() }} disabled={Boolean(pedido) || ocupado}>
            {CANALES_ORIGEN.map((opcion) => <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>)}
          </select>
        </label>
        <label className="form-field span-2 pedido-observaciones" htmlFor="pedido-observaciones"><span>Notas / Instrucciones de entrega</span>
          <textarea id="pedido-observaciones" rows="3" value={observaciones} onChange={(event) => { setObservaciones(event.target.value); descartarDuplicados() }} placeholder="Ej. Tocar timbre B, dejar en recepción..." disabled={Boolean(pedido) || ocupado}/>
        </label>
        {duplicados.length > 0 && <div className="duplicate-alert" role="alert">
          <div className="duplicate-alert-heading">
            <Icon name="alert" size={15}/>
            <div><b>Posible pedido duplicado</b><span>Este cliente ya tiene un pedido con la misma dirección dentro de la ventana configurada. Revisá el pedido existente antes de continuar.</span></div>
          </div>
          <ul className="duplicate-list">
            {duplicados.map((existente) => <li key={existente.id}>
              <b>{existente.codigo ? `Pedido ${existente.codigo}` : `Pedido #${existente.id}`}</b>
              <span>{existente.estado}{fechaVisible(existente.created_at) && ` · ${fechaVisible(existente.created_at)}`}</span>
              {existente.direccion_original && <small>{existente.direccion_original}</small>}
            </li>)}
          </ul>
          <p>Si el envío es realmente otro, confirmá la creación. Si no, cancelá y corregí los datos.</p>
          <div className="duplicate-actions">
            <button type="button" className="button button-primary" onClick={() => guardar(null, true)} disabled={ocupado}>{guardando ? 'Guardando…' : 'Sí, crear otro pedido'}</button>
            <button type="button" className="button button-outline" onClick={descartarDuplicados} disabled={ocupado}>Cancelar</button>
          </div>
        </div>}
        {!pedido && <>
          <div className="order-actions">
            <button className="button button-primary" onClick={guardar} disabled={ocupado || duplicados.length > 0}>{guardando ? 'Guardando…' : 'Guardar pedido'}</button>
          </div>
          <p className="order-help">Guardar crea el pedido como borrador <b>EN STOCK</b>. La ubicación se confirma en el paso 2 y recién ahí se habilita el despacho.</p>
        </>}
      </section>

      <aside className="validation-column">
        <section className="panel geo-panel">
          <div className="section-heading"><span className="step-number">2</span><div><h2>Validación Geográfica</h2><p>La confirmación final siempre es humana.</p></div></div>
          <MapPreview latitud={pedido?.latitud} longitud={pedido?.longitud} etiqueta={pedido?.direccion_original} buscando={geocodificando}/>

          {pedido
            ? <div className="validacion-estado">
                <span>Estado de la dirección</span>
                <EstadoValidacionBadge estado={pedido.estado_validacion}/>
              </div>
            : <div className="address-alert"><Icon name="alert" size={15}/><div><b>Sin pedido guardado</b><span>Guardá el borrador para buscar el punto y confirmar la ubicación.</span></div></div>}

          {pedido && <dl className="detalle-datos pedido-resumen">
            <div><dt>Canal de origen</dt><dd>{etiquetaCanal(pedido.canal_origen)}</dd></div>
            <div><dt>Estado del pedido</dt><dd>{pedido.estado}</dd></div>
          </dl>}

          {resultado && <div className={`geo-resultado ${tonoResultado(resultado.resultado)}`} role="status">
            <b>{ETIQUETAS_RESULTADO[resultado.resultado] || 'Búsqueda registrada'}</b>
            <span>{RESULTADOS[resultado.resultado] || resultado.motivo || 'Búsqueda registrada.'}</span>
          </div>}
          {pedido?.nivel_confianza && <p className="geo-nota">Confianza del proveedor: <b>{pedido.nivel_confianza}</b> ({resultado?.proveedor || 'nominatim'}).</p>}

          <p className="geo-ayuda" id="geo-ayuda">{ayudaValidacion(pedido, geocodificando)}</p>
          {pedido && <p className="geo-ayuda">Si el punto no es correcto, <Link to={`/pedidos/${pedido.id}/revision`}>corregí la dirección en la revisión</Link>.</p>}
          <button type="button" className="button button-outline" onClick={geocodificar} disabled={!puedeGeocodificar || ocupado} aria-describedby="geo-ayuda" title="Consulta OpenStreetMap y marca el punto; no confirma la ubicación"><Icon name="pin" size={14}/> {geocodificando ? 'Buscando en el mapa…' : 'Buscar dirección en el mapa'}</button>
          {motivoGeo && <p className="geo-motivo">{motivoGeo}</p>}
          <button type="button" className="button confirm-button" onClick={confirmar} disabled={!puedeConfirmar || ocupado} aria-describedby="geo-ayuda" title={motivoConf || undefined}><Icon name="check" size={14}/> {confirmando ? 'Confirmando…' : 'Confirmar ubicación y habilitar despacho'}</button>
          {motivoConf && <p className="geo-motivo">{motivoConf}</p>}
          {pedido && <button type="button" className="button button-outline correct-button" onClick={nuevaCarga} disabled={ocupado} title="Limpia el formulario para cargar un pedido nuevo">Cargar otro pedido</button>}
        </section>
        <div className="safe-note"><span><Icon name="check" size={12}/></span><div><b>Despacho seguro</b><small>Una dirección sin confirmar no habilita el despacho.</small></div></div>
      </aside>
    </div>
  </main>
}

export default PedidosCargaPage
