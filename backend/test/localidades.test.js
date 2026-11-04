const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const jwt = require("jsonwebtoken");
const createApp = require("../app");
const { createGeorefClient, crearUrlLocalidades } = require("../src/georef/localidades");
const { createLocalidadService } = require("../src/services/LocalidadService");
const { NOMBRES_PROVINCIAS } = require("../src/constants/provincias");

function respuestaJson(datos) {
    return { ok: true, status: 200, async json() { return datos; } };
}

function respuestaConLocalidades(nombres) {
    return respuestaJson({ localidades: nombres.map((nombre) => ({ nombre })), cantidad: nombres.length });
}

test("arma la URL de Georef con los parámetros codificados y el límite", () => {
    const url = new URL(crearUrlLocalidades({ baseUrl: "https://ejemplo.test/api/", provincia: "Santa Fe", nombre: "Rosario", max: 10 }));
    assert.equal(url.origin + url.pathname, "https://ejemplo.test/api/localidades");
    assert.equal(url.searchParams.get("provincia"), "Santa Fe");
    assert.equal(url.searchParams.get("nombre"), "Rosario");
    assert.equal(url.searchParams.get("max"), "10");
});

test("una respuesta exitosa devuelve hasta 10 nombres", async () => {
    const nombres = Array.from({ length: 12 }, (_, indice) => `Localidad ${indice + 1}`);
    const cliente = createGeorefClient({ fetchImpl: async () => respuestaConLocalidades(nombres), baseUrl: "https://ejemplo.test" });

    const salida = await cliente.buscarLocalidades({ provincia: "Santa Fe", nombre: "Localidad" });

    assert.equal(salida.ok, true);
    assert.equal(salida.nombres.length, 10);
    assert.equal(salida.nombres[0], "Localidad 1");
});

test("un estado HTTP de error del proveedor devuelve lista vacía sin lanzar", async () => {
    const cliente = createGeorefClient({ fetchImpl: async () => ({ ok: false, status: 503 }) });

    const salida = await cliente.buscarLocalidades({ provincia: "Santa Fe", nombre: "Rosario" });

    assert.equal(salida.ok, false);
    assert.deepEqual(salida.nombres, []);
    assert.match(salida.motivo, /503/);
});

test("un fallo de red devuelve lista vacía sin lanzar", async () => {
    const cliente = createGeorefClient({ fetchImpl: async () => { throw new Error("caído"); } });

    const salida = await cliente.buscarLocalidades({ provincia: "Santa Fe", nombre: "Rosario" });

    assert.equal(salida.ok, false);
    assert.deepEqual(salida.nombres, []);
});

test("el timeout del proveedor devuelve lista vacía y no rompe", async () => {
    const cliente = createGeorefClient({
        fetchImpl: async () => { const error = new Error("abortado"); error.name = "AbortError"; throw error; },
    });

    const salida = await cliente.buscarLocalidades({ provincia: "Santa Fe", nombre: "Rosario" });

    assert.equal(salida.ok, false);
    assert.deepEqual(salida.nombres, []);
    assert.match(salida.motivo, /tiempo/);
});

test("una respuesta con forma inesperada se trata como fallo", async () => {
    const cliente = createGeorefClient({ fetchImpl: async () => respuestaJson({ error: "sin localidades" }) });

    const salida = await cliente.buscarLocalidades({ provincia: "Santa Fe", nombre: "Rosario" });

    assert.equal(salida.ok, false);
    assert.deepEqual(salida.nombres, []);
});

test("el servicio manda la provincia canónica, deduplica y recorta la sugerencia", async () => {
    const llamadas = [];
    const cliente = {
        async buscarLocalidades(datos) {
            llamadas.push(datos);
            return { ok: true, nombres: ["Rosario", "rosario", "Funes"] };
        },
    };
    const servicio = createLocalidadService({ cliente });

    const sugerencias = await servicio.sugerir({ provincia: "sta fe", nombre: "  Ro  " });

    assert.deepEqual(llamadas, [{ provincia: "Santa Fe", nombre: "Ro" }]);
    assert.deepEqual(sugerencias, ["Rosario", "Funes"]);
});

test("si Georef falla no hay sugerencias y la verificación queda pendiente", async () => {
    const servicio = createLocalidadService({ cliente: { async buscarLocalidades() { return { ok: false, nombres: [] }; } } });

    assert.deepEqual(await servicio.sugerir({ provincia: "Santa Fe", nombre: "Rosario" }), []);
    assert.equal(await servicio.verificar({ provincia: "Santa Fe", localidad: "Rosario" }), "NO_VERIFICADO");
});

test("verificar reconoce la localidad aunque cambien tildes y mayúsculas", async () => {
    const servicio = createLocalidadService({
        cliente: { async buscarLocalidades() { return { ok: true, nombres: ["Río Segundo"] }; } },
    });

    assert.equal(await servicio.verificar({ provincia: "Córdoba", localidad: "rio segundo" }), "EXISTE");
});

test("verificar informa NO_EXISTE cuando solo hay coincidencias parciales", async () => {
    const servicio = createLocalidadService({
        cliente: { async buscarLocalidades() { return { ok: true, nombres: ["Rosario del Tala"] }; } },
    });

    assert.equal(await servicio.verificar({ provincia: "Entre Ríos", localidad: "Rosario" }), "NO_EXISTE");
});

test("CABA y Capital Federal cuentan como localidad de la jurisdicción", async () => {
    let llamado = false;
    const servicio = createLocalidadService({
        cliente: { async buscarLocalidades() { llamado = true; return { ok: true, nombres: [] }; } },
    });

    assert.equal(await servicio.verificar({ provincia: "caba", localidad: "Capital Federal" }), "EXISTE");
    assert.equal(llamado, false);
});

test("una provincia desconocida no consulta al proveedor", async () => {
    let llamado = false;
    const servicio = createLocalidadService({
        cliente: { async buscarLocalidades() { llamado = true; return { ok: true, nombres: [] }; } },
    });

    assert.deepEqual(await servicio.sugerir({ provincia: "Narnia", nombre: "Rosario" }), []);
    assert.equal(llamado, false);
});

function fakeDbListaLimpia() {
    return {
        async query() {
            return [[]];
        },
        async getConnection() {
            throw new Error("no debería abrir transacción en esta prueba");
        },
    };
}

async function iniciarApp(georef) {
    const app = createApp({
        db: fakeDbListaLimpia(),
        config: { jwt: { secret: "secreto-de-prueba", expiraEn: "1h" }, geocode: {}, georef: {} },
        georef,
    });
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    return { server, baseUrl: `http://127.0.0.1:${server.address().port}` };
}

async function cerrar(server) {
    await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
    });
}

function token(rol) {
    return jwt.sign({ sub: 1, rol, email: "usuario@test.com" }, "secreto-de-prueba", { expiresIn: "1h" });
}

test("GET /api/provincias devuelve los 24 nombres oficiales sin necesitar MySQL", async () => {
    const app = createApp();
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    try {
        const respuesta = await fetch(`http://127.0.0.1:${server.address().port}/api/provincias`, { signal: AbortSignal.timeout(3000) });
        assert.equal(respuesta.status, 200);
        const cuerpo = await respuesta.json();
        assert.equal(cuerpo.provincias.length, 24);
        assert.deepEqual(cuerpo.provincias, NOMBRES_PROVINCIAS);
        assert.ok(cuerpo.provincias.includes("Ciudad Autónoma de Buenos Aires"));
        assert.ok(cuerpo.provincias.includes("Tierra del Fuego, Antártida e Islas del Atlántico Sur"));
    } finally {
        await cerrar(server);
    }
});

test("localidades: sin token 401, chofer 403 y operador 200 con nombres", async () => {
    const llamadas = [];
    const georef = {
        async buscarLocalidades(datos) {
            llamadas.push(datos);
            return { ok: true, nombres: ["Rosario", "Funes"] };
        },
    };
    const { server, baseUrl } = await iniciarApp(georef);
    try {
        const sinToken = await fetch(`${baseUrl}/api/localidades?provincia=Santa%20Fe&nombre=Ro`, { signal: AbortSignal.timeout(3000) });
        assert.equal(sinToken.status, 401);

        const comoChofer = await fetch(`${baseUrl}/api/localidades?provincia=Santa%20Fe&nombre=Ro`, {
            headers: { authorization: `Bearer ${token("CHOFER")}` },
            signal: AbortSignal.timeout(3000),
        });
        assert.equal(comoChofer.status, 403);

        const comoOperador = await fetch(`${baseUrl}/api/localidades?provincia=sta%20fe&nombre=Ro`, {
            headers: { authorization: `Bearer ${token("OPERADOR")}` },
            signal: AbortSignal.timeout(3000),
        });
        assert.equal(comoOperador.status, 200);
        assert.deepEqual((await comoOperador.json()).localidades, ["Rosario", "Funes"]);
        assert.deepEqual(llamadas, [{ provincia: "Santa Fe", nombre: "Ro" }]);
    } finally {
        await cerrar(server);
    }
});

test("si Georef falla, el endpoint responde 200 con lista vacía", async () => {
    const { server, baseUrl } = await iniciarApp({ async buscarLocalidades() { return { ok: false, nombres: [] }; } });
    try {
        const respuesta = await fetch(`${baseUrl}/api/localidades?provincia=Santa%20Fe&nombre=Rosario`, {
            headers: { authorization: `Bearer ${token("ADMINISTRADOR")}` },
            signal: AbortSignal.timeout(3000),
        });
        assert.equal(respuesta.status, 200);
        assert.deepEqual((await respuesta.json()).localidades, []);
    } finally {
        await cerrar(server);
    }
});

test("localidades rechaza una búsqueda sin parámetros válidos", async () => {
    const { server, baseUrl } = await iniciarApp({ async buscarLocalidades() { return { ok: true, nombres: [] }; } });
    try {
        const sinNombre = await fetch(`${baseUrl}/api/localidades?provincia=Santa%20Fe`, {
            headers: { authorization: `Bearer ${token("ADMINISTRADOR")}` },
            signal: AbortSignal.timeout(3000),
        });
        assert.equal(sinNombre.status, 400);

        const nombreCorto = await fetch(`${baseUrl}/api/localidades?provincia=Santa%20Fe&nombre=R`, {
            headers: { authorization: `Bearer ${token("ADMINISTRADOR")}` },
            signal: AbortSignal.timeout(3000),
        });
        assert.equal(nombreCorto.status, 400);
    } finally {
        await cerrar(server);
    }
});
