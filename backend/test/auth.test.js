const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const bcrypt = require("bcryptjs");
const createApp = require("../app");

// Base en memoria que responde solo las consultas que usa UsuarioRepository.
// No reemplaza una prueba contra MySQL real: acá se valida auth, roles y validación.
function crearFakeDb(usuariosIniciales) {
    const usuarios = usuariosIniciales.map((usuario) => ({ ...usuario }));
    let siguienteId = usuarios.reduce((maximo, usuario) => Math.max(maximo, usuario.id), 0) + 1;

    return {
        usuarios,
        async query(sql, params = []) {
            if (sql.includes("SELECT id FROM usuarios WHERE email = ? AND id <> ?")) {
                return [usuarios.filter((usuario) => usuario.email === params[0] && usuario.id !== params[1]).map((usuario) => ({ id: usuario.id }))];
            }
            if (sql.includes("FROM usuarios WHERE email = ?")) {
                return [usuarios.filter((usuario) => usuario.email === params[0])];
            }
            if (sql.includes("FROM usuarios WHERE id = ?")) {
                return [usuarios.filter((usuario) => usuario.id === params[0])];
            }
            if (sql.includes("SELECT id, nombre, email, rol, activo, created_at FROM usuarios")) {
                return [usuarios.map(({ id, nombre, email, rol, activo }) => ({ id, nombre, email, rol, activo }))];
            }
            if (sql.startsWith("INSERT INTO usuarios")) {
                const [nombre, email, password_hash, rol, activo] = params;
                const id = siguienteId++;
                usuarios.push({ id, nombre, email, password_hash, rol, activo });
                return [{ insertId: id }];
            }
            if (sql.startsWith("UPDATE usuarios SET")) {
                const id = params[params.length - 1];
                const usuario = usuarios.find((fila) => fila.id === id);
                const columnas = [...sql.matchAll(/(\w+) = \?/g)].map((coincidencia) => coincidencia[1]);
                columnas.forEach((columna, indice) => { usuario[columna] = params[indice]; });
                return [{ affectedRows: 1 }];
            }
            throw new Error(`Consulta no simulada: ${sql}`);
        },
    };
}

async function iniciarApp(db) {
    const app = createApp({ db, config: { jwt: { secret: "secreto-de-prueba", expiraEn: "1h" } } });
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    return { server, baseUrl: `http://127.0.0.1:${server.address().port}` };
}

async function enviar(baseUrl, ruta, opciones = {}) {
    return fetch(`${baseUrl}${ruta}`, {
        ...opciones,
        headers: { "content-type": "application/json", ...(opciones.headers || {}) },
        signal: AbortSignal.timeout(3000),
    });
}

let server;
let baseUrl;

before(async () => {
    const db = crearFakeDb([
        { id: 1, nombre: "Admin", email: "admin@test.com", password_hash: await bcrypt.hash("clave-admin", 4), rol: "ADMINISTRADOR", activo: 1 },
        { id: 2, nombre: "Operador", email: "operador@test.com", password_hash: await bcrypt.hash("clave-oper", 4), rol: "OPERADOR", activo: 1 },
    ]);
    const arrancado = await iniciarApp(db);
    server = arrancado.server;
    baseUrl = arrancado.baseUrl;
});

after(async () => {
    if (!server) return;
    await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
        server.closeAllConnections();
    });
});

async function tokenDe(email, password) {
    const respuesta = await enviar(baseUrl, "/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    const cuerpo = await respuesta.json();
    return cuerpo.token;
}

test("login válido devuelve token y usuario sin contraseña", async () => {
    const respuesta = await enviar(baseUrl, "/api/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@test.com", password: "clave-admin" }) });
    assert.equal(respuesta.status, 200);
    const cuerpo = await respuesta.json();
    assert.ok(cuerpo.token);
    assert.equal(cuerpo.usuario.rol, "ADMINISTRADOR");
    assert.equal(cuerpo.usuario.password_hash, undefined);
});

test("login con contraseña incorrecta se rechaza", async () => {
    const respuesta = await enviar(baseUrl, "/api/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@test.com", password: "incorrecta" }) });
    assert.equal(respuesta.status, 401);
    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.error.codigo, "NO_AUTENTICADO");
});

test("login con cuerpo inválido informa los campos", async () => {
    const respuesta = await enviar(baseUrl, "/api/auth/login", { method: "POST", body: JSON.stringify({ email: "no-es-email" }) });
    assert.equal(respuesta.status, 400);
    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.error.codigo, "DATOS_INVALIDOS");
    assert.ok(cuerpo.error.campos.email);
});

test("/api/auth/me rechaza sin token", async () => {
    const respuesta = await enviar(baseUrl, "/api/auth/me");
    assert.equal(respuesta.status, 401);
});

test("/api/auth/me devuelve el usuario del token", async () => {
    const token = await tokenDe("operador@test.com", "clave-oper");
    const respuesta = await enviar(baseUrl, "/api/auth/me", { headers: { authorization: `Bearer ${token}` } });
    assert.equal(respuesta.status, 200);
    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.usuario.email, "operador@test.com");
});

test("ABM de usuarios: sin token 401, operador 403, admin 200", async () => {
    const sinToken = await enviar(baseUrl, "/api/usuarios");
    assert.equal(sinToken.status, 401);

    const tokenOperador = await tokenDe("operador@test.com", "clave-oper");
    const comoOperador = await enviar(baseUrl, "/api/usuarios", { headers: { authorization: `Bearer ${tokenOperador}` } });
    assert.equal(comoOperador.status, 403);
    assert.equal((await comoOperador.json()).error.codigo, "NO_AUTORIZADO");

    const tokenAdmin = await tokenDe("admin@test.com", "clave-admin");
    const comoAdmin = await enviar(baseUrl, "/api/usuarios", { headers: { authorization: `Bearer ${tokenAdmin}` } });
    assert.equal(comoAdmin.status, 200);
    const cuerpo = await comoAdmin.json();
    assert.equal(cuerpo.usuarios.length, 2);
});

test("el administrador crea un usuario y la respuesta no incluye hash", async () => {
    const tokenAdmin = await tokenDe("admin@test.com", "clave-admin");
    const respuesta = await enviar(baseUrl, "/api/usuarios", {
        method: "POST",
        headers: { authorization: `Bearer ${tokenAdmin}` },
        body: JSON.stringify({ nombre: "Chofer Nuevo", email: "chofer@test.com", password: "clave-chofer", rol: "CHOFER" }),
    });
    assert.equal(respuesta.status, 201);
    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.usuario.rol, "CHOFER");
    assert.equal(cuerpo.usuario.password_hash, undefined);
});

test("crear usuario con rol inválido se rechaza", async () => {
    const tokenAdmin = await tokenDe("admin@test.com", "clave-admin");
    const respuesta = await enviar(baseUrl, "/api/usuarios", {
        method: "POST",
        headers: { authorization: `Bearer ${tokenAdmin}` },
        body: JSON.stringify({ nombre: "X", email: "x@test.com", password: "clave-larga", rol: "SUPERADMIN" }),
    });
    assert.equal(respuesta.status, 400);
});

test("crear usuario con email repetido devuelve conflicto", async () => {
    const tokenAdmin = await tokenDe("admin@test.com", "clave-admin");
    const respuesta = await enviar(baseUrl, "/api/usuarios", {
        method: "POST",
        headers: { authorization: `Bearer ${tokenAdmin}` },
        body: JSON.stringify({ nombre: "Repetido", email: "operador@test.com", password: "clave-larga", rol: "OPERADOR" }),
    });
    assert.equal(respuesta.status, 409);
    assert.equal((await respuesta.json()).error.codigo, "CONFLICTO");
});

test("un token inválido se rechaza como no autenticado", async () => {
    const respuesta = await enviar(baseUrl, "/api/auth/me", { headers: { authorization: "Bearer token-falso" } });
    assert.equal(respuesta.status, 401);
});
