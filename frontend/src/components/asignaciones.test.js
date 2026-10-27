import { expect, it } from 'vitest'
import { resumirAsignaciones } from './asignaciones.js'

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
