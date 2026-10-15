import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import Icon from './Icon.jsx'

// Mapa de sólo lectura (Leaflet sobre teselas de OpenStreetMap). Muestra el punto
// geocodificado; no permite arrastrar el marcador: la corrección se hace en el
// formulario y la confirmación es siempre del operador.
function MapPreview({ latitud, longitud, etiqueta }) {
  const lat = Number(latitud)
  const lon = Number(longitud)
  const hayCoordenadas = Number.isFinite(lat) && Number.isFinite(lon)

  if (!hayCoordenadas) {
    return <div className="map-placeholder">
      <div className="map-grid"/>
      <div className="map-empty"><Icon name="pin" size={21}/><span>Sin coordenadas todavía.<br/>Geocodificá la dirección para ver el punto.</span></div>
    </div>
  }

  return <div className="map-preview">
    <MapContainer center={[lat, lon]} zoom={16} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker center={[lat, lon]} radius={10} pathOptions={{ color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: 0.7 }}>
        <Popup>{etiqueta || 'Ubicación geocodificada'}</Popup>
      </CircleMarker>
    </MapContainer>
  </div>
}

export default MapPreview
