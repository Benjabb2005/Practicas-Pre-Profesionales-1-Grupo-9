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
        calle: "Avenida Corrientes",
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
        async buscarCandidatosDuplicados() {
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

test("crear pedido guarda el estado que decide el validador y avisa los problemas", async () => {
    const pedidos = reposPedidosFalsos();
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    const resultado = await servicio.crear(
        { cliente_id: 1, importe_base: '100.00', direccion: { calle: "Av. Corrientes", altura: "1234", localidad: "CABA" } },
        7
    );

    assert.equal(pedidos.capturado.crear.estado, ESTADO_INICIAL);
    assert.equal(pedidos.capturado.crear.clienteId, 1);
    assert.equal(pedidos.capturado.crear.creadoPor, 7);
    assert.equal(pedidos.capturado.crear.direccion.calle, "Avenida Corrientes");
    assert.equal(pedidos.capturado.crear.direccion.direccion_original, "Av. Corrientes 1234 CABA");
    assert.equal(pedidos.capturado.crear.direccion.estado_validacion, "CON_ADVERTENCIAS");
    assert.deepEqual(resultado.problemas.map((problema) => problema.campo), ["provincia"]);
    assert.equal(resultado.problemas[0].gravedad, "ERROR");
    assert.deepEqual(resultado.posiblesDuplicados, []);
});

test("crear pedido con dirección completa la guarda VALIDA y normalizada", async () => {
    const pedidos = reposPedidosFalsos();
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    const resultado = await servicio.crear(
        {
            cliente_id: 1, importe_base: '100.00',
            direccion: {
                calle: "av. corrientes",
                altura: "1.234",
                localidad: "caba",
                provincia: "caba",
                codigo_postal: "c1043abc",
            },
        },
        7
    );

    const direccion = pedidos.capturado.crear.direccion;
    assert.equal(direccion.calle, "Avenida Corrientes");
    assert.equal(direccion.altura, "1234");
    assert.equal(direccion.localidad, "CABA");
    assert.equal(direccion.provincia, "Ciudad Autónoma de Buenos Aires");
    assert.equal(direccion.codigo_postal, "C1043ABC");
    assert.equal(direccion.estado_validacion, "VALIDA");
    assert.deepEqual(resultado.problemas, []);
});

test("crear pedido sin importe o con importe vacío lo guarda como NULL", async () => {
    for (const importe of [undefined, ""]) {
        const pedidos = reposPedidosFalsos();
        const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });
        const datos = {
            cliente_id: 1,
            direccion: { calle: "Av. Corrientes" },
        };
        if (importe !== undefined) datos.importe_base = importe;

        await servicio.crear(datos, 7);

        assert.equal(pedidos.capturado.crear.importeBase, null);
    }
});

test("crear pedido sigue rechazando importes cero, negativos y mal escritos", async () => {
    const servicio = createPedidoService({ pedidos: reposPedidosFalsos(), clientes: clientesFalsos });

    for (const importe of ["0", "-1.00", "12,50"]) {
        await assert.rejects(
            () => servicio.crear({
                cliente_id: 1,
                importe_base: importe,
                direccion: { calle: "Av. Corrientes" },
            }, 7),
            (error) => error.codigo === "DATOS_INVALIDOS"
        );
    }
});

test("obtener calcula los problemas sobre la dirección guardada sin persistirlos", async () => {
    const pedidos = reposPedidosFalsos({ detalle: detalleFixture({ provincia: "" }) });
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    const detalle = await servicio.obtener(10);

    assert.equal(detalle.estado_validacion, "PENDIENTE");
    assert.deepEqual(detalle.problemas.map((problema) => problema.campo), ["provincia"]);
    assert.equal(detalle.problemas[0].gravedad, "ERROR");
    assert.equal(pedidos.capturado.actualizarDireccion, null);
    assert.equal(pedidos.capturado.crear, null);
});

test("obtener devuelve problemas vacíos cuando la dirección guardada es válida", async () => {
    const pedidos = reposPedidosFalsos();
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    const detalle = await servicio.obtener(10);

    assert.deepEqual(detalle.problemas, []);
});

test("crear pedido con cliente inexistente se rechaza", async () => {
    const servicio = createPedidoService({ pedidos: reposPedidosFalsos(), clientes: clientesFalsos });
    await assert.rejects(
        () => servicio.crear({ cliente_id: 99, importe_base: '100.00', direccion: { calle: "X" } }, 1),
        (error) => error.codigo === "DATOS_INVALIDOS"
    );
});

const DIRECCION_COMPLETA = {
    calle: "Avenida Corrientes",
    altura: "1234",
    localidad: "CABA",
    provincia: "CABA",
    codigo_postal: "1043",
};

test("cambiar la dirección de un pedido confirmado invalida y descarta las coordenadas", async () => {
    const pedidos = reposPedidosFalsos({ detalle: detalleFixture({ estado_validacion: "CONFIRMADA", direccion_validada: 1 }) });
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    const resultado = await servicio.actualizarDireccion(10, { calle: "Av. de Mayo", altura: "450" });

    assert.equal(resultado.invalidada, true);
    assert.equal(pedidos.capturado.actualizarDireccion.opciones.invalidar, true);
    assert.equal(pedidos.capturado.actualizarDireccion.opciones.descartarCoordenadas, true);
    assert.equal(pedidos.capturado.actualizarDireccion.direccion.estado_validacion, "CON_ADVERTENCIAS");
});

test("reenviar la misma dirección no invalida una confirmación vigente", async () => {
    const pedidos = reposPedidosFalsos({ detalle: detalleFixture({ estado_validacion: "CONFIRMADA", direccion_validada: 1 }) });
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    const resultado = await servicio.actualizarDireccion(10, DIRECCION_COMPLETA);

    assert.equal(resultado.invalidada, false);
    assert.equal(pedidos.capturado.actualizarDireccion.opciones.invalidar, false);
    assert.equal(pedidos.capturado.actualizarDireccion.opciones.descartarCoordenadas, false);
    assert.equal(pedidos.capturado.actualizarDireccion.direccion.estado_validacion, "CONFIRMADA");
});

test("reenviar la misma dirección escrita con abreviaturas no invalida ni descarta coordenadas", async () => {
    const pedidos = reposPedidosFalsos({ detalle: detalleFixture({ estado_validacion: "CONFIRMADA", direccion_validada: 1 }) });
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    const resultado = await servicio.actualizarDireccion(10, {
        ...DIRECCION_COMPLETA,
        calle: "av. corrientes",
        localidad: "caba",
        provincia: "caba",
    });

    assert.equal(resultado.invalidada, false);
    assert.equal(pedidos.capturado.actualizarDireccion.opciones.descartarCoordenadas, false);
    assert.equal(pedidos.capturado.actualizarDireccion.direccion.calle, "Avenida Corrientes");
    assert.equal(pedidos.capturado.actualizarDireccion.direccion.estado_validacion, "CONFIRMADA");
});

test("una dirección guardada antes de normalizar no se invalida al reenviarla igual", async () => {
    const pedidos = reposPedidosFalsos({
        detalle: detalleFixture({ estado_validacion: "CONFIRMADA", direccion_validada: 1, calle: "Av. Corrientes" }),
    });
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    const resultado = await servicio.actualizarDireccion(10, { ...DIRECCION_COMPLETA, calle: "Av. Corrientes" });

    assert.equal(resultado.invalidada, false);
    assert.equal(pedidos.capturado.actualizarDireccion.opciones.descartarCoordenadas, false);
});

test("corregir una dirección VALIDA ya geocodificada descarta las coordenadas viejas", async () => {
    const pedidos = reposPedidosFalsos({
        detalle: detalleFixture({
            estado_validacion: "VALIDA",
            latitud: "-34.6",
            longitud: "-58.4",
            nivel_confianza: "ALTO",
        }),
    });
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    const resultado = await servicio.actualizarDireccion(10, { ...DIRECCION_COMPLETA, altura: "1300" });

    assert.equal(resultado.invalidada, false);
    assert.equal(pedidos.capturado.actualizarDireccion.opciones.invalidar, false);
    assert.equal(pedidos.capturado.actualizarDireccion.opciones.descartarCoordenadas, true);
    assert.equal(pedidos.capturado.actualizarDireccion.direccion.estado_validacion, "VALIDA");
});

test("reenviar una dirección VALIDA geocodificada sin cambios conserva las coordenadas", async () => {
    const pedidos = reposPedidosFalsos({
        detalle: detalleFixture({
            estado_validacion: "VALIDA",
            latitud: "-34.6",
            longitud: "-58.4",
            nivel_confianza: "ALTO",
        }),
    });
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    const resultado = await servicio.actualizarDireccion(10, DIRECCION_COMPLETA);

    assert.equal(resultado.invalidada, false);
    assert.equal(pedidos.capturado.actualizarDireccion.opciones.descartarCoordenadas, false);
    assert.equal(pedidos.capturado.actualizarDireccion.direccion.estado_validacion, "VALIDA");
});

function detalleValido(overrides = {}) {
    return detalleFixture({ estado_validacion: "VALIDA", ...overrides });
}

test("geocodificar un resultado exacto guarda coordenadas sin cambiar el estado", async () => {
    const pedidos = reposPedidosFalsos({ detalle: detalleValido() });
    const adapter = { nombre: "falso", async geocodificar() { return { resultado: "OK", latitud: -34.6, longitud: -58.4, nivelConfianza: "ALTO" }; } };
    const servicio = createGeocodeService({ pedidos, adapter });

    const salida = await servicio.geocodificar(10, 3);

    assert.equal(salida.resultado, "OK");
    assert.equal(pedidos.capturado.geocodificacion.latitud, -34.6);
    assert.equal(pedidos.capturado.geocodificacion.longitud, -58.4);
    assert.equal(pedidos.capturado.geocodificacion.nivelConfianza, "ALTO");
    assert.equal(pedidos.capturado.geocodificacion.estadoValidacion, undefined);
});

test("una coincidencia aproximada guarda coordenadas MEDIAS sin cambiar el estado", async () => {
    const pedidos = reposPedidosFalsos({ detalle: detalleValido() });
    const adapter = { nombre: "falso", async geocodificar() { return { resultado: "APPROXIMATE", latitud: -34.6, longitud: -58.4 }; } };
    const servicio = createGeocodeService({ pedidos, adapter });

    await servicio.geocodificar(10, 3);

    assert.equal(pedidos.capturado.geocodificacion.nivelConfianza, "MEDIO");
    assert.equal(pedidos.capturado.geocodificacion.estadoValidacion, undefined);
});

test("geocodificar sin resultados no cambia el estado y deja sin coordenadas", async () => {
    const pedidos = reposPedidosFalsos({ detalle: detalleValido() });
    const adapter = { nombre: "falso", async geocodificar() { return { resultado: "ZERO_RESULTS", motivo: "No se encontró." }; } };
    const servicio = createGeocodeService({ pedidos, adapter });

    const salida = await servicio.geocodificar(10, 3);

    assert.equal(salida.resultado, "ZERO_RESULTS");
    assert.equal(pedidos.capturado.geocodificacion.latitud, null);
    assert.equal(pedidos.capturado.geocodificacion.nivelConfianza, null);
    assert.equal(pedidos.capturado.geocodificacion.estadoValidacion, undefined);
});

test("no se geocodifica una dirección CON_ADVERTENCIAS", async () => {
    let llamado = false;
    const pedidos = reposPedidosFalsos({ detalle: detalleFixture({ estado_validacion: "CON_ADVERTENCIAS" }) });
    const adapter = { nombre: "falso", async geocodificar() { llamado = true; return { resultado: "OK" }; } };
    const servicio = createGeocodeService({ pedidos, adapter });

    await assert.rejects(
        () => servicio.geocodificar(10, 3),
        (error) => error.codigo === "CONFLICTO" && /errores para revisar/.test(error.message)
    );
    assert.equal(llamado, false);
});

test("una dirección ya confirmada no se vuelve a geocodificar", async () => {
    let llamado = false;
    const pedidos = reposPedidosFalsos({
        detalle: detalleFixture({ estado_validacion: "CONFIRMADA", direccion_validada: 1, latitud: "-34.6", longitud: "-58.4" }),
    });
    const adapter = { nombre: "falso", async geocodificar() { llamado = true; return { resultado: "OK" }; } };
    const servicio = createGeocodeService({ pedidos, adapter });

    await assert.rejects(
        () => servicio.geocodificar(10, 3),
        (error) => error.codigo === "CONFLICTO" && error.message === "Esta dirección ya está confirmada."
    );
    assert.equal(llamado, false);
});

test("una dirección PENDIENTE heredada no se geocodifica y el mensaje dice qué hacer", async () => {
    const pedidos = reposPedidosFalsos({ detalle: detalleFixture({ estado_validacion: "PENDIENTE" }) });
    const servicio = createGeocodeService({ pedidos, adapter: { nombre: "falso", async geocodificar() { return { resultado: "OK" }; } } });

    await assert.rejects(
        () => servicio.geocodificar(10, 3),
        (error) => error.codigo === "CONFLICTO" && /todavía no fue revisada/.test(error.message)
    );
});

test("no se puede confirmar una dirección todavía PENDIENTE", async () => {
    const pedidos = reposPedidosFalsos({ detalle: detalleFixture({ estado_validacion: "PENDIENTE" }) });
    const servicio = createGeocodeService({ pedidos, adapter: { nombre: "falso", async geocodificar() { return { resultado: "ERROR" }; } } });

    await assert.rejects(() => servicio.confirmar(10, 3), (error) => error.codigo === "CONFLICTO");
});

test("no se puede confirmar una dirección CON_ADVERTENCIAS aunque tenga coordenadas", async () => {
    const pedidos = reposPedidosFalsos({
        detalle: detalleFixture({ estado_validacion: "CON_ADVERTENCIAS", latitud: "-34.6", longitud: "-58.4" }),
    });
    const servicio = createGeocodeService({ pedidos, adapter: { nombre: "falso", async geocodificar() { return { resultado: "OK" }; } } });

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
