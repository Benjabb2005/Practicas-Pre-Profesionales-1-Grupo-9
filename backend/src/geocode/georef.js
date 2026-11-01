const { crearCache, normalizarDireccion } = require("./cache");

function textoDireccion(direccion = {}) {
    return [direccion.calle, direccion.altura, direccion.piso_depto,
        direccion.entre_calles ? `entre ${direccion.entre_calles}` : null]
        .map((valor) => String(valor ?? "").trim()).filter(Boolean).join(" ");
}

function confianza(dato, solicitada) {
    const ubicacion = dato.ubicacion;
    if (!ubicacion || !Number.isFinite(Number(ubicacion.lat)) || !Number.isFinite(Number(ubicacion.lon))) return null;
    const calleCoincide = dato.calle?.nombre && solicitada.calle
        && dato.calle.nombre.toLocaleLowerCase("es-AR").includes(solicitada.calle.replace(/^(av\.?|avenida)\s+/i, "").toLocaleLowerCase("es-AR"));
    const alturaCoincide = Number(dato.altura?.valor) === Number(solicitada.altura);
    // Georef filtra por `localidad` (barrio o localidad, ej. Claypole) pero en la respuesta
    // informa la localidad censal (Almirante Brown), así que el nombre no se compara:
    // si se pidió una localidad, un resultado ya pasó ese filtro.
    const zonaCoincide = Boolean(solicitada.localidad);
    // Georef informa que sus coordenadas son aproximadas; ALTO queda reservado a un proveedor que la declare precisa.
    return calleCoincide && alturaCoincide && zonaCoincide ? "MEDIO" : "BAJO";
}

const TIPOS_DE_CALLE = /^(av\.?|avenida|calle|pasaje|pje\.?|diagonal|bv\.?|boulevard|bulevar)$/i;

// Georef guarda muchas calles con el nombre abreviado ("B ROLDAN" por "Belisario
// Roldán"). Si la búsqueda exacta no encuentra nada, se reintenta con la primera
// palabra reducida a su inicial. Los resultados de esa variante salen con confianza
// BAJO (el nombre no coincide) y siempre los revisa una persona.
function variantesDeCalle(calle) {
    const palabras = String(calle ?? "").trim().split(/\s+/).filter(Boolean);
    while (palabras.length && TIPOS_DE_CALLE.test(palabras[0])) palabras.shift();
    if (palabras.length < 2 || palabras[0].length < 2) return [];
    return [[palabras[0][0], ...palabras.slice(1)].join(" ")];
}

function createGeorefProvider({ fetchImpl = fetch, baseUrl = "https://apis.datos.gob.ar/georef/api", timeoutMs = 3000, ttlMs } = {}) {
    const cache = crearCache({ ttlMs });

    // Una consulta a Georef con su propio timeout. Devuelve { candidatos } o { error }.
    async function consultar(texto, direccion) {
        const url = new URL(`${baseUrl}/direcciones`);
        url.searchParams.set("direccion", texto);
        url.searchParams.set("max", "10");
        if (direccion.provincia) url.searchParams.set("provincia", direccion.provincia);
        if (direccion.localidad) url.searchParams.set("localidad", direccion.localidad);
        const controlador = new AbortController();
        const temporizador = setTimeout(() => controlador.abort(), timeoutMs);
        try {
            const respuesta = await fetchImpl(url, { signal: controlador.signal, headers: { Accept: "application/json" } });
            if (respuesta.status === 429) return { error: "Georef alcanzó el límite de consultas. Esperá un momento y reintentá." };
            if (!respuesta.ok) return { error: `Georef respondió con estado ${respuesta.status}.` };
            const datos = await respuesta.json();
            const candidatos = (Array.isArray(datos.direcciones) ? datos.direcciones : []).map((dato, indice) => ({
                indice,
                direccion: dato.nomenclatura || "Dirección aproximada",
                latitud: Number(dato.ubicacion?.lat),
                longitud: Number(dato.ubicacion?.lon),
                nivelConfianza: confianza(dato, direccion),
            })).filter((c) => Number.isFinite(c.latitud) && Number.isFinite(c.longitud));
            return { candidatos };
        } catch (error) {
            return { error: error?.name === "AbortError" ? "Georef no respondió a tiempo." : "No se pudo contactar a Georef." };
        } finally { clearTimeout(temporizador); }
    }

    return {
        nombre: "georef",
        async geocodificar(direccion) {
            const clave = JSON.stringify(normalizarDireccion(direccion));
            return cache.obtener(clave, async () => {
                const consulta = textoDireccion(direccion);
                if (!consulta) return { resultado: "ERROR", motivo: "La dirección está vacía.", candidatos: [] };
                const consultas = [consulta, ...variantesDeCalle(direccion.calle).map((calle) => textoDireccion({ ...direccion, calle }))];
                for (const texto of consultas) {
                    const salida = await consultar(texto, direccion);
                    if (salida.error) return { resultado: "ERROR", motivo: salida.error, candidatos: [] };
                    // La API describe sus coordenadas como aproximadas; no se las etiqueta como precisión exacta.
                    if (salida.candidatos.length) return { resultado: "APPROXIMATE", candidatos: salida.candidatos };
                }
                return { resultado: "ZERO_RESULTS", motivo: "Georef no encontró coordenadas para esta dirección.", candidatos: [] };
            });
        },
    };
}

module.exports = { createGeorefProvider, textoDireccion, confianza, variantesDeCalle };
