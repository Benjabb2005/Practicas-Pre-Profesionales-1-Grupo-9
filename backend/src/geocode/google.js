const { crearCache, normalizarDireccion } = require("./cache");
const { textoDireccion } = require("./georef");

function confianzaGoogle(resultado) {
    if (resultado.partial_match) return "BAJO";
    const tipo = resultado.geometry?.location_type;
    if (tipo === "ROOFTOP") return "ALTO";
    if (tipo === "RANGE_INTERPOLATED") return "MEDIO";
    return "BAJO";
}

function createGoogleProvider({ fetchImpl = fetch, apiKey, baseUrl = "https://maps.googleapis.com/maps/api/geocode/json", timeoutMs = 5000, ttlMs } = {}) {
    const cache = crearCache({ ttlMs });
    return {
        nombre: "google",
        async geocodificar(direccion) {
            const clave = JSON.stringify(normalizarDireccion(direccion));
            return cache.obtener(clave, async () => {
                if (!apiKey) return { resultado: "ERROR", motivo: "Google está seleccionado, pero falta configurar GOOGLE_MAPS_API_KEY.", candidatos: [] };
                const consulta = [textoDireccion(direccion), direccion.localidad, direccion.provincia, "Argentina"].filter(Boolean).join(", ");
                const url = new URL(baseUrl);
                url.searchParams.set("address", consulta);
                url.searchParams.set("key", apiKey);
                url.searchParams.set("region", "ar");
                url.searchParams.set("language", "es");
                const controlador = new AbortController();
                const temporizador = setTimeout(() => controlador.abort(), timeoutMs);
                try {
                    const respuesta = await fetchImpl(url, { signal: controlador.signal });
                    if (respuesta.status === 429) return { resultado: "ERROR", motivo: "Google alcanzó el límite de consultas. Esperá un momento y reintentá.", candidatos: [] };
                    if (!respuesta.ok) return { resultado: "ERROR", motivo: `Google respondió con estado ${respuesta.status}.`, candidatos: [] };
                    const datos = await respuesta.json();
                    if (datos.status === "ZERO_RESULTS") return { resultado: "ZERO_RESULTS", motivo: "Google no encontró esta dirección.", candidatos: [] };
                    if (datos.status === "OVER_QUERY_LIMIT" || datos.status === "OVER_DAILY_LIMIT") return { resultado: "ERROR", motivo: "Google alcanzó el límite de uso configurado.", candidatos: [] };
                    if (datos.status !== "OK") return { resultado: "ERROR", motivo: "Google no pudo procesar la consulta.", candidatos: [] };
                    const candidatos = (datos.results || []).map((resultado, indice) => ({
                        indice,
                        direccion: resultado.formatted_address || "Dirección encontrada",
                        latitud: Number(resultado.geometry?.location?.lat),
                        longitud: Number(resultado.geometry?.location?.lng),
                        nivelConfianza: confianzaGoogle(resultado),
                    })).filter((c) => Number.isFinite(c.latitud) && Number.isFinite(c.longitud));
                    return { resultado: candidatos.length === 1 && candidatos[0].nivelConfianza === "ALTO" ? "OK" : "APPROXIMATE", candidatos };
                } catch (error) {
                    const motivo = error?.name === "AbortError" ? "Google no respondió a tiempo." : "No se pudo contactar a Google.";
                    return { resultado: "ERROR", motivo, candidatos: [] };
                } finally { clearTimeout(temporizador); }
            });
        },
    };
}

module.exports = { createGoogleProvider, confianzaGoogle };
