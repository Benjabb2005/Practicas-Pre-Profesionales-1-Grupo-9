// Fábrica del adaptador de geocodificación. Hoy solo Nominatim; agregar otro
// proveedor implica sumar un módulo acá sin tocar el servicio ni las rutas.
const { createNominatimAdapter } = require("./nominatim");

function createGeocodeAdapter(config = {}) {
    const proveedor = (config.proveedor || "nominatim").toLowerCase();
    if (proveedor === "nominatim") {
        return createNominatimAdapter({
            baseUrl: config.baseUrl,
            userAgent: config.userAgent,
            timeoutMs: config.timeoutMs,
        });
    }
    throw new Error(`Proveedor de geocodificación no soportado: ${config.proveedor}`);
}

module.exports = { createGeocodeAdapter };
