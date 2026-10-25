import { afterEach, expect, it, vi } from 'vitest'
import { initialTheme, applyTheme } from './theme'

afterEach(() => vi.unstubAllGlobals())
it('conserva la elección guardada aunque el sistema use otro tema', () => {
  vi.stubGlobal('localStorage', { getItem: () => 'light' })
  vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) })
  expect(initialTheme()).toBe('light')
})
it('usa la preferencia oscura del sistema si no hay elección válida', () => {
  vi.stubGlobal('localStorage', { getItem: () => 'invalido' })
  vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) })
  expect(initialTheme()).toBe('dark')
})
it('funciona con almacenamiento bloqueado y sin matchMedia', () => {
  vi.stubGlobal('localStorage', { getItem: () => { throw new Error('bloqueado') } })
  vi.stubGlobal('window', {})
  expect(initialTheme()).toBe('light')
})
it('aplica el tema también a los controles nativos del navegador', () => {
  const elemento = { dataset: {}, style: {} }
  vi.stubGlobal('document', { documentElement: elemento })
  applyTheme('dark')
  expect(elemento.dataset.theme).toBe('dark')
  expect(elemento.style.colorScheme).toBe('dark')
})
