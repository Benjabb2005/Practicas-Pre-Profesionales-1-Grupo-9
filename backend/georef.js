function failure(code, message, status = 503) {
    return Object.assign(new Error(message), { status, code, fields: {} });
}

function validAddress(address) {
    return ["calle", "altura", "localidad", "provincia", "codigoPostal"].every((field) => typeof address[field] === "string" && address[field].trim()) && /^\d+$/.test(address.altura) && Number.isSafeInteger(Number(address.altura)) && Number(address.altura) > 0;
}

function createGeoref({ fetchImpl = fetch, timeoutMs = 5000 } = {}) {
    return async (address) => {
        if (!validAddress(address)) throw failure("INCOMPLETE_ADDRESS", "La dirección está incompleta. Corregila antes de revisar la ubicación.", 422);
        const url = new URL("https://apis.datos.gob.ar/georef/api/direcciones");
        url.search = new URLSearchParams({ direccion: `${address.calle} ${address.altura}`, localidad: address.localidad, provincia: address.provincia, max: "10" }).toString();
        let response;
        try { response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: "application/json" } }); }
        catch (error) {
            const timeout = error.name === "TimeoutError" || error.cause?.name === "TimeoutError";
            throw failure(timeout ? "GEOREF_TIMEOUT" : "GEOREF_UNAVAILABLE", timeout ? "Georef demoró demasiado. Volvé a intentar." : "No pudimos conectar con Georef. Volvé a intentar.");
        }
        if (response.status === 429) throw failure("GEOREF_LIMIT", "Georef alcanzó su límite de consultas. Intentá más tarde.");
        if (!response.ok) throw failure("GEOREF_UNAVAILABLE", "Georef no está disponible. Volvé a intentar.");
        let body;
        try { body = await response.json(); } catch { throw failure("GEOREF_INVALID_RESPONSE", "Georef devolvió una respuesta inválida."); }
        if (!Array.isArray(body.direcciones)) throw failure("GEOREF_INVALID_RESPONSE", "Georef devolvió una respuesta inválida.");
        const candidates = body.direcciones.slice(0, 10).map((row, index) => {
            const lat = row?.ubicacion?.lat, lng = row?.ubicacion?.lon;
            const point = typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
            return { id: index, label: typeof row?.nomenclatura === "string" ? row.nomenclatura.slice(0, 1000) : "Dirección sin descripción", lat: point ? lat : null, lng: point ? lng : null, quality: point ? "approximate" : "no_coordinates" };
        });
        return { provider: "georef", status: candidates.length === 0 ? "zero_results" : candidates.length > 1 ? "multiple_results" : candidates[0].quality, candidates };
    };
}

module.exports = { createGeoref, validAddress };
