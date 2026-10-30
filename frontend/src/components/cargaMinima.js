// La solicitud empieza inmediatamente; sólo se sostiene la presentación del
// resultado exitoso para que la animación no aparezca como un destello.
// Los errores se propagan sin esperar y una solicitud lenta no suma otra pausa.
export async function conCargaMinima(solicitud, minimoMs = 3600) {
  let temporizador
  const minimo = new Promise(resolve => { temporizador = setTimeout(resolve, minimoMs) })
  try {
    const [resultado] = await Promise.all([solicitud, minimo])
    return resultado
  } finally {
    clearTimeout(temporizador)
  }
}
