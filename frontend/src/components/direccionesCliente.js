import { DIRECCION_VACIA } from './direccion.js'

export function camposDeDireccionGuardada(direccion) {
  return Object.fromEntries(Object.keys(DIRECCION_VACIA).map(campo => [campo, direccion?.[campo] ?? '']))
}

export function etiquetaDireccionGuardada(direccion) {
  return [direccion.calle, direccion.altura, direccion.piso_depto, direccion.localidad, direccion.provincia,
    direccion.codigo_postal, direccion.entre_calles ? `entre ${direccion.entre_calles}` : null].filter(Boolean).join(' · ')
}
