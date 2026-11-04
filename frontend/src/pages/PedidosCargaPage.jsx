import Paginacion from '../components/Paginacion.jsx'
import usePagination from '../components/usePagination.js'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import ClienteSelector from '../components/ClienteSelector.jsx'
import ClienteCampos from '../components/ClienteCampos.jsx'
import DireccionesCliente from '../components/DireccionesCliente.jsx'
import { camposDeDireccionGuardada } from '../components/direccionesCliente.js'
import DireccionForm from '../components/DireccionForm.jsx'
import ProblemasDireccion from '../components/ProblemasDireccion.jsx'
import { DIRECCION_VACIA, claveBusqueda, motivoConfirmar, motivoGeocodificar, tieneCoordenadas, puntoPrevisualizado } from '../components/direccion.js'
import { CLIENTE_VACIO, datosDeCliente, describirCoincidenciasClientes } from '../components/cliente.js'
import { CANALES_ORIGEN, CANAL_PREDETERMINADO, etiquetaCanal } from '../components/canal.js'
import MapPreview from '../components/MapPreview.jsx'
import PrevisualizacionUbicacion from '../components/PrevisualizacionUbicacion.jsx'
import { usePrevisualizacionUbicacion } from '../components/usePrevisualizacionUbicacion.js'
import EstadoValidacionBadge from '../components/EstadoValidacionBadge.jsx'
import { mensajeError } from '../api/client'
import { crearCliente } from '../api/clientes'
import { confirmarDireccion, crearPedido, geocodificarPedido, pedidosDuplicadosDeError } from '../api/pedidos'
import ImportePedido from '../components/ImportePedido.jsx'
import CompletarImporte from '../components/CompletarImporte.jsx'
import { useImporteDuranteCarga } from '../components/useImporteDuranteCarga.js'
import { importeDuranteCarga } from '../components/importeSugerido.js'
import SugerenciaImporteCarga from '../components/SugerenciaImporteCarga.jsx'
import './Pedidos.css'
import ProcesoCarga from '../components/ProcesoCarga.jsx'
import { conCargaMinima } from '../components/cargaMinima.js'
import { cambiarEstadoPedido } from '../api/asignaciones'
import PedidoGuardado from '../components/PedidoGuardado.jsx'

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
  if (buscando) return 'Buscando la dirección en Georef…'
  if (!pedido) return 'La ubicación del mapa es tentativa. Guardá el pedido para confirmarla antes de despachar.'
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
  const [claveGuardada, setClaveGuardada] = useState('')
  const [canalOrigen, setCanalOrigen] = useState(CANAL_PREDETERMINADO)
  const [observaciones, setObservaciones] = useState('')
  const [importeManual, setImporteManual] = useState(null)
  const [pedido, setPedido] = useState(null)
  const [problemas, setProblemas] = useState([])
  const [resultado, setResultado] = useState(null)
  const [indiceCandidato, setIndiceCandidato] = useState(null)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [duplicados, setDuplicados] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [geocodificando, setGeocodificando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [preparando, setPreparando] = useState(false)
  const [guardadoVisible, setGuardadoVisible] = useState(null)
  const [versionFormulario, setVersionFormulario] = useState(0)
  const [elegidoPrevio, setElegidoPrevio] = useState({ datos: null, indice: null })

  // Búsqueda tentativa mientras se completa la dirección; se apaga al guardar.
  const previsualizacion = usePrevisualizacionUbicacion(direccion, { activa: !pedido })
  // La elección vale sólo para el resultado que la originó: uno nuevo la descarta.
  const indiceElegido = elegidoPrevio.datos === previsualizacion.datos ? elegidoPrevio.indice : null
  const candidatosPrevios = previsualizacion.fase === 'lista' ? previsualizacion.datos?.candidatos ?? [] : []
  const puntoPrevio = puntoPrevisualizado(previsualizacion, elegidoPrevio)
  const mensajeMapaPrevio = previsualizacion.fase === 'lista' && candidatosPrevios.length > 1 && !puntoPrevio
    ? 'Elegí una de las ubicaciones posibles para verla en el mapa.'
    : 'Completá la dirección y el mapa mostrará una ubicación tentativa.'

  const consultaImporte = useImporteDuranteCarga(puntoPrevio, claveBusqueda(direccion), previsualizacion.datos, !pedido)
  const importeBase = pedido ? String(pedido.importe_base ?? '') : importeDuranteCarga(importeManual, consultaImporte.datos)
  const prepararRef = useRef(null)
  const pedidoDestacadoRef = useRef(null)

  const ocupado = guardando || geocodificando || confirmando || preparando
  const puedePreparar = !ocupado && pedido?.estado === 'EN STOCK' && pedido.estado_validacion === 'CONFIRMADA'
  const pedidoListoId = puedePreparar && pedido.importe_base != null && !guardadoVisible ? pedido.id : null
  useEffect(() => {
    if (!pedidoListoId || pedidoDestacadoRef.current === pedidoListoId) return
    const frame = requestAnimationFrame(() => {
      const boton = prepararRef.current
      if (!boton) return
      pedidoDestacadoRef.current = pedidoListoId
      const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      boton.scrollIntoView({ behavior: reducir ? 'instant' : 'smooth', block: 'center' })
      const resaltado = { outline: '3px solid #93b4ff', outlineOffset: '5px', boxShadow: '0 0 0 8px #739ee945' }
      boton.animate(reducir ? [resaltado, resaltado] : [
        resaltado,
        { outline: '3px solid transparent', outlineOffset: '5px', boxShadow: '0 0 0 8px transparent' },
      ], { duration: 3200, easing: 'ease-in', iterations: 1 })
    })
    return () => cancelAnimationFrame(frame)
  }, [pedidoListoId])
  async function preparar() {
    if (ocupado || pedido?.estado !== 'EN STOCK' || pedido.estado_validacion !== 'CONFIRMADA') return
    setPreparando(true); setError(''); setAviso('')
    try {
      const actualizado = await cambiarEstadoPedido(pedido.id, 'EN PREPARACIÓN')
      setPedido(actual => ({ ...actual, ...actualizado }))
      setAviso('Pedido en preparación. Asigná un chofer en Asignación y despacho para continuar.')
    } catch (e) { setError(mensajeError(e)) }
    finally { setPreparando(false) }
  }
  const puedeGeocodificar = Boolean(pedido) && pedido.estado_validacion === 'VALIDA'
  const puedeConfirmar = puedeGeocodificar && tieneCoordenadas(pedido)
  const motivoGeo = motivoGeocodificar(pedido, ocupado)
  const motivoConf = motivoConfirmar(pedido, ocupado)

  function descartarDuplicados() {
    setDuplicados((actuales) => (actuales.length ? [] : actuales))
  }

  function cambiarDireccion(campo, valor) {
    setClaveGuardada('')
    setDireccion((actual) => ({ ...actual, [campo]: valor }))
    descartarDuplicados()
  }

  function cambiarCliente(campo, valor) {
    setDatosCliente((actual) => ({ ...actual, [campo]: valor }))
    descartarDuplicados()
  }

  function seleccionarCliente(opcion) {
    if (opcion?.id !== cliente?.id) {
      setDireccion({ ...DIRECCION_VACIA })
      setClaveGuardada('')
      setImporteManual(null)
      setElegidoPrevio({ datos: null, indice: null })
      setProblemas([])
    }
    setCliente(opcion)
    setDatosCliente(datosDeCliente(opcion))
    descartarDuplicados()
  }

  function usarDireccionGuardada(opcion) {
    setDireccion(camposDeDireccionGuardada(opcion))
    setClaveGuardada(opcion?.clave ?? '')
    setImporteManual(null)
    setElegidoPrevio({ datos: null, indice: null })
    setProblemas([])
    descartarDuplicados()
  }

  async function guardar(event, confirmarDuplicado = false) {
    event?.preventDefault()
    const nombre = datosCliente.nombre.trim()
    if (!cliente && !nombre) {
      setError('Elegí un cliente de la lista o completá el nombre para dar de alta uno nuevo.')
      return
    }
    const faltantes = [['dni', 'DNI'], ['telefono', 'teléfono']]
      .filter(([campo]) => !datosCliente[campo].trim()).map(([, etiqueta]) => etiqueta)
    if (faltantes.length || !direccion.codigo_postal.trim()) {
      if (!direccion.codigo_postal.trim()) faltantes.push('código postal')
      setError(`Completá los campos obligatorios: ${faltantes.join(', ')}.${cliente ? ' Los datos del cliente se corrigen desde Clientes.' : ''}`)
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
      if (importeBase.trim()) cuerpo.importe_base = importeBase.trim().replace(',', '.')
      if (confirmarDuplicado) cuerpo.confirmar_duplicado = true
      const data = await conCargaMinima(crearPedido(cuerpo))
      setPedido(data.pedido)
      setGuardadoVisible(data.pedido)
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
      const campos = fallo.response?.data?.error?.campos
      setError(campos ? Object.values(campos).flat().join(' ') : mensajeError(fallo))
    } finally {
      setGuardando(false)
    }
  }

  async function buscarDireccion(id) {
    if (!id) return
    setGeocodificando(true)
    setError('')
    setResultado(null)
    setIndiceCandidato(null)
    try {
      const data = await geocodificarPedido(id)
      setPedido(data.pedido)
      setResultado(data)
      setIndiceCandidato(null)
    } catch (fallo) {
      setError(`El pedido se guardó, pero no se pudo buscar la dirección. ${mensajeError(fallo)}`)
    } finally {
      setGeocodificando(false)
    }
  }

  async function usarCandidato() {
    if (!pedido || indiceCandidato === null) return
    setGeocodificando(true)
    setError('')
    try {
      const data = await geocodificarPedido(pedido.id, indiceCandidato)
      setPedido(data.pedido)
      setResultado(data)
      setIndiceCandidato(null)
    } catch (fallo) { setError(mensajeError(fallo)) }
    finally { setGeocodificando(false) }
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
    setClaveGuardada('')
    pedidoDestacadoRef.current = null
    setCliente(null)
    setDatosCliente({ ...CLIENTE_VACIO })
    setDireccion({ ...DIRECCION_VACIA })
    setCanalOrigen(CANAL_PREDETERMINADO)
    setObservaciones('')
    setImporteManual(null)
    setPedido(null)
    setProblemas([])
    setResultado(null)
    setIndiceCandidato(null)
    setError('')
    setAviso('Formulario limpio. Cargá el próximo pedido.')
    setDuplicados([])
    // Fuerza el remount del selector para borrar también su búsqueda y resultados.
    setVersionFormulario((actual) => actual + 1)
  }

  const duplicadosPaginados = usePagination(duplicados, versionFormulario, 5)
  const candidatosPaginados = usePagination(resultado?.candidatos ?? [], pedido?.id, 5)
  return <main className="main-content form-page">
    <header className="page-header">
      <div><p className="eyebrow">Pedidos / Nuevo pedido</p><h1>Un envío empieza con una buena dirección.</h1><p className="subtitle">Elegí al cliente, completá los datos y revisá el destino antes de despachar.</p></div>
      <button className="button button-outline header-action" onClick={() => navegar('/pedidos/revision')}>Bandeja de revisión</button>
    </header>

    <ol className="order-journey" aria-label="Progreso del pedido">
      <li className={!pedido ? 'current' : 'complete'} aria-current={!pedido ? 'step' : undefined}><span>{pedido ? '✓' : '1'}</span>Cliente y pedido</li>
      <li className={pedido?.estado_validacion === 'CONFIRMADA' ? 'complete' : pedido ? 'current' : ''} aria-current={pedido && pedido.estado_validacion !== 'CONFIRMADA' ? 'step' : undefined}><span>{pedido?.estado_validacion === 'CONFIRMADA' ? '✓' : '2'}</span>Revisar ubicación</li>
      <li className={pedido?.estado === 'EN PREPARACIÓN' ? 'complete' : ''}><button ref={prepararRef} type="button" className="journey-action" onClick={preparar} disabled={!puedePreparar}><span>{pedido?.estado === 'EN PREPARACIÓN' ? '✓' : '3'}</span>{preparando ? 'Preparando…' : pedido?.estado === 'EN PREPARACIÓN' ? 'En preparación' : puedePreparar ? 'Preparar pedido →' : 'Listo para preparar'}</button></li>
      {pedido?.estado === 'EN PREPARACIÓN' && <li className="journey-next"><Link className="button button-primary" to="/asignaciones"><Icon name="truck" size={18}/>Asignar chofer →</Link></li>}
    </ol>
    {guardando && <ProcesoCarga pantalla titulo="Un momento. Ya estamos en camino." detalle="Estamos guardando los datos del pedido."/>}
    {!guardando && guardadoVisible && <PedidoGuardado pedido={guardadoVisible} onContinuar={() => setGuardadoVisible(null)}/>}
    {!guardando && (geocodificando || confirmando) && <ProcesoCarga titulo={confirmando ? 'Confirmando la ubicación…' : 'Buscando el destino…'} detalle={confirmando ? 'Registrando tu confirmación en el historial.' : 'Consultando el mapa. La revisión final sigue en tus manos.'}/>}

    {error && <p className="users-alert" role="alert">{error}</p>}
    {aviso && <p className="users-ok" role="status">{aviso}</p>}

    <div className="order-layout" aria-busy={ocupado}>
      <section className="panel order-panel">
        <div className="section-heading"><span className="step-number">1</span><div><h2>Cliente y dirección de entrega</h2><p>Los campos marcados con * son obligatorios.</p></div></div>
        <ClienteSelector key={versionFormulario} cliente={cliente} onSeleccionar={seleccionarCliente} bloqueado={Boolean(pedido) || ocupado}/>
        <div className="form-divider cliente-divider"><span>{cliente ? 'Datos del cliente elegido' : 'o cargá los datos de un cliente nuevo'}</span></div>
        <ClienteCampos valor={datosCliente} onChange={cambiarCliente} bloqueado={Boolean(pedido) || ocupado || Boolean(cliente)}/>
        <div className="form-divider address-divider"><span>Dirección de entrega</span></div>
        {cliente && !pedido && <DireccionesCliente key={`${cliente.id}-${versionFormulario}`} clienteId={cliente.id} valor={claveGuardada} onChange={usarDireccionGuardada} disabled={ocupado}/>}
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
        <label className="form-field" htmlFor="pedido-importe"><span>Importe base del envío (ARS)</span>
          <input id="pedido-importe" inputMode="decimal" pattern="[0-9]{1,10}([.,][0-9]{1,2})?" placeholder="Sugerido por distancia o importe manual" value={importeBase} disabled={Boolean(pedido) || ocupado} onChange={e => { setImporteManual(e.target.value); descartarDuplicados() }} aria-describedby="importe-sugerido"/>
          <small id="importe-sugerido" style={{ color: 'var(--theme-muted)' }}>Se sugiere con el mapa. Podés editarlo.</small>
        </label>
        {!pedido && <SugerenciaImporteCarga consulta={consultaImporte} ambiguo={candidatosPrevios.length > 1 && !puntoPrevio} manual={importeManual !== null} disabled={ocupado} onUsar={() => { setImporteManual(null); descartarDuplicados() }}/>}
        <label className="form-field span-2 pedido-observaciones" htmlFor="pedido-observaciones"><span>Notas / Instrucciones de entrega</span>
          <textarea id="pedido-observaciones" rows="3" value={observaciones} onChange={(event) => { setObservaciones(event.target.value); descartarDuplicados() }} placeholder="Ej. Tocar timbre B, dejar en recepción..." disabled={Boolean(pedido) || ocupado}/>
        </label>
        {duplicados.length > 0 && <div className="duplicate-alert" role="alert">
          <div className="duplicate-alert-heading">
            <Icon name="alert" size={15}/>
            <div><b>Posible pedido duplicado</b><span>Este cliente ya tiene un pedido con la misma dirección dentro de la ventana configurada. Revisá el pedido existente antes de continuar.</span></div>
          </div>
          <ul className="duplicate-list">
            {duplicadosPaginados.items.map((existente) => <li key={existente.id}>
              <b>{existente.codigo ? `Pedido ${existente.codigo}` : `Pedido #${existente.id}`}</b>
              <span>{existente.estado}{fechaVisible(existente.created_at) && ` · ${fechaVisible(existente.created_at)}`}</span>
              {existente.direccion_original && <small>{existente.direccion_original}</small>}
            </li>)}
          </ul>
          <Paginacion datos={duplicadosPaginados} nombre="pedidos duplicados" disabled={ocupado}/>
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
          {pedido
            ? <MapPreview latitud={pedido.latitud} longitud={pedido.longitud} etiqueta={pedido.direccion_original} buscando={geocodificando}/>
            : <MapPreview latitud={puntoPrevio?.latitud} longitud={puntoPrevio?.longitud} etiqueta={puntoPrevio ? `Ubicación tentativa: ${puntoPrevio.direccion}` : undefined} mensajeVacio={mensajeMapaPrevio}/>}

          {pedido
            ? <div className="validacion-estado">
                <span>Estado de la dirección</span>
                <EstadoValidacionBadge estado={pedido.estado_validacion}/>
              </div>
            : <>
                <div className="address-alert"><Icon name="alert" size={15}/><div><b>Sin pedido guardado</b><span>El punto del mapa es tentativo. Guardá el pedido para confirmar la ubicación y habilitar el despacho.</span></div></div>
                <PrevisualizacionUbicacion previsualizacion={previsualizacion} indiceElegido={indiceElegido} onElegir={(indice) => setElegidoPrevio({ datos: previsualizacion.datos, indice })} onReintentar={previsualizacion.reintentar}/>
              </>}

          {pedido && <dl className="detalle-datos pedido-resumen">
            <div><dt>Canal de origen</dt><dd>{etiquetaCanal(pedido.canal_origen)}</dd></div>
            <div><dt>Importe del envío</dt><dd><ImportePedido pedido={pedido}/></dd></div>
            <div><dt>Estado del pedido</dt><dd>{pedido.estado}</dd></div>
          </dl>}

          {resultado && <div className={`geo-resultado ${tonoResultado(resultado.resultado)}`} role="status">
            <b>{ETIQUETAS_RESULTADO[resultado.resultado] || 'Búsqueda registrada'}</b>
            <span>{RESULTADOS[resultado.resultado] || resultado.motivo || 'Búsqueda registrada.'}</span>
          </div>}
          {pedido?.nivel_confianza && <p className="geo-nota">Confianza del proveedor: <b>{pedido.nivel_confianza}</b> ({resultado?.proveedor || 'georef'}).</p>}
          {resultado?.candidatos?.length > 1 && <fieldset className="geo-candidatos">
            <legend>Encontramos varias ubicaciones. Elegí la correcta:</legend>
            {candidatosPaginados.items.map((candidato) => <label key={candidato.indice}>
              <input type="radio" name="candidato-geo-carga" checked={indiceCandidato === candidato.indice} onChange={() => setIndiceCandidato(candidato.indice)}/>
              <span>{candidato.direccion}<small>Confianza: {candidato.nivelConfianza || 'BAJO'}</small></span>
            </label>)}
            <Paginacion datos={candidatosPaginados} nombre="ubicaciones candidatas" disabled={ocupado}/>
            <button className="button button-outline" type="button" disabled={ocupado || indiceCandidato === null} onClick={usarCandidato}>Usar ubicación seleccionada</button>
          </fieldset>}

          <p className="geo-ayuda" id="geo-ayuda">{ayudaValidacion(pedido, geocodificando)}</p>
          {pedido && <p className="geo-ayuda">Si el punto no es correcto, <Link to={`/pedidos/${pedido.id}/revision`}>corregí la dirección en la revisión</Link>.</p>}
          <button type="button" className="button button-outline" onClick={geocodificar} disabled={!puedeGeocodificar || ocupado} aria-describedby="geo-ayuda" title="Consulta Georef y marca el punto; no confirma la ubicación"><Icon name="pin" size={14}/> {geocodificando ? 'Buscando en el mapa…' : 'Buscar dirección en el mapa'}</button>
          {motivoGeo && <p className="geo-motivo">{motivoGeo}</p>}
          <button type="button" className="button confirm-button" onClick={confirmar} disabled={!puedeConfirmar || ocupado} aria-describedby="geo-ayuda" title={motivoConf || undefined}><Icon name="check" size={14}/> {confirmando ? 'Confirmando…' : 'Confirmar ubicación'}</button>
          {motivoConf && <p className="geo-motivo">{motivoConf}</p>}
          {pedido?.estado_validacion === 'CONFIRMADA' && <CompletarImporte pedido={pedido} onGuardado={setPedido}/>}
          {pedido && <button type="button" className="button button-outline correct-button" onClick={nuevaCarga} disabled={ocupado} title="Limpia el formulario para cargar un pedido nuevo">Cargar otro pedido</button>}
        </section>
        <div className="safe-note"><span><Icon name="check" size={12}/></span><div><b>Despacho seguro</b><small>Una dirección sin confirmar no habilita el despacho.</small></div></div>
      </aside>
    </div>
  </main>
}

export default PedidosCargaPage
