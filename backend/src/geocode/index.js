// Interfaz común para los proveedores de geocodificación.
const { createGeorefProvider } = require("./georef");

function createGeocodeAdapter(config = {}) {
    const proveedor = (config.proveedor || "georef").toLowerCase();
    const opciones = { timeoutMs: config.timeoutMs, fetchImpl: config.fetchImpl };
    if (proveedor === "georef") return createGeorefProvider({ ...opciones, baseUrl: config.baseUrl });
    if (proveedor === "google") throw new Error("Google Geocoding queda deshabilitado hasta contar con mapa de Google y borrado automático de coordenadas a los 30 días.");
    throw new Error(`Proveedor de geocodificación no soportado: ${proveedor}`);
}

module.exports = { createGeocodeAdapter };
