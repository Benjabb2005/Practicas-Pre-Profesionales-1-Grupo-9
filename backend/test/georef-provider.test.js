const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createGeorefProvider, variantesDeCalle } = require("../src/geocode/georef");

const dato = (nombreCalle) => ({
    calle: { nombre: nombreCalle }, altura: { valor: 2875 }, localidad_censal: { nombre: "Almirante Brown" },
    nomenclatura: `${nombreCalle} 2875, Almirante Brown, Buenos Aires`, ubicacion: { lat: -34.81, lon: -58.36 },
});

// Georef simulado: sólo conoce las calles indicadas.
function fetchFalso(conocidas) {
    const consultas = [];
    const fetchImpl = async (url) => {
        const direccion = url.searchParams.get("direccion");
        consultas.push({ direccion, localidad: url.searchParams.get("localidad"), localidadCensal: url.searchParams.get("localidad_censal") });
        const direcciones = conocidas.filter((c) => direccion.toLowerCase().startsWith(c.toLowerCase())).map(dato);
        return { ok: true, status: 200, async json() { return { direcciones }; } };
    };
    return { fetchImpl, consultas };
}

const claypole = { calle: "Belisario Roldan", altura: "2875", localidad: "Claypole", provincia: "Buenos Aires" };

test("filtra por localidad y no por localidad censal", async () => {
    const { fetchImpl, consultas } = fetchFalso(["Belisario Roldan"]);
    await createGeorefProvider({ fetchImpl }).geocodificar(claypole);

    assert.equal(consultas[0].localidad, "Claypole");
    assert.equal(consultas[0].localidadCensal, null);
});

test("si no encuentra la calle, reintenta con el nombre abreviado y marca confianza BAJO", async () => {
    const { fetchImpl, consultas } = fetchFalso(["B Roldan"]);

    const salida = await createGeorefProvider({ fetchImpl }).geocodificar(claypole);

    assert.equal(consultas.length, 2);
    assert.match(consultas[1].direccion, /^B Roldan 2875/);
    assert.equal(salida.resultado, "APPROXIMATE");
    assert.equal(salida.candidatos[0].direccion, "B Roldan 2875, Almirante Brown, Buenos Aires");
    assert.equal(salida.candidatos[0].nivelConfianza, "BAJO");
});

test("si la búsqueda exacta encuentra algo, no reintenta", async () => {
    const { fetchImpl, consultas } = fetchFalso(["Belisario Roldan"]);

    const salida = await createGeorefProvider({ fetchImpl }).geocodificar(claypole);

    assert.equal(consultas.length, 1);
    assert.equal(salida.candidatos.length, 1);
});

test("sin ninguna coincidencia devuelve ZERO_RESULTS; un error de Georef corta sin reintentar", async () => {
    const vacio = fetchFalso([]);
    const sinDatos = await createGeorefProvider({ fetchImpl: vacio.fetchImpl }).geocodificar(claypole);
    assert.equal(sinDatos.resultado, "ZERO_RESULTS");
    assert.equal(vacio.consultas.length, 2);

    let llamadas = 0;
    const caido = async () => { llamadas += 1; return { ok: false, status: 503 }; };
    const conError = await createGeorefProvider({ fetchImpl: caido }).geocodificar(claypole);
    assert.equal(conError.resultado, "ERROR");
    assert.equal(llamadas, 1);
});

test("variantes de calle: abrevia la primera palabra, ignora el tipo y no toca calles de una palabra", () => {
    assert.deepEqual(variantesDeCalle("Belisario Roldan"), ["B Roldan"]);
    assert.deepEqual(variantesDeCalle("Av. Hipolito Yrigoyen"), ["H Yrigoyen"]);
    assert.deepEqual(variantesDeCalle("Sarmiento"), []);
    assert.deepEqual(variantesDeCalle("Avenida Mitre"), []);
    assert.deepEqual(variantesDeCalle(""), []);
});
