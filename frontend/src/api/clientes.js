import { api } from './client'

// Acceso al ABM de clientes. El backend valida rol, formato, DNI único y
// coincidencias de teléfono o email; acá solo se arma la llamada.
export async function listarClientes(busqueda, signal) {
  const { data } = await api.get('/clientes', { params: busqueda ? { busqueda } : {}, ...(signal ? { signal } : {}) })
  return data.clientes
}

export async function crearCliente(cuerpo) {
  const { data } = await api.post('/clientes', cuerpo)
  return data
}

export async function actualizarCliente(id, cuerpo) {
  const { data } = await api.put(`/clientes/${id}`, cuerpo)
  return data
}

export async function eliminarCliente(id) {
  await api.delete(`/clientes/${id}`)
}

export async function listarDireccionesCliente(id, signal) {
  return (await api.get(`/clientes/${id}/direcciones`, { signal })).data.direcciones
}
