import { createContext } from 'react'

// Contexto aislado del componente para no romper el fast refresh.
export const AuthContext = createContext(null)
