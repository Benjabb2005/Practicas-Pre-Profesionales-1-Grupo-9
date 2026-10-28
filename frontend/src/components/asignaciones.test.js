import { expect, it } from 'vitest'
import { resumirAsignaciones,asignacionesActivas } from './asignaciones.js'

it('oculta pagados, conservando entregados con importe o pago por completar',()=>{
  const pedidos=[{id:1,estado:'EN STOCK'},{id:2,estado:'EN PREPARACIÓN'},{id:3,estado:'EN ENVÍO'},
    {id:4,estado:'ENTREGADO'},{id:5,estado:'ENTREGADO',pago_metodo:'TRANSFERENCIA'},
    {id:6,estado:'PAGADO',pago_metodo:'TRANSFERENCIA'},{id:7,estado:'PAGADO',pago_metodo:'EFECTIVO'}]
  expect(asignacionesActivas(pedidos).map(p=>p.id)).toEqual([1,2,3,4,5])
  expect(asignacionesActivas()).toEqual([])
})

it('cuenta sólo los bloqueados antes del despacho, sin sumar envíos ni finalizados', () => {
  const pedidos = [
    { estado: 'EN STOCK', puede_asignar: false },
    { estado: 'EN PREPARACIÓN', puede_asignar: false },
    { estado: 'EN STOCK', puede_asignar: true },
    { estado: 'EN ENVÍO', puede_asignar: false },
    { estado: 'ENTREGADO', puede_asignar: false },
    { estado: 'PAGADO', puede_asignar: false },
  ]
  expect(resumirAsignaciones(pedidos)).toEqual({ habilitados: 1, bloqueados: 2 })
  expect(resumirAsignaciones()).toEqual({ habilitados: 0, bloqueados: 0 })
})
