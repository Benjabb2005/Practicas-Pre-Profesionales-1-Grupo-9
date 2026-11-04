export const DEMORA_PREVISUALIZACION_MS = 500

// Programa la búsqueda tentativa con espera (debounce) y cancelación. Cada
// `programar` descarta lo anterior: borra el temporizador y aborta la consulta en
// vuelo, y una respuesta abortada nunca llega a `alCambiar`. Sin dependencias de
// React para poder probarlo con temporizadores falsos.
export function crearBuscadorTentativo({ buscar, describirError, alCambiar, demora = DEMORA_PREVISUALIZACION_MS }) {
  let temporizador = null
  let controlador = null

  function cancelar() {
    clearTimeout(temporizador)
    temporizador = null
    controlador?.abort()
    controlador = null
  }

  function programar(direccion, clave, { inmediato = false } = {}) {
    cancelar()
    temporizador = setTimeout(() => {
      const propio = new AbortController()
      controlador = propio
      alCambiar({ clave, fase: 'buscando', datos: null, mensaje: '' })
      buscar(direccion, propio.signal)
        .then((datos) => {
          if (!propio.signal.aborted) alCambiar({ clave, fase: 'lista', datos, mensaje: '' })
        })
        .catch((fallo) => {
          if (!propio.signal.aborted) alCambiar({ clave, fase: 'error', datos: null, mensaje: describirError(fallo) })
        })
    }, inmediato ? 0 : demora)
  }

  return { programar, cancelar }
}
