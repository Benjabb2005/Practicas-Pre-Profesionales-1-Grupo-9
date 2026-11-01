import { useEffect, useRef, useState } from 'react'
import { previsualizarUbicacion } from '../api/pedidos'
import { mensajeError } from '../api/client'
import { crearBuscadorTentativo } from './buscadorTentativo.js'
import { claveBusqueda, direccionBuscable } from './direccion.js'

// Previsualiza la ubicación mientras se completa la dirección, sin guardar nada.
// Cada resultado guarda la clave de la dirección que lo originó: si ya no coincide
// con la actual se descarta, así un punto viejo nunca se muestra como si fuera de
// los datos nuevos (ni siquiera durante la espera del debounce).
//
// fase: 'inactiva' | 'incompleta' | 'esperando' | 'buscando' | 'lista' | 'error'
export function usePrevisualizacionUbicacion(direccion, { activa = true } = {}) {
  const clave = claveBusqueda(direccion)
  const buscable = direccionBuscable(direccion)
  const [estado, setEstado] = useState({ clave: '', fase: 'inactiva', datos: null, mensaje: '' })
  const [intento, setIntento] = useState(0)
  const inmediato = useRef(false)

  useEffect(() => {
    if (!activa || !buscable) return undefined
    const buscador = crearBuscadorTentativo({
      buscar: previsualizarUbicacion,
      describirError: mensajeError,
      alCambiar: setEstado,
    })
    buscador.programar(direccion, clave, { inmediato: inmediato.current })
    inmediato.current = false
    return buscador.cancelar
    // `direccion` entra por `clave`: sólo los campos relevantes disparan la búsqueda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, buscable, activa, intento])

  function reintentar() {
    inmediato.current = true
    setIntento((actual) => actual + 1)
  }

  let vigente
  if (!activa) vigente = { fase: 'inactiva', datos: null, mensaje: '' }
  else if (!buscable) vigente = { fase: 'incompleta', datos: null, mensaje: '' }
  else if (estado.clave !== clave) vigente = { fase: 'esperando', datos: null, mensaje: '' }
  else vigente = estado

  return { fase: vigente.fase, datos: vigente.datos, mensaje: vigente.mensaje, reintentar }
}
