import { useEffect, useState } from 'react'
import './Theme.css'
import { themeKey, initialTheme, applyTheme } from './theme.js'
export default function ThemeToggle() {
  const [theme, setTheme] = useState(initialTheme)
  useEffect(() => {
    applyTheme(theme)
    try { localStorage.setItem(themeKey, theme) } catch { /* El control sigue funcionando sin persistencia. */ }
  }, [theme])
  useEffect(() => {
    function changed(event) { if (event.key === themeKey && ['light', 'dark'].includes(event.newValue)) setTheme(event.newValue) }
    window.addEventListener('storage', changed)
    return () => window.removeEventListener('storage', changed)
  }, [])
  return <button className="theme-toggle" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{theme === 'dark' ? <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></> : <path d="M20 14.3A8.5 8.5 0 0 1 9.7 4a8.5 8.5 0 1 0 10.3 10.3Z"/>}</svg>
  </button>
}
