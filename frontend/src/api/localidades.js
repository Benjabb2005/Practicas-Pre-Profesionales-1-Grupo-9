import { api } from './client'

// Catálogo de provincias y sugerencias de localidades. Georef se consulta siempre
// desde el backend; el navegador sólo habla con /api.
export async function listarProvincias() {
  const { data } = await api.get('/provincias')
  return data.provincias
}

export async function buscarLocalidades(provincia, nombre) {
  const { data } = await api.get('/localidades', { params: { provincia, nombre } })
  return data.localidades
}
