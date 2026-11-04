export default function EstadoComprobante({pedido}) {
  if(pedido.pago_metodo!=='TRANSFERENCIA')return null
  return <p className={`estado-comprobante ${Number(pedido.comprobantes_cantidad)>0?'receipt-complete':'receipt-pending'}`} role="status">{Number(pedido.comprobantes_cantidad)>0?'Comprobante adjuntado':'Comprobante pendiente de subir'}</p>
}
