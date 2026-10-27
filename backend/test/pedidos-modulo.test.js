const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const jwt = require("jsonwebtoken");
const createApp = require("../app");
const { ESTADO_INICIAL } = require("../src/constants/estados");
const { CANALES, CANAL_PREDETERMINADO } = require("../src/constants/canales");
const { createPedidoService, claveDireccion, direccionEquivalente } = require("../src/services/PedidoService");
const { createGeocodeService } = require("../src/services/GeocodeService");
const { createPedidosController } = require("../src/controllers/pedidos.controller");
const { createPedidoRepository } = require("../src/repositories/PedidoRepository");
const { conflictoDuplicado } = require("../src/lib/errors");
const { errorHandler } = require("../src/middleware/errorHandler");
const { loadEnv } = require("../src/config/env");

function detalleFixture(overrides = {}) {
    return {
        id: 10,
        direccion_id: 5,
        estado: "EN STOCK",
        canal_origen: "MANUAL",
        estado_validacion: "PENDIENTE",
        direccion_validada: 0,
        calle: "Av. Corrientes",
        altura: "1234",
        piso_depto: null,
        entre_calles: null,
        localidad: "CABA",
        provincia: "CABA",
        codigo_postal: "1043",
        latitud: null,
        longitud: null,
        nivel_confianza: null,
        direccion_original: "Av. Corrientes 1234 CABA",
        ...overrides,
    };
}

function reposPedidosFalsos({ detalle, candidatos = [] } = {}) {
    const capturado = { crear: null, actualizarDireccion: null, geocodificacion: null, confirmacion: null, candidatos: null };
    return {
        capturado,
        async buscarCandidatosDuplicados(args) {
            capturado.candidatos = args;
            return candidatos;
        },
        async crear(datos) {
            capturado.crear = datos;
            return 10;
        },
        async listar() {
            return [];
        },
        async obtenerDetalle() {
            return detalle ?? detalleFixture();
        },
        async actualizarDireccion(pedidoId, direccion, opciones) {
            capturado.actualizarDireccion = { pedidoId, direccion, opciones };
        },
        async registrarGeocodificacion(datos) {
            capturado.geocodificacion = datos;
        },
        async confirmarDireccion(datos) {
            capturado.confirmacion = datos;
        },
    };
}

const clientesFalsos = {
    async buscarPorId(id) {
        return id === 1 ? { id: 1, nombre: "Cliente" } : null;
    },
};

test("crear pedido guarda un borrador EN STOCK con canal, observaciones y sin duplicados", async () => {
    const pedidos = reposPedidosFalsos();
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    const resultado = await servicio.crear(
        {
            cliente_id: 1, importe_base: '100.00',
            canal_origen: CANALES.WHATSAPP,
            observaciones: "Dejar en portería",
            direccion: { calle: "Av. Corrientes", altura: "1234", localidad: "CABA" },
        },
        7
    );

    assert.equal(pedidos.capturado.crear.estado, ESTADO_INICIAL);
    assert.equal(pedidos.capturado.crear.clienteId, 1);
    assert.equal(pedidos.capturado.crear.canalOrigen, CANALES.WHATSAPP);
    assert.equal(pedidos.capturado.crear.observaciones, "Dejar en portería");
    assert.equal(pedidos.capturado.crear.creadoPor, 7);
    assert.equal(pedidos.capturado.crear.direccion.direccion_original, "Av. Corrientes 1234 CABA");
    assert.deepEqual(resultado.posiblesDuplicados, []);
});

test("crear pedido sin canal usa la carga manual como origen", async () => {
    const pedidos = reposPedidosFalsos();
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    await servicio.crear({ cliente_id: 1, importe_base: '100.00', direccion: { calle: "Av. Corrientes" } }, 7);

    assert.equal(pedidos.capturado.crear.canalOrigen, CANAL_PREDETERMINADO);
    assert.equal(pedidos.capturado.crear.observaciones, null);
});

function candidatoDuplicado(overrides = {}) {
    return {
        id: 3,
        codigo: "P-3",
        estado: "EN STOCK",
        created_at: "2026-10-20T12:00:00.000Z",
        direccion_original: "Av. H. Yrigoyen 1234 CABA",
        calle: "Avenida H. Yrigoyen",
        altura: "1234",
        localidad: "CABA",
        provincia: "CABA",
        ...overrides,
    };
}

test("un pedido con la misma dirección normalizada no se crea sin confirmación explícita", async () => {
    const pedidos = reposPedidosFalsos({ candidatos: [candidatoDuplicado()] });
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    await assert.rejects(
        () => servicio.crear({
            cliente_id: 1, importe_base: '100.00',
            direccion: { calle: "Av. Hipólito Yrigoyen", altura: "1234", localidad: "CABA", provincia: "CABA" },
        }, 7),
        (error) => {
            assert.equal(error.statusCode, 409);
            assert.equal(error.codigo, "DUPLICADO_POTENCIAL");
            assert.equal(error.posiblesDuplicados.length, 1);
            assert.equal(error.posiblesDuplicados[0].id, 3);
            return true;
        }
    );

    assert.equal(pedidos.capturado.crear, null);
    assert.deepEqual(pedidos.capturado.candidatos, { clienteId: 1, ventanaHoras: 24 });
});

test("confirmar el duplicado crea el pedido y devuelve el existente para mostrarlo", async () => {
    const pedidos = reposPedidosFalsos({ candidatos: [candidatoDuplicado()] });
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    const resultado = await servicio.crear({
        cliente_id: 1, importe_base: '100.00',
        direccion: { calle: "Avenida Hipólito Yrigoyen", altura: "1234", localidad: "CABA", provincia: "CABA" },
        confirmar_duplicado: true,
    }, 7);

    assert.equal(pedidos.capturado.crear.clienteId, 1);
    assert.deepEqual(resultado.posiblesDuplicados, [{
        id: 3,
        codigo: "P-3",
        estado: "EN STOCK",
        created_at: "2026-10-20T12:00:00.000Z",
        direccion_original: "Av. H. Yrigoyen 1234 CABA",
    }]);
});

test("una altura distinta no se considera el mismo domicilio", async () => {
    const pedidos = reposPedidosFalsos({ candidatos: [candidatoDuplicado()] });
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    await servicio.crear({
        cliente_id: 1, importe_base: '100.00',
        direccion: { calle: "Av. H. Yrigoyen", altura: "9999", localidad: "CABA", provincia: "CABA" },
    }, 7);

    assert.equal(pedidos.capturado.crear.clienteId, 1);
});

test("una localidad distinta no se considera el mismo domicilio", async () => {
    const pedidos = reposPedidosFalsos({ candidatos: [candidatoDuplicado()] });
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    await servicio.crear({
        cliente_id: 1, importe_base: '100.00',
        direccion: { calle: "Av. H. Yrigoyen", altura: "1234", localidad: "Córdoba", provincia: "Córdoba" },
    }, 7);

    assert.equal(pedidos.capturado.crear.clienteId, 1);
});

test("sin altura no se arriesga un aviso de duplicado", async () => {
    const pedidos = reposPedidosFalsos({ candidatos: [candidatoDuplicado({ altura: null })] });
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    await servicio.crear({
        cliente_id: 1, importe_base: '100.00',
        direccion: { calle: "Av. H. Yrigoyen", localidad: "CABA", provincia: "CABA" },
    }, 7);

    assert.equal(pedidos.capturado.crear.clienteId, 1);
});

test("la ventana de duplicados se puede configurar", async () => {
    const pedidos = reposPedidosFalsos();
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos, ventanaDuplicadosHoras: 6 });

    await servicio.crear({
        cliente_id: 1, importe_base: '100.00',
        direccion: { calle: "Av. Corrientes", altura: "1234" },
    }, 7);

    assert.equal(pedidos.capturado.candidatos.ventanaHoras, 6);
});

test("la comparación normalizada reconoce iniciales y formatos equivalentes", () => {
    const abreviada = claveDireccion({ calle: "Av. H. Yrigoyen", altura: "1234", localidad: "CABA", provincia: "CABA" });
    const completa = claveDireccion({ calle: "Avenida Hipólito Yrigoyen", altura: "1234", localidad: "CABA", provincia: "CABA" });
    const distinta = claveDireccion({ calle: "Avenida Hipólito Yrigoyen", altura: "1235", localidad: "CABA", provincia: "CABA" });
    const capital = claveDireccion({ calle: "Av. H. Yrigoyen", altura: "1234", localidad: "Capital Federal", provincia: "CABA" });

    assert.equal(direccionEquivalente(abreviada, completa), true);
    assert.equal(direccionEquivalente(abreviada, distinta), false);
    assert.equal(direccionEquivalente(abreviada, capital), true);
});

test("la ventana por defecto es de 24 horas y se lee del entorno", () => {
    const base = { DB_HOST: "127.0.0.1", DB_USER: "usuario", DB_NAME: "mandatodo", JWT_SECRET: "secreto-de-prueba" };

    assert.equal(loadEnv(base).duplicados.ventanaHoras, 24);
    assert.equal(loadEnv({ ...base, DUPLICADOS_VENTANA_HORAS: "6" }).duplicados.ventanaHoras, 6);
    assert.equal(loadEnv({ ...base, DUPLICADOS_VENTANA_HORAS: "0" }).duplicados.ventanaHoras, 24);
});

test("el error de duplicado y su middleware conservan los pedidos existentes", () => {
    const existente = { id: 3, codigo: "P-3", estado: "EN STOCK" };
    const error = conflictoDuplicado("Ya existe un pedido con la misma dirección.", [existente]);

    assert.equal(error.statusCode, 409);
    assert.equal(error.codigo, "DUPLICADO_POTENCIAL");

    const res = {
        statusCode: 200,
        body: null,
        status(codigo) {
            this.statusCode = codigo;
            return this;
        },
        json(cuerpo) {
            this.body = cuerpo;
            return this;
        },
    };
    errorHandler(error, {}, res, () => {});

    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body.error.posiblesDuplicados, [existente]);
});

test("la consulta de candidatos filtra por cliente y ventana, sin excluir estados", async () => {
    let consulta = null;
    const db = {
        async query(sql, valores) {
            consulta = { sql, valores };
            return [[candidatoDuplicado()]];
        },
    };
    const repositorio = createPedidoRepository(db);

    const filas = await repositorio.buscarCandidatosDuplicados({ clienteId: 1, ventanaHoras: 12 });

    assert.equal(filas.length, 1);
    assert.match(consulta.sql, /p\.cliente_id = \?/);
    assert.match(consulta.sql, /INTERVAL \? HOUR/);
    assert.doesNotMatch(consulta.sql, /PAGADO/);
    assert.deepEqual(consulta.valores, [1, 12, 0]);
});

test("el listado filtra por estado, cliente y rango de fechas con SQL parametrizado", async () => {
    let consulta = null;
    const db = {
        async query(sql, valores) {
            consulta = { sql, valores };
            return [[]];
        },
    };
    const repositorio = createPedidoRepository(db);

    await repositorio.listar({
        estado: "EN STOCK",
        cliente: "20.123",
        fechaDesde: "2026-10-01",
        fechaHasta: "2026-10-21",
    });

    assert.match(consulta.sql, /p\.estado = \?/);
    assert.match(consulta.sql, /c\.nombre LIKE \?/);
    assert.match(consulta.sql, /c\.dni LIKE \?/);
    assert.match(consulta.sql, /p\.created_at >= \?/);
    assert.match(consulta.sql, /p\.created_at < DATE_ADD\(\?, INTERVAL 1 DAY\)/);
    assert.match(consulta.sql, /ORDER BY p\.created_at DESC, p\.id DESC/);
    assert.deepEqual(consulta.valores, [
        "EN STOCK",
        "%20.123%", "%20.123%", "%20.123%", "%20.123%",
        "%20123%", "%20123%",
        "2026-10-01",
        "2026-10-21",
    ]);
});

test("el listado sin filtros no agrega un WHERE", async () => {
    let consulta = null;
    const db = {
        async query(sql, valores) {
            consulta = { sql, valores };
            return [[]];
        },
    };
    const repositorio = createPedidoRepository(db);

    await repositorio.listar();

    assert.doesNotMatch(consulta.sql, /WHERE/);
    assert.deepEqual(consulta.valores, []);
});

test("el controlador no acepta un estado impuesto por el cliente", async () => {
    let capturado = null;
    const pedidoService = {
        async crear(datos, usuarioId) {
            capturado = { datos, usuarioId };
            return { pedido: { id: 1 }, posiblesDuplicados: [] };
        },
    };
    const controller = createPedidosController({ pedidoService });
    const res = {
        statusCode: 200,
        body: null,
        status(codigo) {
            this.statusCode = codigo;
            return this;
        },
        json(cuerpo) {
            this.body = cuerpo;
            return this;
        },
    };

    await controller.crear(
        {
            body: {
                cliente_id: 1, importe_base: '100.00',
                canal_origen: CANALES.CORREO,
                observaciones: "  Dejar en recepción  ",
                confirmar_duplicado: true,
                direccion: { calle: "Av. Corrientes", altura: "1234" },
                estado: "PAGADO",
            },
            usuario: { id: 7 },
        },
        res
    );

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, { pedido: { id: 1 }, posiblesDuplicados: [] });
    assert.equal(capturado.datos.estado, undefined);
    assert.equal(capturado.datos.canal_origen, CANALES.CORREO);
    assert.equal(capturado.datos.observaciones, "Dejar en recepción");
    assert.equal(capturado.datos.confirmar_duplicado, true);
    assert.equal(capturado.usuarioId, 7);
});

test("el controlador traslada los filtros del listado y normaliza el texto de cliente", async () => {
    let capturado = null;
    const controller = createPedidosController({
        pedidoService: {
            async listar(filtros) {
                capturado = filtros;
                return [{ id: 1 }];
            },
        },
    });
    const res = {
        body: null,
        json(cuerpo) {
            this.body = cuerpo;
            return this;
        },
    };

    await controller.listar({
        query: {
            estado: "EN STOCK",
            cliente: "  Juan Pérez  ",
            fecha_desde: "2026-10-01",
            fecha_hasta: "2026-10-21",
        },
    }, res);

    assert.deepEqual(capturado, {
        estado: "EN STOCK",
        estadoValidacion: undefined,
        cliente: "Juan Pérez",
        fechaDesde: "2026-10-01",
        fechaHasta: "2026-10-21",
    });
    assert.deepEqual(res.body, { pedidos: [{ id: 1 }] });
});

test("el controlador rechaza fechas inválidas o un rango invertido", async () => {
    const controller = createPedidosController({
        pedidoService: {
            async listar() {
                throw new Error("no debería llegar al servicio");
            },
        },
    });

    await assert.rejects(
        () => controller.listar({ query: { fecha_desde: "2026-02-30" } }, {}),
        (error) => error.codigo === "DATOS_INVALIDOS" && Boolean(error.campos.fecha_desde)
    );
    await assert.rejects(
        () => controller.listar({ query: { fecha_desde: "2026-10-21", fecha_hasta: "2026-10-20" } }, {}),
        (error) => error.codigo === "DATOS_INVALIDOS" && Boolean(error.campos.fecha_hasta)
    );
});

test("el controlador rechaza una confirmación de duplicado que no sea booleana", async () => {
    const controller = createPedidosController({
        pedidoService: {
            async crear() {
                throw new Error("no debería llegar al servicio");
            },
        },
    });

    await assert.rejects(
        () => controller.crear({
            body: {
                cliente_id: 1, importe_base: '100.00',
                confirmar_duplicado: "true",
                direccion: { calle: "Av. Corrientes", altura: "1234" },
            },
            usuario: { id: 7 },
        }, {}),
        (error) => error.codigo === "DATOS_INVALIDOS"
    );
});

test("crear pedido con cliente inexistente se rechaza", async () => {
    const servicio = createPedidoService({ pedidos: reposPedidosFalsos(), clientes: clientesFalsos });
    await assert.rejects(
        () => servicio.crear({ cliente_id: 99, importe_base: '100.00', direccion: { calle: "X" } }, 1),
        (error) => error.codigo === "DATOS_INVALIDOS"
    );
});

test("cambiar la dirección de un pedido confirmado invalida la confirmación", async () => {
    const pedidos = reposPedidosFalsos({ detalle: detalleFixture({ estado_validacion: "CONFIRMADA", direccion_validada: 1 }) });
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    const resultado = await servicio.actualizarDireccion(10, { calle: "Av. de Mayo", altura: "450" });

    assert.equal(resultado.invalidada, true);
    assert.equal(pedidos.capturado.actualizarDireccion.opciones.invalidar, true);
});

test("no se puede confirmar una dirección todavía PENDIENTE", async () => {
    const pedidos = reposPedidosFalsos({ detalle: detalleFixture({ estado_validacion: "PENDIENTE" }) });
    const servicio = createGeocodeService({ pedidos, adapter: { nombre: "falso", async geocodificar() { return { resultado: "ERROR" }; } } });

    await assert.rejects(() => servicio.confirmar(10, 3), (error) => error.codigo === "CONFLICTO");
});

test("confirmar una dirección VALIDA la deja CONFIRMADA", async () => {
    const pedidos = reposPedidosFalsos({ detalle: detalleFixture({ estado_validacion: "VALIDA", latitud: "-34.6", longitud: "-58.4", nivel_confianza: "ALTO" }) });
    const servicio = createGeocodeService({ pedidos, adapter: { nombre: "falso", async geocodificar() { return { resultado: "OK" }; } } });

    await servicio.confirmar(10, 3);

    assert.equal(pedidos.capturado.confirmacion.pedidoId, 10);
    assert.equal(pedidos.capturado.confirmacion.usuarioId, 3);
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

async function iniciarApp(db = fakeDbListaLimpia()) {
    const app = createApp({ db, config: { jwt: { secret: "secreto-de-prueba", expiraEn: "1h" }, geocode: {} } });
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    return { server, baseUrl: `http://127.0.0.1:${server.address().port}` };
}

function cerrarServidor(server) {
    return new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
    });
}

test("pedidos: sin token 401, chofer 403, administrador 200", async () => {
    const { server, baseUrl } = await iniciarApp();
    try {
        const sinToken = await fetch(`${baseUrl}/api/pedidos`, { signal: AbortSignal.timeout(3000) });
        assert.equal(sinToken.status, 401);

        const tokenChofer = jwt.sign({ sub: 3, rol: "CHOFER", email: "chofer@test.com" }, "secreto-de-prueba", { expiresIn: "1h" });
        const comoChofer = await fetch(`${baseUrl}/api/pedidos`, { headers: { authorization: `Bearer ${tokenChofer}` }, signal: AbortSignal.timeout(3000) });
        assert.equal(comoChofer.status, 403);

        const tokenAdmin = jwt.sign({ sub: 1, rol: "ADMINISTRADOR", email: "admin@test.com" }, "secreto-de-prueba", { expiresIn: "1h" });
        const comoAdmin = await fetch(`${baseUrl}/api/pedidos`, { headers: { authorization: `Bearer ${tokenAdmin}` }, signal: AbortSignal.timeout(3000) });
        assert.equal(comoAdmin.status, 200);
        assert.deepEqual((await comoAdmin.json()).pedidos, []);
    } finally {
        await cerrarServidor(server);
    }
});

test("pedidos: el listado HTTP aplica filtros y rechaza un rango invertido", async () => {
    let consulta = null;
    const db = {
        async query(sql, valores) {
            consulta = { sql, valores };
            return [[]];
        },
    };
    const { server, baseUrl } = await iniciarApp(db);
    try {
        const tokenAdmin = jwt.sign({ sub: 1, rol: "ADMINISTRADOR", email: "admin@test.com" }, "secreto-de-prueba", { expiresIn: "1h" });
        const filtrada = await fetch(
            `${baseUrl}/api/pedidos?estado=${encodeURIComponent("EN STOCK")}&cliente=20.123&fecha_desde=2026-10-01&fecha_hasta=2026-10-21`,
            { headers: { authorization: `Bearer ${tokenAdmin}` }, signal: AbortSignal.timeout(3000) }
        );

        assert.equal(filtrada.status, 200);
        assert.deepEqual((await filtrada.json()).pedidos, []);
        assert.match(consulta.sql, /p\.estado = \?/);
        assert.match(consulta.sql, /c\.nombre LIKE \?/);
        assert.match(consulta.sql, /p\.created_at >= \?/);
        assert.match(consulta.sql, /p\.created_at < DATE_ADD\(\?, INTERVAL 1 DAY\)/);

        const invertida = await fetch(
            `${baseUrl}/api/pedidos?fecha_desde=2026-10-21&fecha_hasta=2026-10-20`,
            { headers: { authorization: `Bearer ${tokenAdmin}` }, signal: AbortSignal.timeout(3000) }
        );
        assert.equal(invertida.status, 400);
        const cuerpo = await invertida.json();
        assert.equal(cuerpo.error.codigo, "DATOS_INVALIDOS");
        assert.ok(cuerpo.error.campos.fecha_hasta);
    } finally {
        await cerrarServidor(server);
    }
});

test("pedidos: el chofer no puede crear pedidos", async () => {
    const { server, baseUrl } = await iniciarApp();
    try {
        const tokenChofer = jwt.sign({ sub: 3, rol: "CHOFER", email: "chofer@test.com" }, "secreto-de-prueba", { expiresIn: "1h" });
        const respuesta = await fetch(`${baseUrl}/api/pedidos`, {
            method: "POST",
            headers: { authorization: `Bearer ${tokenChofer}`, "content-type": "application/json" },
            body: JSON.stringify({ cliente_id: 1, importe_base: '100.00', canal_origen: "WHATSAPP", direccion: { calle: "Av. Corrientes" } }),
            signal: AbortSignal.timeout(3000),
        });

        assert.equal(respuesta.status, 403);
    } finally {
        await cerrarServidor(server);
    }
});

test("pedidos: un canal de origen fuera del catálogo responde 400", async () => {
    const { server, baseUrl } = await iniciarApp();
    try {
        const tokenAdmin = jwt.sign({ sub: 1, rol: "ADMINISTRADOR", email: "admin@test.com" }, "secreto-de-prueba", { expiresIn: "1h" });
        const respuesta = await fetch(`${baseUrl}/api/pedidos`, {
            method: "POST",
            headers: { authorization: `Bearer ${tokenAdmin}`, "content-type": "application/json" },
            body: JSON.stringify({ cliente_id: 1, importe_base: '100.00', canal_origen: "PALOMA", direccion: { calle: "Av. Corrientes" } }),
            signal: AbortSignal.timeout(3000),
        });

        assert.equal(respuesta.status, 400);
        const cuerpo = await respuesta.json();
        assert.equal(cuerpo.error.codigo, "DATOS_INVALIDOS");
        assert.equal(cuerpo.error.campos.canal_origen, "Elegí un canal de origen válido.");
    } finally {
        await cerrarServidor(server);
    }
});
