export async function api(path, { method = 'GET', body, signal, headers = {}, fullResponse = false } = {}) {
  let response
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(8000)]) : AbortSignal.timeout(8000),
    })
  } catch {
    throw new Error('No pudimos conectar con el servidor. Volvé a intentar.')
  }
  if (response.status === 204) return null
  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('El servicio no está disponible. Volvé a intentar.')
  }
  if (!response.ok) {
    const error = new Error(result.error?.message || 'No se pudo completar la solicitud.')
    error.status = response.status
    error.code = result.error?.code
    error.fields = result.error?.fields || {}
    if (error.status === 401 && path !== '/sesion') window.dispatchEvent(new Event('mandatodo-session-expired'))
    throw error
  }
  return fullResponse ? result : result.data
}
