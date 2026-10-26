import { expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { paginar } from './usePagination.js'
import Paginacion from './Paginacion.jsx'
import { filtrarEntregas, ubicacionConfirmada } from './chofer.js'

it('recorre todos los resultados sin perder ni duplicar registros', () => {
  const filas = Array.from({ length: 23 }, (_, id) => ({ id }))
  for (const tamanio of [5, 10, 20]) {
    const paginas = Math.ceil(filas.length / tamanio)
    expect(Array.from({ length: paginas }, (_, i) => paginar(filas, i + 1, tamanio).items).flat()).toEqual(filas)
  }
  expect(paginar(filas.slice(0, 10), 3, 10)).toMatchObject({ pagina: 1, desde: 1, hasta: 10 })
  expect(paginar([], 3, 10)).toMatchObject({ pagina: 1, desde: 0, hasta: 0, items: [] })
})

it('controles no envían formularios y ofrecen límites y total accesibles', () => {
  const datos = { ...paginar([1, 2, 3], 1, 10), tamanio: 10 }
  const html = renderToStaticMarkup(<Paginacion datos={datos} nombre="clientes"/>)
  expect(html).toContain('Paginación de clientes')
  expect(html.match(/type="button" disabled/g)).toHaveLength(2)
  expect(html).toContain('1–3 de 3')
  expect(html).not.toContain('<select')
  expect(paginar(Array.from({ length: 23 }, (_, i) => i), 2).items).toEqual([10,11,12,13,14,15,16,17,18,19])
})

it('búsqueda del chofer ignora tildes y conserva sólo coincidencias', () => {
  const filas = [{ id: 1, cliente_nombre: 'Cliente sintético', calle: 'Corrientes' }, { id: 2, codigo: 'ENV-002' }]
  expect(filtrarEntregas(filas, 'sintetico')).toEqual([filas[0]])
  expect(filtrarEntregas(filas, 'env-002')).toEqual([filas[1]])
  expect(filtrarEntregas(filas, 'sin coincidencias')).toEqual([])
})

it('ubicación externa sólo usa coordenadas válidas y confirmadas', () => {
  const p = { estado_validacion: 'CONFIRMADA', latitud: -34, longitud: -58 }
  expect(ubicacionConfirmada(p)).toContain('query=-34%2C-58')
  for (const cambio of [{ estado_validacion: 'VALIDA' }, { latitud: '' }, { longitud: null }, { latitud: 91 }, { longitud: 'NaN' }]) {
    expect(ubicacionConfirmada({ ...p, ...cambio })).toBeNull()
  }
})
