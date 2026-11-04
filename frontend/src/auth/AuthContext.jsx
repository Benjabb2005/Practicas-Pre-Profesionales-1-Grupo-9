import { useCallback, useEffect, useState } from 'react'
import { api, mensajeError } from '../api/client'
import { borrarToken, guardarToken, leerToken } from './tokenStore'
import { AuthContext } from './contexto'

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(Boolean(leerToken()))

  // Al arrancar, si hay token intentamos recuperar la sesión contra el backend.
  useEffect(() => {
    if (!leerToken()) {
      return
    }
    let vigente = true
    api.get('/auth/me')
      .then(({ data }) => {
        if (vigente) setUsuario(data.usuario)
      })
      .catch(() => {
        borrarToken()
        if (vigente) setUsuario(null)
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => { vigente = false }
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    guardarToken(data.token)
    setUsuario(data.usuario)
    return data.usuario
  }, [])

  const logout = useCallback(() => {
    borrarToken()
    setUsuario(null)
  }, [])

  return <AuthContext.Provider value={{ usuario, cargando, login, logout, errorLogin: mensajeError }}>
    {children}
  </AuthContext.Provider>
}
