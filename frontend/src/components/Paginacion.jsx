import './Paginacion.css'

export default function Paginacion({ datos, nombre = 'resultados', disabled = false }) {
  if (!datos.total) return null
  return <nav className="paginacion" aria-label={`Paginación de ${nombre}`}>
    <span className="paginacion-rango" aria-live="polite">{datos.desde}–{datos.hasta} de {datos.total}</span>
    <div className="paginacion-controles"><button type="button" disabled={disabled || datos.pagina === 1} onClick={() => datos.onPagina(datos.pagina - 1)}>Anterior</button>
      <span className="paginacion-pagina" aria-label={`Página ${datos.pagina} de ${datos.paginas}`}>{datos.pagina} / {datos.paginas}</span>
      <button type="button" disabled={disabled || datos.pagina === datos.paginas} onClick={() => datos.onPagina(datos.pagina + 1)}>Siguiente</button></div>
  </nav>
}
