import Paginacion from '../components/Paginacion.jsx'
import usePagination from '../components/usePagination.js'
import { useEffect, useState } from 'react'
import Icon from '../components/Icon.jsx'
import ClienteForm from '../components/ClienteForm.jsx'
import { CLIENTE_ABM_VACIO, datosDeClienteAbm, describirCoincidenciasClientes } from '../components/cliente.js'
import { actualizarCliente, crearCliente, eliminarCliente, listarClientes } from '../api/clientes'
import { mensajeError } from '../api/client'
import './ClientesPage.css'

// Mensaje local: si el backend informa el campo que falló, se muestra ese texto
// en lugar del mensaje genérico de validación.
function mensajeDeError(fallo) {
  const campos = fallo?.response?.data?.error?.campos
  const primero = campos && Object.values(campos)[0]
  return primero || mensajeError(fallo)
}

function armarAviso(base, posiblesDuplicados = []) {
  const detalle = describirCoincidenciasClientes(posiblesDuplicados)
  return detalle ? `${base} ${detalle}` : base
}

function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [formulario, setFormulario] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [clienteAEliminar, setClienteAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  const paginado = usePagination(clientes, busqueda)

  async function cargar(texto = busqueda) {
    setCargando(true)
    setError('')
    try {
      const lista = await listarClientes(texto.trim() || undefined)
      setClientes(lista)
    } catch (fallo) {
      setError(mensajeDeError(fallo))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    let vigente = true
    const temporizador = setTimeout(() => {
      setCargando(true)
      listarClientes(busqueda.trim() || undefined)
        .then((lista) => {
          if (vigente) {
            setClientes(lista)
            setError('')
          }
        })
        .catch((fallo) => {
          if (vigente) setError(mensajeDeError(fallo))
        })
        .finally(() => {
          if (vigente) setCargando(false)
        })
    }, 300)

    return () => {
      vigente = false
      clearTimeout(temporizador)
    }
  }, [busqueda])

  function abrirNuevo() {
    setAviso('')
    setError('')
    setClienteAEliminar(null)
    setFormulario({ ...CLIENTE_ABM_VACIO })
  }

  function abrirEdicion(cliente) {
    setAviso('')
    setError('')
    setClienteAEliminar(null)
    setFormulario({ id: cliente.id, ...datosDeClienteAbm(cliente) })
  }

  function cambiar(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  async function guardar(event) {
    event.preventDefault()
    setEnviando(true)
    setError('')
    setAviso('')
    try {
      const cuerpo = {
        nombre: formulario.nombre.trim(),
        dni: formulario.dni.trim() || null,
        telefono: formulario.telefono.trim() || null,
        email: formulario.email.trim() || null,
        tipo: formulario.tipo,
        domicilio: formulario.domicilio.trim() || null,
      }
      const resultado = formulario.id
        ? await actualizarCliente(formulario.id, cuerpo)
        : await crearCliente(cuerpo)
      const base = formulario.id ? 'Cliente actualizado.' : 'Cliente creado.'
      setAviso(armarAviso(base, resultado.posiblesDuplicados))
      setFormulario(null)
      await cargar()
    } catch (fallo) {
      setError(mensajeDeError(fallo))
    } finally {
      setEnviando(false)
    }
  }

  async function confirmarEliminar() {
    if (!clienteAEliminar) return
    setEliminando(true)
    setError('')
    setAviso('')
    try {
      await eliminarCliente(clienteAEliminar.id)
      setAviso('Cliente eliminado.')
      setClienteAEliminar(null)
      await cargar()
    } catch (fallo) {
      setError(mensajeDeError(fallo))
    } finally {
      setEliminando(false)
    }
  }

  const hayBusqueda = busqueda.trim().length > 0

  return <main className="main-content clientes-page">
    <header className="page-header">
      <div>
        <p className="eyebrow">Gestión comercial</p>
        <h1>Clientes</h1>
        <p className="subtitle">Consultá, cargá y corregí los datos de los clientes de MandáTodo.</p>
      </div>
      <button className="button button-primary header-action" type="button" onClick={abrirNuevo}>
        <Icon name="plus"/> Nuevo cliente
      </button>
    </header>

    {error && <p className="clientes-alert" role="alert">{error}</p>}
    {aviso && <p className="clientes-ok" role="status">{aviso}</p>}

    {formulario && <ClienteForm
      valor={formulario}
      onChange={cambiar}
      onSubmit={guardar}
      onCancel={() => setFormulario(null)}
      enviando={enviando}
      modo={formulario.id ? 'editar' : 'crear'}
    />}

    {clienteAEliminar && <section className="panel clientes-confirm" role="alert" aria-labelledby="clientes-confirm-title" aria-describedby="clientes-confirm-text">
      <div>
        <h2 id="clientes-confirm-title">Eliminar cliente</h2>
        <p id="clientes-confirm-text">¿Eliminar a <b>{clienteAEliminar.nombre}</b>? La baja no se puede deshacer y se rechaza si el cliente tiene pedidos asociados.</p>
      </div>
      <div className="clientes-confirm-actions">
        <button className="button clientes-delete" type="button" onClick={confirmarEliminar} disabled={eliminando}>
          {eliminando ? 'Eliminando…' : 'Eliminar'}
        </button>
        <button className="button button-outline" type="button" onClick={() => setClienteAEliminar(null)} disabled={eliminando}>
          Cancelar
        </button>
      </div>
    </section>}

    <section className="shipments-card clientes-card">
      <div className="clientes-toolbar">
        <div>
          <h2>Listado de clientes</h2>
          <p>{cargando ? 'Buscando…' : `${clientes.length} cliente${clientes.length === 1 ? '' : 's'} en pantalla`}</p>
        </div>
        <div className="clientes-search">
          <label className="sr-only" htmlFor="clientes-busqueda">Buscar cliente</label>
          <div className="search-input">
            <Icon name="search" size={15}/>
            <input
              id="clientes-busqueda"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Nombre, DNI, teléfono o email"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      {cargando
        ? <p className="clientes-state" role="status">Cargando clientes…</p>
        : clientes.length === 0
          ? <div className="clientes-empty">
            <p>{hayBusqueda ? 'No encontramos clientes con esa búsqueda.' : 'Todavía no hay clientes cargados.'}</p>
            {!hayBusqueda && <button className="button button-outline" onClick={abrirNuevo}>Cargar el primer cliente</button>}
          </div>
          : <div className="clientes-table-wrap">
            <table className="clientes-table">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">DNI</th>
                  <th scope="col">Teléfono</th>
                  <th scope="col">Email</th>
                  <th scope="col">Domicilio</th>
                  <th scope="col"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {paginado.items.map((cliente) => <tr key={cliente.id}>
                  <td>{cliente.nombre}</td>
                  <td>{cliente.dni || '—'}</td>
                  <td>{cliente.telefono || '—'}</td>
                  <td>{cliente.email || '—'}</td>
                  <td>{cliente.domicilio || '—'}</td>
                  <td>
                    <div className="clientes-actions">
                      <button className="button button-outline" type="button" onClick={() => abrirEdicion(cliente)}>Editar</button>
                      <button className="button clientes-delete" type="button" onClick={() => { setAviso(''); setError(''); setClienteAEliminar(cliente) }}>Eliminar</button>
                    </div>
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div>}

    <Paginacion datos={paginado} nombre="clientes" disabled={cargando}/>
    </section>
  </main>
}

export default ClientesPage
