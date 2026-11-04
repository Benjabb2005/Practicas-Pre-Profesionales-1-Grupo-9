import { useEffect, useState } from 'react'
import { sugerirImporteDuranteCarga } from '../api/pedidos.js'
import { mensajeError } from '../api/client.js'
import { coordenadasDeMapa } from './mapa.js'
import { crearBuscadorTentativo } from './buscadorTentativo.js'

export function useImporteDuranteCarga(punto, claveDireccion, origen, activa = true) {
  const coordenadas = coordenadasDeMapa(punto?.latitud, punto?.longitud)
  const latitud = coordenadas?.lat, longitud = coordenadas?.lon
  const clave = coordenadas ? JSON.stringify([claveDireccion, latitud, longitud, punto?.indice]) : ''
  const [estado, setEstado] = useState(null)
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    if (!activa || !clave) return undefined
    // Reutiliza cancelación/descartes ya probados para la previsualización.
    const consulta = crearBuscadorTentativo({
      buscar: sugerirImporteDuranteCarga,
      describirError: mensajeError,
      alCambiar: resultado => setEstado({ ...resultado, origen, intento }),
      demora: 0,
    })
    consulta.programar({ latitud, longitud }, clave)
    return consulta.cancelar
  }, [activa, clave, origen, intento, latitud, longitud])

  // No se espera al efecto para invalidar: el mismo render que cambia la
  // dirección/punto deja de mostrar y de enviar el importe automático anterior.
  const vigente = activa && clave && estado?.clave === clave && estado.origen === origen && estado.intento === intento
  return {
    fase: !activa ? 'inactiva' : !clave ? 'sin-punto' : vigente ? estado.fase : 'buscando',
    datos: vigente ? estado.datos : null,
    mensaje: vigente ? estado.mensaje : '',
    reintentar: () => setIntento(i => i + 1),
  }
}
