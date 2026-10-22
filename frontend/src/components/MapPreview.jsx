import { useEffect } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import Icon from './Icon.jsx'
import { coordenadasDeMapa } from './mapa.js'

// Leaflet sólo usa `center` al montar el mapa. Este componente lo recentra cuando
// el operador vuelve a geocodificar y cambian las coordenadas.
function CentrarMapa({ lat, lon }) {
  const mapa = useMap()
  useEffect(() => {
    mapa.setView([lat, lon], mapa.getZoom() ?? 16)
  }, [lat, lon, mapa])
  return null
}

// Mapa de sólo lectura (Leaflet sobre teselas de OpenStreetMap). Muestra el punto
// geocodificado; no permite arrastrar el marcador: la corrección se hace en el
// formulario y la confirmación es siempre del operador.
function MapPreview({ latitud, longitud, etiqueta, buscando = false }) {
  const coordenadas = coordenadasDeMapa(latitud, longitud)

  if (!coordenadas) {
    return <div className="map-placeholder">
      <div className="map-grid"/>
      <div className="map-empty"><Icon name="pin" size={21}/><span>Sin coordenadas todavía.<br/>{buscando ? 'Buscando la dirección en OpenStreetMap…' : 'Buscá la dirección en el mapa para ver el punto.'}</span></div>
    </div>
  }

  const { lat, lon } = coordenadas

  return <div className="map-preview">
    <MapContainer center={[lat, lon]} zoom={16} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CentrarMapa lat={lat} lon={lon}/>
      <CircleMarker center={[lat, lon]} radius={10} pathOptions={{ color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: 0.7 }}>
        <Popup>{etiqueta || 'Ubicación geocodificada'}</Popup>
      </CircleMarker>
    </MapContainer>
  </div>
}

export default MapPreview
