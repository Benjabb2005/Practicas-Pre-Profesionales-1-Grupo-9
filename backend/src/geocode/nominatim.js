// Adaptador de geocodificación sobre Nominatim (OpenStreetMap). Usa el fetch global
// de Node, sin dependencias. No lanza por errores de red: los clasifica para que el
// servicio registre el intento y nunca confirme una dirección de forma automática.
function componerConsulta(direccion = {}) {
    return [direccion.calle, direccion.altura, direccion.localidad, direccion.provincia, direccion.codigo_postal, "Argentina"]
        .map((parte) => (parte === undefined || parte === null ? "" : String(parte).trim()))
        .filter(Boolean)
        .join(", ");
}

// Traduce la precisión que reporta el proveedor a los niveles del sistema.
function clasificarConfianza(dato) {
    const tipo = String(dato.type || dato.class || "").toLowerCase();
    if (["house", "building", "residential", "commercial", "address"].includes(tipo)) return "ALTO";
    if (["street", "road", "pedestrian", "footway", "neighbourhood", "suburb", "city_district"].includes(tipo)) return "MEDIO";
    return "BAJO";
}

function createNominatimAdapter({ fetchImpl = fetch, baseUrl = "https://nominatim.openstreetmap.org", userAgent = "Mandatodo-MVP1", timeoutMs = 5000 } = {}) {
    return {
        nombre: "nominatim",

        async geocodificar(direccion) {
            const consulta = componerConsulta(direccion);
            if (!consulta) {
                return { resultado: "ERROR", motivo: "La dirección está vacía." };
            }

            const url = `${baseUrl}/search?format=jsonv2&addressdetails=1&limit=1&q=${encodeURIComponent(consulta)}`;
            const controlador = new AbortController();
            const temporizador = setTimeout(() => controlador.abort(), timeoutMs);
            try {
                const respuesta = await fetchImpl(url, {
                    headers: { "User-Agent": userAgent, "Accept-Language": "es" },
                    signal: controlador.signal,
                });
                if (!respuesta.ok) {
                    return { resultado: "ERROR", motivo: `El proveedor respondió con estado ${respuesta.status}.` };
                }
                const datos = await respuesta.json();
                if (!Array.isArray(datos) || datos.length === 0) {
                    return { resultado: "ZERO_RESULTS", motivo: "No se encontró la dirección en el proveedor." };
                }
                const primero = datos[0];
                const latitud = Number(primero.lat);
                const longitud = Number(primero.lon);
                if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
                    return { resultado: "ERROR", motivo: "El proveedor devolvió coordenadas inválidas." };
                }
                const nivelConfianza = clasificarConfianza(primero);
                return {
                    resultado: nivelConfianza === "ALTO" ? "OK" : "APPROXIMATE",
                    latitud,
                    longitud,
                    nivelConfianza,
                    direccion_normalizada: primero.display_name || null,
                    proveedor: "nominatim",
                };
            } catch (error) {
                if (error && error.name === "AbortError") {
                    return { resultado: "ERROR", motivo: "El proveedor no respondió a tiempo." };
                }
                return { resultado: "ERROR", motivo: "No se pudo contactar al proveedor." };
            } finally {
                clearTimeout(temporizador);
            }
        },
    };
}

module.exports = { createNominatimAdapter, componerConsulta, clasificarConfianza };
