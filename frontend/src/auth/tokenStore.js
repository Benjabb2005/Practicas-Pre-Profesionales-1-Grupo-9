const CLAVE = 'mandatodo.token'

// El token se guarda en localStorage para sobrevivir recargas. Cualquier script
// del navegador puede leerlo, por eso se usa solo como sesión de MVP y no como
// almacenamiento de secretos de larga duración.
export function leerToken() {
  try {
    return window.localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

export function guardarToken(token) {
  try {
    window.localStorage.setItem(CLAVE, token)
  } catch {
    // Almacenamiento no disponible (modo privado): la sesión dura solo esta pestaña.
  }
}

export function borrarToken() {
  try {
    window.localStorage.removeItem(CLAVE)
  } catch {
    // Nada que limpiar.
  }
}
