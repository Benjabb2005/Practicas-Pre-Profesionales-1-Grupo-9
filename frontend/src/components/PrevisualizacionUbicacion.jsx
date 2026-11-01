import Paginacion from './Paginacion.jsx'
import usePagination from './usePagination.js'

const MENSAJES_FASE = {
  incompleta: 'Completá calle, altura y provincia para ver una ubicación tentativa en el mapa.',
  esperando: 'Esperando que termines de escribir…',
  buscando: 'Buscando la ubicación tentativa…',
}

// Estado de la búsqueda tentativa del destino. Nada de lo que muestra se guardó:
// la ubicación sólo se confirma después de guardar el pedido.
function PrevisualizacionUbicacion({ previsualizacion, indiceElegido, onElegir, onReintentar }) {
  const { fase, datos, mensaje } = previsualizacion
  const candidatos = fase === 'lista' ? datos?.candidatos ?? [] : []
  const paginados = usePagination(candidatos, datos, 5)

  if (fase === 'inactiva') return null

  if (MENSAJES_FASE[fase]) {
    return <p className="geo-ayuda" role="status">{MENSAJES_FASE[fase]}</p>
  }

  if (fase === 'error') {
    return <div className="geo-resultado error" role="alert">
      <b>No se pudo buscar</b>
      <span>{mensaje}</span>
      <button type="button" className="button button-outline" onClick={onReintentar}>Reintentar</button>
    </div>
  }

  if (datos.resultado === 'INCOMPLETA') {
    return <div className="geo-resultado aviso" role="status">
      <b>Dirección incompleta</b>
      <span>{datos.motivo}</span>
    </div>
  }

  if (datos.resultado === 'ERROR') {
    return <div className="geo-resultado error" role="alert">
      <b>Proveedor no disponible</b>
      <span>{datos.motivo || 'No se pudo consultar el proveedor de mapas.'}</span>
      <button type="button" className="button button-outline" onClick={onReintentar}>Reintentar</button>
    </div>
  }

  if (!candidatos.length) {
    return <div className="geo-resultado error" role="status">
      <b>Sin resultados</b>
      <span>No encontramos esa dirección. Revisá la calle, la altura y la localidad. Si es correcta, podés guardar el pedido y ubicarla en la revisión.</span>
    </div>
  }

  if (datos.ambiguo) {
    return <fieldset className="geo-candidatos">
      <legend>Encontramos varias ubicaciones posibles. Elegí la correcta para verla en el mapa:</legend>
      {paginados.items.map((candidato) => <label key={candidato.indice}>
        <input type="radio" name="candidato-previsualizacion" checked={indiceElegido === candidato.indice} onChange={() => onElegir(candidato.indice)}/>
        <span>{candidato.direccion}<small>Confianza: {candidato.nivelConfianza || 'BAJO'}</small></span>
      </label>)}
      <Paginacion datos={paginados} nombre="ubicaciones candidatas"/>
    </fieldset>
  }

  return <div className="geo-resultado aviso" role="status">
    <b>Ubicación tentativa</b>
    <span>Coincidencia aproximada: {candidatos[0].direccion}. Todavía no está guardada ni confirmada.</span>
  </div>
}

export default PrevisualizacionUbicacion
