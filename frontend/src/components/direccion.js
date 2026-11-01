// Estado inicial de la dirección y campos que la componen. Vive fuera del
// componente para que el archivo sólo exporte componentes (Fast Refresh).
export const DIRECCION_VACIA = {
  calle: '',
  altura: '',
  piso_depto: '',
  entre_calles: '',
  localidad: '',
  provincia: '',
  codigo_postal: '',
}

// Mínimo para buscar una ubicación útil: calle, altura y provincia. Es sólo para
// no disparar consultas inútiles; el servidor decide si la dirección sirve.
export function direccionBuscable(direccion) {
  return ['calle', 'altura', 'provincia'].every((campo) => String(direccion?.[campo] ?? '').trim() !== '')
}

// Identifica los datos que cambian la ubicación. Piso/depto y entre calles no
// mueven el punto, así que no reinician la búsqueda.
export function claveBusqueda(direccion) {
  return JSON.stringify(['calle', 'altura', 'localidad', 'provincia', 'codigo_postal']
    .map((campo) => String(direccion?.[campo] ?? '').trim().toLowerCase()))
}

// Las coordenadas sólo existen si el proveedor las encontró. Un null o un
// valor ausente no alcanza para confirmar la ubicación.
export function tieneCoordenadas(pedido) {
  return pedido?.latitud !== null && pedido?.latitud !== undefined && pedido?.longitud !== null && pedido?.longitud !== undefined
}

// Motivo visible cuando el botón de geocodificar está deshabilitado. La regla
// real la aplica el backend; esto sólo explica la interfaz.
export function motivoGeocodificar(pedido, ocupado) {
  if (!pedido) return ''
  if (ocupado) return 'Esperá a que termine la operación en curso.'
  if (pedido.estado_validacion === 'PENDIENTE') return 'La dirección todavía no fue validada. Guardala de nuevo para validarla.'
  if (pedido.estado_validacion === 'CON_ADVERTENCIAS') return 'La dirección tiene problemas. Corregila y guardala de nuevo para geocodificar.'
  if (pedido.estado_validacion === 'CONFIRMADA') return 'Esta dirección ya está confirmada.'
  if (pedido.estado_validacion !== 'VALIDA') return 'Sólo se geocodifica una dirección válida.'
  return ''
}

// Motivo visible cuando el botón de confirmar está deshabilitado.
export function motivoConfirmar(pedido, ocupado) {
  if (!pedido) return ''
  if (ocupado) return 'Esperá a que termine la operación en curso.'
  if (pedido.estado_validacion === 'CONFIRMADA') return 'Esta dirección ya está confirmada.'
  if (pedido.estado_validacion !== 'VALIDA') return 'Sólo se confirma una dirección válida. Corregí los problemas y guardala de nuevo.'
  if (!tieneCoordenadas(pedido)) return 'Geocodificá la dirección para obtener coordenadas antes de confirmar.'
  return ''
}
