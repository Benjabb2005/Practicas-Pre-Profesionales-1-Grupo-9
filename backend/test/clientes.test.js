const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const jwt = require("jsonwebtoken");
const createApp = require("../app");
const { createClienteService, normalizarDni } = require("../src/services/ClienteService");
const { createClienteRepository } = require("../src/repositories/ClienteRepository");
const { conflicto } = require("../src/lib/errors");

function reposClientesFalsos({
    porDni = null,
    coincidencias = [],
    porId = { nombre: "Cliente de prueba" },
    tienePedidos = false,
} = {}) {
    const capturado = {
        crear: null,
        actualizar: null,
        eliminar: null,
        coincidencias: null,
        dniBuscado: null,
        pedidosConsultados: null,
    };
    return {
        capturado,
        async listar() {
            return [];
        },
        async buscarPorId(id) {
            if (porId === null) return null;
            return { id, ...porId };
        },
        async buscarPorDni(dni) {
            capturado.dniBuscado = dni;
            return porDni;
        },
        async buscarCoincidencias(args) {
            capturado.coincidencias = args;
            return coincidencias;
        },
        async crear(datos) {
            capturado.crear = datos;
            return 42;
        },
        async actualizar(id, datos) {
            capturado.actualizar = { id, datos };
            return id;
        },
        async tienePedidos(id) {
            capturado.pedidosConsultados = id;
            return tienePedidos;
        },
        async eliminar(id) {
            capturado.eliminar = id;
            return 1;
        },
    };
}

test("los errores de aplicación conservan el mensaje público", () => {
    const error = conflicto("No se puede eliminar un cliente con pedidos asociados.");

    assert.equal(error.statusCode, 409);
    assert.equal(error.codigo, "CONFLICTO");
    assert.equal(error.mensaje, "No se puede eliminar un cliente con pedidos asociados.");
});

test("normalizarDni quita solo puntos, espacios y guiones", () => {
    assert.equal(normalizarDni("20.123.456"), "20123456");
    assert.equal(normalizarDni("20 123 456"), "20123456");
    assert.equal(normalizarDni("20-123-456"), "20123456");
    assert.equal(normalizarDni(" 20.123.456 "), "20123456");
    assert.equal(normalizarDni("20/123/456"), null);
    assert.equal(normalizarDni("20A123456"), null);
    assert.equal(normalizarDni(""), null);
});

test("crear cliente normaliza el DNI a solo dígitos y devuelve el registro", async () => {
    const clientes = reposClientesFalsos();
    const servicio = createClienteService({ clientes });

    const resultado = await servicio.crear({ nombre: "Juan Pérez", dni: "20.123.456", telefono: "11 5555-5555" });

    assert.equal(clientes.capturado.crear.dni, "20123456");
    assert.equal(clientes.capturado.crear.telefono, "1155555555");
    assert.equal(clientes.capturado.crear.nombre, "Juan Pérez");
    assert.equal(resultado.cliente.id, 42);
    assert.deepEqual(resultado.posiblesDuplicados, []);
});

test("crear cliente con DNI ya existente se rechaza como conflicto", async () => {
    const clientes = reposClientesFalsos({ porDni: { id: 5, nombre: "Otro", dni: "20123456" } });
    const servicio = createClienteService({ clientes });

    await assert.rejects(
        () => servicio.crear({ nombre: "Juan", dni: "20123456" }),
        (error) => error.codigo === "CONFLICTO"
    );
    assert.equal(clientes.capturado.crear, null);
});

test("el DNI repetido se detecta aunque cambien puntos, espacios o guiones", async () => {
    const clientes = reposClientesFalsos({ porDni: { id: 5, nombre: "Otro", dni: "20123456" } });
    const servicio = createClienteService({ clientes });

    for (const dni of ["20.123.456", "20 123 456", "20-123-456"]) {
        await assert.rejects(
            () => servicio.crear({ nombre: "Juan", dni }),
            (error) => error.codigo === "CONFLICTO"
        );
        assert.equal(clientes.capturado.dniBuscado, "20123456");
    }
    assert.equal(clientes.capturado.crear, null);
});

test("un DNI con letras u otros separadores no se recorta silenciosamente", async () => {
    const clientes = reposClientesFalsos();
    const servicio = createClienteService({ clientes });

    await assert.rejects(
        () => servicio.crear({ nombre: "Juan", dni: "20A123456" }),
        (error) => error.codigo === "DATOS_INVALIDOS"
    );
    assert.equal(clientes.capturado.crear, null);
});

test("un teléfono o email repetido se avisa sin fusionar ni bloquear el alta", async () => {
    const coincidencia = { id: 9, nombre: "Cliente previo", telefono: "1155555555" };
    const clientes = reposClientesFalsos({ coincidencias: [coincidencia] });
    const servicio = createClienteService({ clientes });

    const resultado = await servicio.crear({ nombre: "Juan", telefono: "1155555555" });

    assert.equal(resultado.cliente.id, 42);
    assert.deepEqual(resultado.posiblesDuplicados, [coincidencia]);
});

test("un DNI sin dígitos se rechaza como dato inválido", async () => {
    const servicio = createClienteService({ clientes: reposClientesFalsos() });

    await assert.rejects(
        () => servicio.crear({ nombre: "Juan", dni: "sin-numeros" }),
        (error) => error.codigo === "DATOS_INVALIDOS"
    );
});

test("actualizar normaliza los datos y excluye al propio cliente de las coincidencias", async () => {
    const clientes = reposClientesFalsos({
        porId: {
            nombre: "Cliente viejo",
            dni: "20123456",
            telefono: "1155555555",
            email: "viejo@mail.com",
            tipo: "particular",
            domicilio: null,
        },
    });
    const servicio = createClienteService({ clientes });

    const resultado = await servicio.actualizar(5, {
        nombre: "  Cliente nuevo  ",
        dni: "20.123.456",
        telefono: "11 4444-4444",
        email: " NUEVO@MAIL.COM ",
        tipo: "empresa",
        domicilio: "Av. Siempre Viva 742",
    });

    assert.equal(clientes.capturado.actualizar.id, 5);
    assert.equal(clientes.capturado.actualizar.datos.nombre, "Cliente nuevo");
    assert.equal(clientes.capturado.actualizar.datos.dni, "20123456");
    assert.equal(clientes.capturado.actualizar.datos.telefono, "1144444444");
    assert.equal(clientes.capturado.actualizar.datos.email, "nuevo@mail.com");
    assert.equal(clientes.capturado.actualizar.datos.tipo, "empresa");
    assert.equal(clientes.capturado.actualizar.datos.domicilio, "Av. Siempre Viva 742");
    assert.equal(clientes.capturado.coincidencias.exceptoId, 5);
    assert.equal(resultado.cliente.id, 5);
});

test("actualizar avisa coincidencias con otro cliente sin fusionar", async () => {
    const coincidencia = {
        id: 9,
        nombre: "Cliente previo",
        dni: "30111222",
        telefono: "1155555555",
        email: "previo@mail.com",
    };
    const clientes = reposClientesFalsos({
        porId: {
            nombre: "Cliente actual",
            dni: "20123456",
            telefono: "1100000000",
            email: "actual@mail.com",
            tipo: "particular",
            domicilio: null,
        },
        coincidencias: [coincidencia],
    });
    const servicio = createClienteService({ clientes });

    const resultado = await servicio.actualizar(5, {
        telefono: "11 5555-5555",
        email: " PREVIO@MAIL.COM ",
    });

    assert.equal(clientes.capturado.coincidencias.telefono, "1155555555");
    assert.equal(clientes.capturado.coincidencias.email, "previo@mail.com");
    assert.equal(clientes.capturado.coincidencias.exceptoId, 5);
    assert.deepEqual(resultado.posiblesDuplicados, [coincidencia]);
});

test("actualizar con el DNI de otro cliente se rechaza como conflicto", async () => {
    const clientes = reposClientesFalsos({
        porId: { nombre: "Cliente viejo", dni: "20123456" },
        porDni: { id: 9, nombre: "Otro", dni: "30111222" },
    });
    const servicio = createClienteService({ clientes });

    await assert.rejects(
        () => servicio.actualizar(5, { nombre: "Cliente nuevo", dni: "30.111.222" }),
        (error) => error.codigo === "CONFLICTO"
    );
    assert.equal(clientes.capturado.actualizar, null);
});

test("actualizar un cliente inexistente devuelve no encontrado", async () => {
    const servicio = createClienteService({ clientes: reposClientesFalsos({ porId: null }) });

    await assert.rejects(
        () => servicio.actualizar(99, { nombre: "Nadie" }),
        (error) => error.codigo === "NO_ENCONTRADO"
    );
});

test("eliminar un cliente con pedidos se rechaza sin borrar", async () => {
    const clientes = reposClientesFalsos({ tienePedidos: true });
    const servicio = createClienteService({ clientes });

    await assert.rejects(
        () => servicio.eliminar(5),
        (error) => error.codigo === "CONFLICTO"
    );
    assert.equal(clientes.capturado.pedidosConsultados, 5);
    assert.equal(clientes.capturado.eliminar, null);
});

test("eliminar un cliente sin pedidos lo borra", async () => {
    const clientes = reposClientesFalsos({ tienePedidos: false });
    const servicio = createClienteService({ clientes });

    const resultado = await servicio.eliminar(5);

    assert.deepEqual(resultado, { eliminado: true });
    assert.equal(clientes.capturado.eliminar, 5);
});

test("eliminar un cliente inexistente devuelve no encontrado", async () => {
    const servicio = createClienteService({ clientes: reposClientesFalsos({ porId: null }) });

    await assert.rejects(
        () => servicio.eliminar(99),
        (error) => error.codigo === "NO_ENCONTRADO"
    );
});

test("la búsqueda por DNI o teléfono usa también los dígitos del texto", async () => {
    const consultas = [];
    const db = {
        async query(sql, valores) {
            consultas.push({ sql, valores });
            return [[]];
        },
    };
    const repositorio = createClienteRepository(db);

    await repositorio.listar({ busqueda: "20.123.456" });

    assert.match(consultas[0].sql, /dni LIKE \?/);
    assert.match(consultas[0].sql, /telefono LIKE \?/);
    assert.equal(consultas[0].valores.filter((valor) => valor === "%20123456%").length, 2);
});

test("las coincidencias por teléfono o email excluyen al propio cliente", async () => {
    const consultas = [];
    const db = {
        async query(sql, valores) {
            consultas.push({ sql, valores });
            return [[{ id: 9, nombre: "Otro", dni: "30111222" }]];
        },
    };
    const repositorio = createClienteRepository(db);

    const filas = await repositorio.buscarCoincidencias({
        telefono: "1155555555",
        email: "otro@mail.com",
        exceptoId: 5,
    });

    assert.match(consultas[0].sql, /telefono = \?/);
    assert.match(consultas[0].sql, /email = \?/);
    assert.match(consultas[0].sql, /id <> \?/);
    assert.deepEqual(consultas[0].valores, ["1155555555", "otro@mail.com", 5]);
    assert.equal(filas[0].id, 9);
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

function tokenCon(rol) {
    return jwt.sign({ sub: 1, rol, email: `${rol.toLowerCase()}@test.com` }, "secreto-de-prueba", { expiresIn: "1h" });
}

test("clientes: sin token 401, chofer 403, cuerpo inválido 400", async () => {
    const { server, baseUrl } = await iniciarApp();
    try {
        const sinToken = await fetch(`${baseUrl}/api/clientes`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ nombre: "Juan" }),
            signal: AbortSignal.timeout(3000),
        });
        assert.equal(sinToken.status, 401);

        const comoChofer = await fetch(`${baseUrl}/api/clientes`, {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${tokenCon("CHOFER")}` },
            body: JSON.stringify({ nombre: "Juan" }),
            signal: AbortSignal.timeout(3000),
        });
        assert.equal(comoChofer.status, 403);

        const sinNombre = await fetch(`${baseUrl}/api/clientes`, {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${tokenCon("OPERADOR")}` },
            body: JSON.stringify({ nombre: "   " }),
            signal: AbortSignal.timeout(3000),
        });
        assert.equal(sinNombre.status, 400);
        const errorSinNombre = await sinNombre.json();
        assert.equal(errorSinNombre.error.codigo, "DATOS_INVALIDOS");
        assert.equal(errorSinNombre.error.mensaje, "Los datos enviados no son válidos.");
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
            server.closeAllConnections();
        });
    }
});

test("clientes: editar y eliminar exigen rol y validan el id", async () => {
    const { server, baseUrl } = await iniciarApp();
    const cuerpo = JSON.stringify({ nombre: "Juan Pérez" });
    try {
        const editarSinToken = await fetch(`${baseUrl}/api/clientes/1`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: cuerpo,
            signal: AbortSignal.timeout(3000),
        });
        assert.equal(editarSinToken.status, 401);

        const editarComoChofer = await fetch(`${baseUrl}/api/clientes/1`, {
            method: "PUT",
            headers: { "content-type": "application/json", authorization: `Bearer ${tokenCon("CHOFER")}` },
            body: cuerpo,
            signal: AbortSignal.timeout(3000),
        });
        assert.equal(editarComoChofer.status, 403);

        const editarSinNombre = await fetch(`${baseUrl}/api/clientes/1`, {
            method: "PUT",
            headers: { "content-type": "application/json", authorization: `Bearer ${tokenCon("OPERADOR")}` },
            body: JSON.stringify({ nombre: "   " }),
            signal: AbortSignal.timeout(3000),
        });
        assert.equal(editarSinNombre.status, 400);

        const eliminarIdInvalido = await fetch(`${baseUrl}/api/clientes/abc`, {
            method: "DELETE",
            headers: { authorization: `Bearer ${tokenCon("OPERADOR")}` },
            signal: AbortSignal.timeout(3000),
        });
        assert.equal(eliminarIdInvalido.status, 400);

        const eliminarInexistente = await fetch(`${baseUrl}/api/clientes/1`, {
            method: "DELETE",
            headers: { authorization: `Bearer ${tokenCon("OPERADOR")}` },
            signal: AbortSignal.timeout(3000),
        });
        assert.equal(eliminarInexistente.status, 404);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
            server.closeAllConnections();
        });
    }
});
