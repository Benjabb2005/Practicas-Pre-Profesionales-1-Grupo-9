// Un pedido recién guardado todavía no tiene coordenadas. No hay que convertir
// null o undefined a 0: eso abriría el mapa en el océano (0,0) y parecería que
// la geocodificación falló sin mostrar el estado real.
export function coordenadasDeMapa(latitud, longitud) {
  if (latitud === null || latitud === undefined || longitud === null || longitud === undefined) {
    return null
  }

  const textoLatitud = String(latitud).trim()
  const textoLongitud = String(longitud).trim()
  if (!textoLatitud || !textoLongitud) return null

  const lat = Number(textoLatitud)
  const lon = Number(textoLongitud)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null

  return { lat, lon }
}
