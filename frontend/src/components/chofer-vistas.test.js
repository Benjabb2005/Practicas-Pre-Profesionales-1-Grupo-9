import {expect,it} from 'vitest'
import {entregasDeVista} from './chofer.js'

it('separa envíos, entregas con pendientes e historial sin perder pedidos',()=>{
  const filas=[
    {id:1,estado:'EN ENVÍO'},
    {id:2,estado:'ENTREGADO'},
    {id:3,estado:'ENTREGADO',pago_metodo:'TRANSFERENCIA',comprobantes_cantidad:1},
    {id:4,estado:'PAGADO',pago_metodo:'TRANSFERENCIA',comprobantes_cantidad:0},
    {id:5,estado:'PAGADO',pago_metodo:'TRANSFERENCIA',comprobantes_cantidad:'1'},
    {id:6,estado:'PAGADO',pago_metodo:'EFECTIVO',comprobantes_cantidad:0},
  ]
  expect(entregasDeVista(filas,'pendientes').map(p=>p.id)).toEqual([1])
  expect(entregasDeVista(filas,'entregados').map(p=>p.id)).toEqual([2,3,4])
  expect(entregasDeVista(filas,'historial').map(p=>p.id)).toEqual([5,6])
  expect(entregasDeVista(filas.map(p=>p.id===4?{...p,comprobantes_cantidad:1}:p),'historial').map(p=>p.id)).toEqual([4,5,6])
})
