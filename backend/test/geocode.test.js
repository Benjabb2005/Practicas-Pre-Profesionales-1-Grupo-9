const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createNominatimAdapter, componerConsulta, clasificarConfianza } = require("../src/geocode/nominatim");

function respuestaJson(datos) {
    return { ok: true, status: 200, async json() { return datos; } };
}

test("compone la consulta con los datos disponibles", () => {
    const consulta = componerConsulta({ calle: "Av. Corrientes", altura: "1234", localidad: "CABA", provincia: "CABA", codigo_postal: "1043" });
    assert.match(consulta, /Av\. Corrientes, 1234/);
    assert.match(consulta, /CABA/);
    assert.match(consulta, /Argentina/);
});

test("clasifica la precisión del proveedor en ALTO, MEDIO y BAJO", () => {
    assert.equal(clasificarConfianza({ type: "house" }), "ALTO");
    assert.equal(clasificarConfianza({ type: "residential" }), "ALTO");
    assert.equal(clasificarConfianza({ type: "street" }), "MEDIO");
    assert.equal(clasificarConfianza({ type: "administrative" }), "BAJO");
});

test("una dirección de calle y número exactos da confianza ALTA (OK)", async () => {
    const adapter = createNominatimAdapter({
        fetchImpl: async () => respuestaJson([{ lat: "-34.6", lon: "-58.4", type: "house", display_name: "Av. Corrientes 1234, CABA" }]),
        userAgent: "prueba",
    });

    const salida = await adapter.geocodificar({ calle: "Av. Corrientes", altura: "1234", localidad: "CABA" });

    assert.equal(salida.resultado, "OK");
    assert.equal(salida.nivelConfianza, "ALTO");
    assert.equal(salida.latitud, -34.6);
    assert.equal(salida.proveedor, "nominatim");
});

test("una coincidencia de solo calle da confianza MEDIA (APPROXIMATE)", async () => {
    const adapter = createNominatimAdapter({
        fetchImpl: async () => respuestaJson([{ lat: "-34.6", lon: "-58.4", type: "street" }]),
        userAgent: "prueba",
    });

    const salida = await adapter.geocodificar({ calle: "Av. Corrientes" });

    assert.equal(salida.resultado, "APPROXIMATE");
    assert.equal(salida.nivelConfianza, "MEDIO");
});

test("sin resultados devuelve ZERO_RESULTS y sin coordenadas", async () => {
    const adapter = createNominatimAdapter({ fetchImpl: async () => respuestaJson([]), userAgent: "prueba" });

    const salida = await adapter.geocodificar({ calle: "Calle Inventada", altura: "9999" });

    assert.equal(salida.resultado, "ZERO_RESULTS");
    assert.equal(salida.latitud ?? null, null);
});

test("el timeout del proveedor no rompe y devuelve ERROR", async () => {
    const adapter = createNominatimAdapter({
        fetchImpl: async () => { const error = new Error("abortado"); error.name = "AbortError"; throw error; },
        userAgent: "prueba",
    });

    const salida = await adapter.geocodificar({ calle: "Av. Corrientes", altura: "1" });

    assert.equal(salida.resultado, "ERROR");
    assert.match(salida.motivo, /tiempo/);
});

test("un fallo de red del proveedor devuelve ERROR", async () => {
    const adapter = createNominatimAdapter({ fetchImpl: async () => { throw new Error("caído"); }, userAgent: "prueba" });

    const salida = await adapter.geocodificar({ calle: "Av. Corrientes", altura: "1" });

    assert.equal(salida.resultado, "ERROR");
});

test("un estado HTTP de error del proveedor devuelve ERROR", async () => {
    const adapter = createNominatimAdapter({ fetchImpl: async () => ({ ok: false, status: 429 }), userAgent: "prueba" });

    const salida = await adapter.geocodificar({ calle: "Av. Corrientes", altura: "1" });

    assert.equal(salida.resultado, "ERROR");
    assert.match(salida.motivo, /429/);
});
