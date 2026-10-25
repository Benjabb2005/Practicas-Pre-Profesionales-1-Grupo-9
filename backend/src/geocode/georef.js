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
    const zonaCoincide = dato.localidad_censal?.nombre && solicitada.localidad
        && dato.localidad_censal.nombre.toLocaleLowerCase("es-AR").includes(solicitada.localidad.toLocaleLowerCase("es-AR"));
    // Georef informa que sus coordenadas son aproximadas; ALTO queda reservado a un proveedor que la declare precisa.
    return calleCoincide && alturaCoincide && zonaCoincide ? "MEDIO" : "BAJO";
}

function createGeorefProvider({ fetchImpl = fetch, baseUrl = "https://apis.datos.gob.ar/georef/api", timeoutMs = 3000, ttlMs } = {}) {
    const cache = crearCache({ ttlMs });
    return {
        nombre: "georef",
        async geocodificar(direccion) {
            const clave = JSON.stringify(normalizarDireccion(direccion));
            return cache.obtener(clave, async () => {
                const consulta = textoDireccion(direccion);
                if (!consulta) return { resultado: "ERROR", motivo: "La dirección está vacía.", candidatos: [] };
                const url = new URL(`${baseUrl}/direcciones`);
                url.searchParams.set("direccion", consulta);
                url.searchParams.set("max", "10");
                if (direccion.provincia) url.searchParams.set("provincia", direccion.provincia);
                if (direccion.localidad) url.searchParams.set("localidad_censal", direccion.localidad);
                const controlador = new AbortController();
                const temporizador = setTimeout(() => controlador.abort(), timeoutMs);
                try {
                    const respuesta = await fetchImpl(url, { signal: controlador.signal, headers: { Accept: "application/json" } });
                    if (respuesta.status === 429) return { resultado: "ERROR", motivo: "Georef alcanzó el límite de consultas. Esperá un momento y reintentá.", candidatos: [] };
                    if (!respuesta.ok) return { resultado: "ERROR", motivo: `Georef respondió con estado ${respuesta.status}.`, candidatos: [] };
                    const datos = await respuesta.json();
                    const candidatos = (Array.isArray(datos.direcciones) ? datos.direcciones : []).map((dato, indice) => {
                        const nivelConfianza = confianza(dato, direccion);
                        return {
                            indice,
                            direccion: dato.nomenclatura || "Dirección aproximada",
                            latitud: Number(dato.ubicacion?.lat),
                            longitud: Number(dato.ubicacion?.lon),
                            nivelConfianza,
                        };
                    }).filter((c) => Number.isFinite(c.latitud) && Number.isFinite(c.longitud));
                    if (!candidatos.length) return { resultado: "ZERO_RESULTS", motivo: "Georef no encontró coordenadas para esta dirección.", candidatos: [] };
                    // La API describe sus coordenadas como aproximadas; no se las etiqueta como precisión exacta.
                    return { resultado: "APPROXIMATE", candidatos };
                } catch (error) {
                    const motivo = error?.name === "AbortError" ? "Georef no respondió a tiempo." : "No se pudo contactar a Georef.";
                    return { resultado: "ERROR", motivo, candidatos: [] };
                } finally { clearTimeout(temporizador); }
            });
        },
    };
}

module.exports = { createGeorefProvider, textoDireccion, confianza };
