const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (res.status === 204) return null

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const error = new Error(body?.message ?? 'Error inesperado del servidor')
    error.status = res.status
    throw error
  }

  return body?.data ?? body
}

export function listAddresses() {
  return request('/addresses')
}

export function getAddress(id) {
  return request(`/addresses/${id}`)
}

export function createAddress(data) {
  return request('/addresses', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateAddress(id, data) {
  return request(`/addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function removeAddress(id) {
  return request(`/addresses/${id}`, {
    method: 'DELETE',
  })
}