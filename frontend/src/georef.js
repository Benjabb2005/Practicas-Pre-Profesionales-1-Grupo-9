// Alternativa para entornos donde el backend no consigue conexión de salida.
// Los puntos siguen siendo sugerencias: la revisión se valida y guarda en servidor.
export async function browserGeoref(address, signal) {
  const url = new URL('https://apis.datos.gob.ar/georef/api/direcciones')
  url.search = new URLSearchParams({ direccion: `${address.calle.trim()} ${address.altura.trim()}`, localidad: address.localidad.trim(), provincia: address.provincia.trim(), max: '10' }).toString()
  let response
  try { response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(6000)]), credentials: 'omit', headers: { Accept: 'application/json' } }) }
  catch { throw new Error('No pudimos conectar con Georef. Volvé a intentar o ajustá el punto manualmente.') }
  if (!response.ok) throw new Error(response.status === 429 ? 'Georef alcanzó su límite de consultas. Intentá más tarde.' : 'Georef no está disponible. Volvé a intentar.')
  const body = await response.json()
  if (!Array.isArray(body.direcciones)) throw new Error('Georef devolvió una respuesta inválida.')
  const candidates = body.direcciones.slice(0, 10).map((row, id) => {
    const lat = row?.ubicacion?.lat, lng = row?.ubicacion?.lon
    const valid = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    return { id, label: typeof row?.nomenclatura === 'string' ? row.nomenclatura.slice(0, 1000) : 'Dirección sin descripción', lat: valid ? lat : null, lng: valid ? lng : null, quality: valid ? 'approximate' : 'no_coordinates' }
  })
  return { provider: 'georef', status: candidates.length === 0 ? 'zero_results' : candidates.length > 1 ? 'multiple_results' : candidates[0].quality, candidates }
}
