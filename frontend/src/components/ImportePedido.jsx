import { moneda } from './importes.js'
export default function ImportePedido({ pedido }) {
  return <div className="importe-pedido"><p>Envío base: <strong>{moneda(pedido.importe_base)}</strong></p>
    {Number(pedido.recargo_total) > 0 && <p>Recargo por intentos fallidos (al emisor): <strong>{moneda(pedido.recargo_total)}</strong></p>}
    {pedido.importe_total != null && <p>Total a cobrar: <strong>{moneda(pedido.importe_total)}</strong></p>}
    {pedido.proxima_visita && <p>Próxima visita: {String(pedido.proxima_visita).slice(0, 10).split('-').reverse().join('/')}</p>}
  </div>
}
