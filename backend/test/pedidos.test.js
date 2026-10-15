const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const jwt = require("jsonwebtoken");
const createApp = require("../app");
const { ESTADO_INICIAL } = require("../src/constants/estados");
const { createPedidoService } = require("../src/services/PedidoService");
const { createGeocodeService } = require("../src/services/GeocodeService");

function detalleFixture(overrides = {}) {
    return {
        id: 10,
        direccion_id: 5,
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

function reposPedidosFalsos({ detalle } = {}) {
    const capturado = { crear: null, actualizarDireccion: null, geocodificacion: null, confirmacion: null };
    return {
        capturado,
        async detectarDuplicados() {
            return [];
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

test("crear pedido guarda un borrador EN STOCK sin validar y avisa duplicados", async () => {
    const pedidos = reposPedidosFalsos();
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    const resultado = await servicio.crear(
        { cliente_id: 1, direccion: { calle: "Av. Corrientes", altura: "1234", localidad: "CABA" } },
        7
    );

    assert.equal(pedidos.capturado.crear.estado, ESTADO_INICIAL);
    assert.equal(pedidos.capturado.crear.clienteId, 1);
    assert.equal(pedidos.capturado.crear.creadoPor, 7);
    assert.equal(pedidos.capturado.crear.direccion.direccion_original, "Av. Corrientes 1234 CABA");
    assert.deepEqual(resultado.posiblesDuplicados, []);
});

test("crear pedido con cliente inexistente se rechaza", async () => {
    const servicio = createPedidoService({ pedidos: reposPedidosFalsos(), clientes: clientesFalsos });
    await assert.rejects(
        () => servicio.crear({ cliente_id: 99, direccion: { calle: "X" } }, 1),
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

test("reenviar la misma dirección no invalida una confirmación vigente", async () => {
    const pedidos = reposPedidosFalsos({ detalle: detalleFixture({ estado_validacion: "CONFIRMADA", direccion_validada: 1 }) });
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    const resultado = await servicio.actualizarDireccion(10, { calle: "Av. Corrientes", altura: "1234" });

    assert.equal(resultado.invalidada, false);
    assert.equal(pedidos.capturado.actualizarDireccion.opciones.invalidar, false);
});

test("geocodificar un resultado exacto deja la dirección VALIDA sin confirmar", async () => {
    const pedidos = reposPedidosFalsos();
    const adapter = { nombre: "falso", async geocodificar() { return { resultado: "OK", latitud: -34.6, longitud: -58.4, nivelConfianza: "ALTO" }; } };
    const servicio = createGeocodeService({ pedidos, adapter });

    const salida = await servicio.geocodificar(10, 3);

    assert.equal(salida.resultado, "OK");
    assert.equal(pedidos.capturado.geocodificacion.estadoValidacion, "VALIDA");
    assert.equal(pedidos.capturado.geocodificacion.latitud, -34.6);
});

test("geocodificar sin resultados deja la dirección PENDIENTE y sin coordenadas", async () => {
    const pedidos = reposPedidosFalsos();
    const adapter = { nombre: "falso", async geocodificar() { return { resultado: "ZERO_RESULTS", motivo: "No se encontró." }; } };
    const servicio = createGeocodeService({ pedidos, adapter });

    const salida = await servicio.geocodificar(10, 3);

    assert.equal(salida.resultado, "ZERO_RESULTS");
    assert.equal(pedidos.capturado.geocodificacion.estadoValidacion, "PENDIENTE");
    assert.equal(pedidos.capturado.geocodificacion.latitud, null);
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

async function iniciarApp() {
    const app = createApp({ db: fakeDbListaLimpia(), config: { jwt: { secret: "secreto-de-prueba", expiraEn: "1h" }, geocode: {} } });
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    return { server, baseUrl: `http://127.0.0.1:${server.address().port}` };
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
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
            server.closeAllConnections();
        });
    }
});
