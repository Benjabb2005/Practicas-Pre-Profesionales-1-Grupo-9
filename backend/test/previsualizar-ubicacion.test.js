const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const jwt = require("jsonwebtoken");
const createApp = require("../app");
const { createGeocodeService } = require("../src/services/GeocodeService");

// Repositorio que falla ante cualquier uso: la previsualización no puede persistir.
const pedidosProhibidos = new Proxy({}, {
    get(_, nombre) {
        return () => { throw new Error(`la previsualización no debe usar pedidos.${String(nombre)}`); };
    },
});

function adaptadorFalso(salida) {
    const llamadas = [];
    return {
        nombre: "falso",
        llamadas,
        async geocodificar(direccion) {
            llamadas.push(direccion);
            return typeof salida === "function" ? salida(direccion) : salida;
        },
    };
}

const completa = { calle: "av. corrientes", altura: "1.234", localidad: "caba", provincia: "caba" };

test("previsualizar una dirección completa devuelve candidatos tentativos sin tocar pedidos", async () => {
    const adapter = adaptadorFalso({ resultado: "APPROXIMATE", candidatos: [{ indice: 0, direccion: "Av. Corrientes 1234", latitud: -34.6, longitud: -58.4, nivelConfianza: "MEDIO" }] });
    const servicio = createGeocodeService({ pedidos: pedidosProhibidos, adapter });

    const salida = await servicio.previsualizar(completa);

    assert.equal(salida.resultado, "APPROXIMATE");
    assert.equal(salida.tentativa, true);
    assert.equal(salida.ambiguo, false);
    assert.equal(salida.candidatos.length, 1);
    assert.equal(salida.candidatos[0].latitud, -34.6);
    // El proveedor recibe la dirección ya normalizada por el servidor.
    assert.equal(adapter.llamadas[0].calle, "Avenida Corrientes");
    assert.equal(adapter.llamadas[0].altura, "1234");
});

test("previsualizar no consulta al proveedor si falta calle, altura o provincia", async () => {
    const casos = [
        [{ altura: "1234", provincia: "Buenos Aires" }, "calle"],
        [{ calle: "Av. Corrientes", provincia: "Buenos Aires" }, "altura"],
        [{ calle: "Av. Corrientes", altura: "1234" }, "provincia"],
        [{ calle: "Av. Corrientes", altura: "S/N", provincia: "Buenos Aires" }, "altura"],
        [{}, "calle"],
    ];
    for (const [direccion, campo] of casos) {
        const adapter = adaptadorFalso({ resultado: "OK" });
        const servicio = createGeocodeService({ pedidos: pedidosProhibidos, adapter });

        const salida = await servicio.previsualizar(direccion);

        assert.equal(salida.resultado, "INCOMPLETA", campo);
        assert.deepEqual(salida.candidatos, []);
        assert.ok(salida.problemas.some((problema) => problema.campo === campo), campo);
        assert.equal(adapter.llamadas.length, 0, campo);
    }
});

test("previsualizar no exige localidad ni código postal", async () => {
    const adapter = adaptadorFalso({ resultado: "APPROXIMATE", latitud: -34.6, longitud: -58.4 });
    const servicio = createGeocodeService({ pedidos: pedidosProhibidos, adapter });

    const salida = await servicio.previsualizar({ calle: "Av. Corrientes", altura: "1234", provincia: "Buenos Aires" });

    assert.equal(salida.resultado, "APPROXIMATE");
    assert.equal(salida.candidatos.length, 1);
    assert.equal(adapter.llamadas.length, 1);
});

test("previsualizar con varios candidatos es ambiguo y no elige ninguno", async () => {
    const adapter = adaptadorFalso({ resultado: "APPROXIMATE", candidatos: [
        { indice: 0, direccion: "A", latitud: -37.9, longitud: -57.5, nivelConfianza: "BAJO" },
        { indice: 1, direccion: "B", latitud: -38.7, longitud: -62.2, nivelConfianza: "BAJO" },
    ] });
    const servicio = createGeocodeService({ pedidos: pedidosProhibidos, adapter });

    const salida = await servicio.previsualizar(completa);

    assert.equal(salida.ambiguo, true);
    assert.equal(salida.candidatos.length, 2);
});

test("previsualizar propaga ZERO_RESULTS y ERROR del proveedor sin inventar coordenadas", async () => {
    for (const salidaProveedor of [
        { resultado: "ZERO_RESULTS", motivo: "Sin coordenadas.", candidatos: [] },
        { resultado: "ERROR", motivo: "Georef no respondió a tiempo.", candidatos: [] },
    ]) {
        const servicio = createGeocodeService({ pedidos: pedidosProhibidos, adapter: adaptadorFalso(salidaProveedor) });

        const salida = await servicio.previsualizar(completa);

        assert.equal(salida.resultado, salidaProveedor.resultado);
        assert.equal(salida.motivo, salidaProveedor.motivo);
        assert.deepEqual(salida.candidatos, []);
    }
});

async function conApp(prueba) {
    const db = new Proxy({}, { get() { return () => { throw new Error("no debe usar la base"); }; } });
    const app = createApp({ db, config: { jwt: { secret: "secreto-de-prueba", expiraEn: "1h" }, geocode: {} } });
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    try {
        await prueba(`http://127.0.0.1:${server.address().port}`);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
            server.closeAllConnections();
        });
    }
}

const token = (rol) => jwt.sign({ sub: 1, rol, email: "u@test.com" }, "secreto-de-prueba", { expiresIn: "1h" });
const enviar = (baseUrl, cuerpo, rol) => fetch(`${baseUrl}/api/pedidos/previsualizar-ubicacion`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(rol ? { authorization: `Bearer ${token(rol)}` } : {}) },
    body: JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(3000),
});

test("previsualizar-ubicacion: sin token 401, chofer 403, operador y administrador 200", async () => {
    await conApp(async (baseUrl) => {
        assert.equal((await enviar(baseUrl, { calle: "X" })).status, 401);
        assert.equal((await enviar(baseUrl, { calle: "X" }, "CHOFER")).status, 403);
        for (const rol of ["OPERADOR", "ADMINISTRADOR"]) {
            const respuesta = await enviar(baseUrl, { calle: "Av. Corrientes" }, rol);
            assert.equal(respuesta.status, 200);
            const cuerpo = await respuesta.json();
            assert.equal(cuerpo.resultado, "INCOMPLETA");
            assert.equal(cuerpo.tentativa, true);
        }
    });
});

test("previsualizar-ubicacion: un campo demasiado largo es 400", async () => {
    await conApp(async (baseUrl) => {
        const respuesta = await enviar(baseUrl, { calle: "x".repeat(200) }, "OPERADOR");
        assert.equal(respuesta.status, 400);
    });
});
