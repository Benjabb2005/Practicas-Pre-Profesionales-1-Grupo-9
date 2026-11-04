import Icon from './Icon.jsx'
import ImportePedido from './ImportePedido.jsx'
import { etiquetaCanal } from './canal.js'

export default function PedidoInformacion({ pedido }) {
  return <div className="detail-information">
    <section className="detail-info-block"><span className="detail-info-icon"><Icon name="users" size={21}/></span><div><h2>Cliente</h2><strong>{pedido.cliente_nombre || 'Sin cliente informado'}</strong>
      <dl><div><dt>DNI</dt><dd>{pedido.cliente_dni || 'Sin informar'}</dd></div><div><dt>Teléfono</dt><dd>{pedido.cliente_telefono ? <a href={`tel:${pedido.cliente_telefono.replace(/[^+\d]/g, '')}`}>{pedido.cliente_telefono}</a> : 'Sin informar'}</dd></div><div><dt>Email</dt><dd>{pedido.cliente_email || 'Sin informar'}</dd></div></dl>
    </div></section>
    <section className="detail-info-block"><span className="detail-info-icon"><Icon name="pin" size={21}/></span><div><h2>Destino de entrega</h2><strong>{[pedido.calle, pedido.altura, pedido.piso_depto].filter(Boolean).join(' ') || 'Sin dirección'}</strong><p>{[pedido.localidad, pedido.provincia].filter(Boolean).join(', ')}</p>
      <dl><div><dt>Entre calles</dt><dd>{pedido.entre_calles || 'Sin informar'}</dd></div><div><dt>Código postal</dt><dd>{pedido.codigo_postal || 'Sin informar'}</dd></div></dl>
    </div></section>
    <section className="detail-info-block"><span className="detail-info-icon"><Icon name="box" size={21}/></span><div><h2>Datos del envío</h2><ImportePedido pedido={pedido}/><dl><div><dt>Canal de origen</dt><dd>{etiquetaCanal(pedido.canal_origen)}</dd></div><div><dt>Chofer</dt><dd>{pedido.chofer_nombre || (pedido.asignacion_desconocida ? 'No se pudo consultar la asignación' : 'Sin asignar')}</dd></div></dl></div></section>
    <section className="detail-info-block"><span className="detail-info-icon"><Icon name="alert" size={21}/></span><div><h2>Indicaciones</h2><p>{pedido.observaciones || 'No se agregaron instrucciones para esta entrega.'}</p></div></section>
  </div>
}
