import { useState } from 'react'

export function paginar(items, pagina, tamanio = 10) {
  const paginas = Math.max(1, Math.ceil(items.length / tamanio))
  const actual = Math.max(1, Math.min(pagina, paginas))
  const inicio = (actual - 1) * tamanio
  return { items: items.slice(inicio, inicio + tamanio), pagina: actual, paginas,
    total: items.length, desde: items.length ? inicio + 1 : 0, hasta: Math.min(inicio + tamanio, items.length) }
}

export default function usePagination(items = [], clave = '') {
  const [seleccion, setSeleccion] = useState({ clave, pagina: 1 })
  // Ajuste durante el render: el filtro nuevo nunca muestra una página del anterior.
  if (seleccion.clave !== clave) setSeleccion({ ...seleccion, clave, pagina: 1 })
  const resultado = paginar(items, seleccion.clave === clave ? seleccion.pagina : 1)
  return { ...resultado, onPagina: pagina => setSeleccion({ clave, pagina }) }
}
