// Servicio para normalizar y geolocalizar direcciones (Nominatim/OpenStreetMap).
// Se implementa en una etapa posterior del proyecto.
class GeocodeService {
    async geocode(address) {
        throw new Error("Geocoding no implementado todavía");
    }
}

module.exports = new GeocodeService();