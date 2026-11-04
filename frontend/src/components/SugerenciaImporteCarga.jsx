import { importeParaPrecargar } from './importeSugerido.js'
import { moneda } from './importes.js'

export default function SugerenciaImporteCarga({ consulta, ambiguo, manual, disabled, onUsar }) {
  const { fase, datos } = consulta
  const importePositivo = importeParaPrecargar(datos)
  return <div className="geo-ayuda" aria-label="Sugerencia de importe del envío">
    {fase === 'sin-punto' && ambiguo && <p role="status">Elegí una ubicación para estimar el importe.</p>}
    {fase === 'buscando' && <p role="status">Calculando importe…</p>}
    {fase === 'lista' && (importePositivo
      ? <p role="status">Estimado: {moneda(datos.importe_sugerido)}. {manual && <button type="button" className="button button-outline" disabled={disabled} onClick={onUsar}>Usar sugerido</button>}</p>
      : <p role="status">{datos?.disponible ? 'Ingresá el importe manualmente.' : datos?.motivo}</p>)}
    {fase === 'error' && <p role="alert">No se pudo estimar. <button type="button" className="button button-outline" disabled={disabled} onClick={consulta.reintentar}>Reintentar</button></p>}
  </div>
}
