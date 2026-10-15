import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import EstadoValidacionBadge from '../components/EstadoValidacionBadge.jsx'
import { mensajeError } from '../api/client'
import { listarPedidos } from '../api/pedidos'
import './Pedidos.css'

const FILTROS = [
  { valor: 'no_confirmadas', etiqueta: 'Sin confirmar' },
  { valor: 'PENDIENTE', etiqueta: 'Pendientes' },
  { valor: 'CON_ADVERTENCIAS', etiqueta: 'Con advertencias' },
  { valor: 'VALIDA', etiqueta: 'Válidas' },
  { valor: 'CONFIRMADA', etiqueta: 'Confirmadas' },
]

function PedidosRevisionPage() {
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('no_confirmadas')

  useEffect(() => {
    let vigente = true
    listarPedidos()
      .then((lista) => { if (vigente) setPedidos(lista) })
      .catch((fallo) => { if (vigente) setError(mensajeError(fallo)) })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [])

  const visibles = useMemo(() => {
    if (filtro === 'no_confirmadas') return pedidos.filter((pedido) => pedido.estado_validacion !== 'CONFIRMADA')
    return pedidos.filter((pedido) => pedido.estado_validacion === filtro)
  }, [pedidos, filtro])

  return <main className="main-content revision-page">
    <header className="page-header">
      <div><p className="eyebrow">Despacho seguro</p><h1>Revisión de direcciones</h1><p className="subtitle">Pedidos que todavía no tienen la ubicación confirmada por una persona.</p></div>
      <Link className="button button-primary header-action" to="/form"><Icon name="plus"/> Cargar pedido</Link>
    </header>

    {error && <p className="users-alert" role="alert">{error}</p>}

    <section className="shipments-card">
      <div className="shipments-heading"><div><h2>Direcciones a revisar</h2><p>{pedidos.length} pedido(s) en total.</p></div></div>
      <div className="filters">
        <label>Estado de validación
          <select value={filtro} onChange={(event) => setFiltro(event.target.value)}>
            {FILTROS.map((opcion) => <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>)}
          </select>
        </label>
      </div>

      {cargando
        ? <p className="users-state" role="status">Cargando pedidos…</p>
        : visibles.length === 0
          ? <p className="users-state">No hay pedidos para este filtro.</p>
          : <div className="users-table-wrap">
              <table className="users-table">
                <thead><tr><th scope="col">Pedido</th><th scope="col">Cliente</th><th scope="col">Dirección</th><th scope="col">Validación</th><th scope="col">Estado</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
                <tbody>
                  {visibles.map((pedido) => <tr key={pedido.id}>
                    <td>#{pedido.id}</td>
                    <td>{pedido.cliente_nombre || 'Sin cliente'}</td>
                    <td>{pedido.direccion_original || [pedido.calle, pedido.altura].filter(Boolean).join(' ') || 'Sin dirección'}</td>
                    <td><EstadoValidacionBadge estado={pedido.estado_validacion}/></td>
                    <td>{pedido.estado}</td>
                    <td><Link className="button button-outline users-edit" to={`/pedidos/${pedido.id}/revision`}>Revisar</Link></td>
                  </tr>)}
                </tbody>
              </table>
            </div>}
    </section>
  </main>
}

export default PedidosRevisionPage
