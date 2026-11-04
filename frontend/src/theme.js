export const themeKey = 'mandatodo-theme'
export function initialTheme() {
  let saved
  try { saved = localStorage.getItem(themeKey) } catch { /* Storage bloqueado: preferencia del sistema. */ }
  return ['light', 'dark'].includes(saved) ? saved : typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}
