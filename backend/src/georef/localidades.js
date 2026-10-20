// Cliente de localidades de Georef (apis.datos.gob.ar). Usa el fetch global de Node
// y nunca se llama desde el navegador. No lanza por errores externos: los clasifica
// para que el servicio decida entre "no existe" y "no se pudo verificar".
const LIMITE_POR_DEFECTO = 10;

function crearUrlLocalidades({ baseUrl, provincia, nombre, max = LIMITE_POR_DEFECTO }) {
    const base = String(baseUrl || "").replace(/\/+$/, "");
    const url = new URL(`${base}/localidades`);
    url.searchParams.set("provincia", provincia);
    url.searchParams.set("nombre", nombre);
    url.searchParams.set("max", String(max));
    return url.toString();
}

function createGeorefClient({
    fetchImpl = fetch,
    baseUrl = "https://apis.datos.gob.ar/georef/api",
    timeoutMs = 3000,
} = {}) {
    return {
        nombre: "georef",

        // Devuelve { ok, nombres, motivo? }. Si el proveedor falla, nombres queda
        // vacío y ok es false: el llamador no debe inventar un resultado.
        async buscarLocalidades({ provincia, nombre, max = LIMITE_POR_DEFECTO } = {}) {
            const consulta = String(nombre == null ? "" : nombre).trim();
            if (!provincia || !consulta) {
                return { ok: true, nombres: [] };
            }

            const controlador = new AbortController();
            const temporizador = setTimeout(() => controlador.abort(), timeoutMs);
            try {
                const url = crearUrlLocalidades({ baseUrl, provincia, nombre: consulta, max });
                const respuesta = await fetchImpl(url, {
                    headers: { Accept: "application/json" },
                    signal: controlador.signal,
                });
                if (!respuesta.ok) {
                    return { ok: false, nombres: [], motivo: `El proveedor respondió con estado ${respuesta.status}.` };
                }
                const datos = await respuesta.json();
                if (!datos || !Array.isArray(datos.localidades)) {
                    return { ok: false, nombres: [], motivo: "El proveedor devolvió una respuesta inesperada." };
                }
                const nombres = datos.localidades
                    .map((localidad) => localidad && localidad.nombre)
                    .filter((valor) => typeof valor === "string" && valor.trim() !== "")
                    .map((valor) => valor.trim())
                    .slice(0, max);
                return { ok: true, nombres };
            } catch (error) {
                if (error && error.name === "AbortError") {
                    return { ok: false, nombres: [], motivo: "El proveedor no respondió a tiempo." };
                }
                return { ok: false, nombres: [], motivo: "No se pudo contactar al proveedor." };
            } finally {
                clearTimeout(temporizador);
            }
        },
    };
}

module.exports = { createGeorefClient, crearUrlLocalidades, LIMITE_POR_DEFECTO };
