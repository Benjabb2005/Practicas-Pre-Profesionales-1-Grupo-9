import { expect,it,vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import PagoPedido from './PagoPedido.jsx'
import AccionChofer from './AccionChofer.jsx'
import EstadoComprobante from './EstadoComprobante.jsx'
import { crearIdOperacion } from './operacionEntrega.js'

it('genera UUID v4 distintos para intentos de entrega sin depender de randomUUID',()=>{
 const getRandomValues=globalThis.crypto.getRandomValues.bind(globalThis.crypto)
 vi.stubGlobal('crypto',{getRandomValues})
 try{
  const ids=Array.from({length:32},()=>crearIdOperacion())
  expect(ids.every(id=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id))).toBe(true)
  expect(new Set(ids).size).toBe(ids.length)
 }finally{vi.unstubAllGlobals()}
})

it.each(['historial','comprobantes','entrega','fallo','pago'])('el panel %s abre por HTTP de red local sin crypto.randomUUID',tipo=>{
 const getRandomValues=globalThis.crypto.getRandomValues.bind(globalThis.crypto)
 vi.stubGlobal('crypto',{getRandomValues})
 try{
  expect(()=>renderToStaticMarkup(<AccionChofer pedido={{id:1,importe_total:'1000.00'}} tipo={tipo}/>)).not.toThrow()
 }finally{vi.unstubAllGlobals()}
})
const contexto=vi.hoisted(()=>({rol:'ADMINISTRADOR'}))
vi.mock('../auth/useAuth.js',()=>({useAuth:()=>({usuario:contexto})}))
it('sólo admin ve acreditar una transferencia entregada; operador sólo consulta',()=>{
 const pedido={id:1,estado:'ENTREGADO',pago_metodo:'TRANSFERENCIA',pago_monto:'1500.00'}
 contexto.rol='ADMINISTRADOR'
 expect(renderToStaticMarkup(<PagoPedido pedido={pedido}/>)).toContain('Acreditar transferencia')
 contexto.rol='OPERADOR'
 expect(renderToStaticMarkup(<PagoPedido pedido={pedido}/>)).not.toContain('Acreditar transferencia')
 contexto.rol='ADMINISTRADOR'
 const pagado=renderToStaticMarkup(<PagoPedido pedido={{...pedido,estado:'PAGADO'}}/>)
 expect(pagado).toContain('Pago confirmado')
 expect(pagado).not.toContain('Acreditar transferencia')
})
it('panel efectivo advierte confirmación de cobro y PAGADO sin monto editable',()=>{
 const html=renderToStaticMarkup(<AccionChofer pedido={{id:1,importe_total:'1500.00'}} tipo="pago"/>)
 expect(html).toContain('Confirmá sólo si recibiste el efectivo')
 expect(html).toContain('PAGADO')
 expect(html).not.toContain('id="pago-monto"')
})
it('comprobante pendiente es independiente de acreditación y desaparece al adjuntar',()=>{
 expect(renderToStaticMarkup(<EstadoComprobante pedido={{pago_metodo:'TRANSFERENCIA',estado:'PAGADO',comprobantes_cantidad:0}}/>)).toContain('Comprobante pendiente de subir')
 expect(renderToStaticMarkup(<EstadoComprobante pedido={{pago_metodo:'TRANSFERENCIA',comprobantes_cantidad:1}}/>)).toContain('Comprobante adjuntado')
 expect(renderToStaticMarkup(<EstadoComprobante pedido={{pago_metodo:'EFECTIVO'}}/>)).toBe('')
})
it('un pedido antiguo sin importe explica el bloqueo del pago sin simular una carga',()=>{
 const html=renderToStaticMarkup(<AccionChofer pedido={{id:3,importe_total:null}} tipo="pago"/>)
 expect(html).toContain('Pedile al operador')
 expect(html).toContain('Falta cargar el importe')
 expect(html).toContain('aria-busy="false"')
 expect(html).not.toContain('Guardando…')
})
