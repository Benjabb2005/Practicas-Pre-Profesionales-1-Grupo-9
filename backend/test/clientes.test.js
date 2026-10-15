const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const jwt = require("jsonwebtoken");
const createApp = require("../app");
const { createClienteService } = require("../src/services/ClienteService");

function reposClientesFalsos({ porDni = null, coincidencias = [] } = {}) {
    const capturado = { crear: null, coincidencias: null, dniBuscado: null };
    return {
        capturado,
        async listar() {
            return [];
        },
        async buscarPorId(id) {
            return { id, nombre: "Cliente creado" };
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
    };
}

test("crear cliente normaliza el DNI a solo dígitos y devuelve el registro", async () => {
    const clientes = reposClientesFalsos();
    const servicio = createClienteService({ clientes });

    const resultado = await servicio.crear({ nombre: "Juan Pérez", dni: "20.123.456", telefono: "11 5555-5555" });

    assert.equal(clientes.capturado.crear.dni, "20123456");
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
        assert.equal((await sinNombre.json()).error.codigo, "DATOS_INVALIDOS");
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
            server.closeAllConnections();
        });
    }
});
