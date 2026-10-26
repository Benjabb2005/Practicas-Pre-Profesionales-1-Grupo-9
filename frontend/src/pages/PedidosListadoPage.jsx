import Paginacion from '../components/Paginacion.jsx'
import usePagination from '../components/usePagination.js'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import EstadoValidacionBadge from '../components/EstadoValidacionBadge.jsx'
import { mensajeError } from '../api/client'
import { listarPedidos } from '../api/pedidos'
import {
  FILTROS_PEDIDOS_VACIOS,
  direccionDePedido,
  fechaVisible,
  parametrosDeFiltros,
  resumirPedidos,
  sinFiltros,
} from '../components/pedidoListado.js'
import './Pedidos.css'
import './PedidosListadoPage.css'

const ESTADOS_PEDIDO = [
  { valor: 'EN STOCK', etiqueta: 'En stock' },
  { valor: 'EN PREPARACIÓN', etiqueta: 'En preparación' },
  { valor: 'EN ENVÍO', etiqueta: 'En envío' },
  { valor: 'ENTREGADO', etiqueta: 'Entregado' },
  { valor: 'PAGADO', etiqueta: 'Pagado' },
]

function mensajeDeError(fallo) {
  const campos = fallo?.response?.data?.error?.campos
  const primero = campos && Object.values(campos)[0]
  return primero || mensajeError(fallo)
}

function StatCard({ icon, tone, value, label }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}><Icon name={icon} size={19}/></span><div><strong>{value}</strong><small>{label}</small></div></article>
}

function EmptyState({ hayFiltros, onClear, onCreate }) {
  return <div className="empty-state">
    <span className="empty-icon"><Icon name="box" size={22}/></span>
    <strong>{hayFiltros ? 'No hay pedidos con esos filtros' : 'Todavía no hay pedidos cargados'}</strong>
    <p>{hayFiltros ? 'Probá con otro estado, cliente o rango de fechas.' : 'Los pedidos que cargues aparecerán en esta tabla.'}</p>
    {hayFiltros
      ? <button className="button button-outline" type="button" onClick={onClear}>Limpiar filtros</button>
      : <button className="button button-outline" type="button" onClick={onCreate}>Cargar primer pedido</button>}
  </div>
}

function PedidosListadoPage() {
  const navegar = useNavigate()
  const [filtros, setFiltros] = useState(FILTROS_PEDIDOS_VACIOS)
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_PEDIDOS_VACIOS)
  const [pedidos, setPedidos] = useState([])
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const paginado = usePagination(pedidos, JSON.stringify(filtrosAplicados))

  // El resumen usa el total de pedidos; la tabla consulta al servidor cada vez
  // que cambian los filtros. Así los contadores no quedan limitados al filtro.
  useEffect(() => {
    let vigente = true
    listarPedidos()
      .then((lista) => {
        if (vigente) setResumen(resumirPedidos(lista))
      })
      .catch(() => {
        if (vigente) setResumen(null)
      })
    return () => { vigente = false }
  }, [])

  // La búsqueda de cliente espera un instante para no disparar una petición por
  // cada tecla; los selectores y las fechas también se aplican con esa pausa.
  useEffect(() => {
    const temporizador = setTimeout(() => setFiltrosAplicados(filtros), 250)
    return () => clearTimeout(temporizador)
  }, [filtros])

  useEffect(() => {
    let vigente = true
    listarPedidos(parametrosDeFiltros(filtrosAplicados))
      .then((lista) => {
        if (vigente) {
          setPedidos(lista)
          setError('')
        }
      })
      .catch((fallo) => {
        if (vigente) {
          setError(mensajeDeError(fallo))
          setPedidos([])
        }
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => { vigente = false }
  }, [filtrosAplicados])

  function cambiar(campo, valor) {
    setCargando(true)
    setError('')
    setFiltros((actual) => ({ ...actual, [campo]: valor }))
  }

  function limpiarFiltros() {
    const vacios = { ...FILTROS_PEDIDOS_VACIOS }
    setCargando(true)
    setError('')
    setFiltros(vacios)
    setFiltrosAplicados(vacios)
  }

  const hayFiltros = !sinFiltros(filtrosAplicados)
  const valorResumen = (valor) => (resumen ? valor : '—')

  return <main className="main-content board-page listado-pedidos">
    <header className="page-header">
      <div>
        <p className="eyebrow">Centro de operaciones</p>
        <h1>Tablero General de Despacho</h1>
        <p className="subtitle">Listado de pedidos con filtros por estado, cliente y fecha.</p>
      </div>
      <button className="button button-primary header-action" type="button" onClick={() => navegar('/form')}>
        <Icon name="plus"/> Cargar nuevo pedido
      </button>
    </header>

    {error && <p className="users-alert" role="alert">{error}</p>}

    <section className="stats-grid" aria-label="Resumen de pedidos">
      <StatCard icon="box" tone="blue" value={valorResumen(resumen?.total ?? 0)} label="Pedidos registrados"/>
      <StatCard icon="grid" tone="amber" value={valorResumen(resumen?.enPreparacion ?? 0)} label="En preparación"/>
      <StatCard icon="truck" tone="purple" value={valorResumen(resumen?.enEnvio ?? 0)} label="En ruta de envío"/>
      <StatCard icon="check" tone="green" value={valorResumen(resumen?.entregadosOPagados ?? 0)} label="Entregados o pagados"/>
    </section>

    <section className="shipments-card">
      <div className="shipments-heading">
        <div>
          <h2>Pedidos</h2>
          <p>{cargando ? 'Buscando…' : `${pedidos.length} pedido${pedidos.length === 1 ? '' : 's'} en pantalla`}</p>
        </div>
      </div>

      <div className="filters listado-filtros" role="search" aria-label="Filtros de pedidos">
        <label>Estado
          <select value={filtros.estado} onChange={(event) => cambiar('estado', event.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS_PEDIDO.map((estado) => <option key={estado.valor} value={estado.valor}>{estado.etiqueta}</option>)}
          </select>
        </label>
        <label>Cliente
          <input
            type="search"
            value={filtros.cliente}
            onChange={(event) => cambiar('cliente', event.target.value)}
            placeholder="Nombre, DNI o teléfono"
            autoComplete="off"
          />
        </label>
        <label>Desde
          <input
            type="date"
            value={filtros.fecha_desde}
            max={filtros.fecha_hasta || undefined}
            onChange={(event) => cambiar('fecha_desde', event.target.value)}
          />
        </label>
        <label>Hasta
          <input
            type="date"
            value={filtros.fecha_hasta}
            min={filtros.fecha_desde || undefined}
            onChange={(event) => cambiar('fecha_hasta', event.target.value)}
          />
        </label>
        <button
          className="button button-outline listado-limpiar"
          type="button"
          onClick={limpiarFiltros}
          disabled={sinFiltros(filtros)}
        >
          Limpiar filtros
        </button>
      </div>

      {cargando
        ? <p className="users-state" role="status">Buscando pedidos…</p>
        : error
          ? <p className="users-state">No se pudo cargar el listado.</p>
          : pedidos.length === 0
            ? <EmptyState hayFiltros={hayFiltros} onClear={limpiarFiltros} onCreate={() => navegar('/form')}/>
            : <div className="users-table-wrap">
                <table className="users-table listado-pedidos-table">
                  <thead>
                    <tr>
                      <th scope="col">Pedido</th>
                      <th scope="col">Fecha</th>
                      <th scope="col">Cliente</th>
                      <th scope="col">Dirección</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Validación</th>
                      <th scope="col"><span className="sr-only">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginado.items.map((pedido) => <tr key={pedido.id}>
                      <td>
                        <b className="pedido-id">#{pedido.id}</b>
                        {pedido.codigo && <small className="pedido-dato">{pedido.codigo}</small>}
                      </td>
                      <td>{fechaVisible(pedido.created_at) || '—'}</td>
                      <td>
                        {pedido.cliente_nombre || 'Sin cliente'}
                        {pedido.cliente_dni && <small className="pedido-dato">DNI {pedido.cliente_dni}</small>}
                      </td>
                      <td>{direccionDePedido(pedido)}</td>
                      <td>{pedido.estado || '—'}</td>
                      <td><EstadoValidacionBadge estado={pedido.estado_validacion}/></td>
                      <td>
                        <Link
                          className="button button-outline users-edit"
                          to={`/pedidos/${pedido.id}/revision`}
                          aria-label={`${pedido.estado_validacion === 'CONFIRMADA' ? 'Ver' : 'Revisar'} pedido #${pedido.id}`}
                        >
                          {pedido.estado_validacion === 'CONFIRMADA' ? 'Ver' : 'Revisar'}
                        </Link>
                      </td>
                    </tr>)}
                  </tbody>
                </table>
              </div>}

    <Paginacion datos={paginado} nombre="pedidos" disabled={cargando}/>
    </section>
  </main>
}

export default PedidosListadoPage
