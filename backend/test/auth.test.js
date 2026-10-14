const { test, before } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { randomBytes } = require("node:crypto");
const jwt = require("jsonwebtoken");
const { createApp } = require("../app");
const { hashPassword, verifyPassword } = require("../passwords");

const origin = "http://localhost:5173";
const secret = randomBytes(48).toString("hex");
const password = randomBytes(20).toString("hex");
let hash;
before(async () => { hash = await hashPassword(password); });

async function fixture(run, options = {}) {
    const user = { id: 1, nombre: "Cuenta de prueba", email: "cuenta@example.invalid", rol: "operador", activo: 1, password_hash: hash };
    const sessions = new Map();
    const store = {
        async findUser(email) { return email === user.email ? user : null; },
        async createSession(jti, userId, expiresAt) { sessions.set(jti, { ...user, expiresAt }); },
        async findSession(jti) {
            const session = sessions.get(jti);
            return session && user.activo && session.expiresAt > new Date() ? { ...session, rol: user.rol } : null;
        },
        async revokeSession(jti) { sessions.delete(jti); },
    };
    const server = createApp({ auth: { store, secret, allowedOrigin: origin, ...options } }).listen(0, "127.0.0.1");
    await once(server, "listening");
    async function request(path, { method = "GET", body, cookie, requestOrigin = origin, rawBody } = {}) {
        return fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
            method, headers: { Origin: requestOrigin, ...(cookie ? { Cookie: cookie } : {}),
                ...(body || rawBody ? { "Content-Type": "application/json" } : {}) },
            body: rawBody || (body ? JSON.stringify(body) : undefined), signal: AbortSignal.timeout(3000),
        });
    }
    async function login() {
        const response = await request("/sesion", { method: "POST", body: { email: user.email, password } });
        assert.equal(response.status, 200);
        return response.headers.get("set-cookie").split(";")[0];
    }
    try { await run({ user, store, sessions, request, login }); }
    finally {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
            server.closeAllConnections();
        });
    }
}

test("scrypt usa salts distintos y rechaza contraseña/hash incorrectos", async () => {
    const other = await hashPassword(password);
    assert.notEqual(hash, other);
    assert.equal(await verifyPassword(password, hash), true);
    assert.equal(await verifyPassword("incorrecta", hash), false);
    assert.equal(await verifyPassword(password, "legacy-plaintext"), false);
    await assert.rejects(hashPassword("corta"));
});

test("login real devuelve identidad sin hash/token y usa cookie HttpOnly", async () => {
    await fixture(async ({ request, user, sessions }) => {
        const response = await request("/sesion", { method: "POST", body: { email: user.email.toUpperCase(), password } });
        assert.equal(response.status, 200);
        assert.match(response.headers.get("set-cookie"), /HttpOnly/);
        assert.match(response.headers.get("set-cookie"), /SameSite=Lax/);
        assert.match(response.headers.get("set-cookie"), /Path=\/api/);
        assert.equal(response.headers.get("cache-control"), "no-store");
        const result = await response.json();
        assert.deepEqual(Object.keys(result.data.usuario).sort(), ["email", "id", "nombre", "rol"]);
        assert.equal(result.data.usuario.rol, "operador");
        assert.equal(sessions.size, 1);
        assert.ok(new Date(result.data.expiraEn) > new Date());
    });
});

test("sesión se recupera y logout invalida incluso la cookie anterior", async () => {
    await fixture(async ({ request, login }) => {
        const cookie = await login();
        assert.equal((await request("/sesion", { cookie })).status, 200);
        assert.equal((await request("/sesion", { method: "DELETE", cookie })).status, 204);
        assert.equal((await request("/sesion", { cookie })).status, 401);
    });
});

test("sin cookie, token adulterado y token vencido se rechazan", async () => {
    await fixture(async ({ request, login }) => {
        assert.equal((await request("/sesion")).status, 401);
        assert.equal((await request("/sesion", { cookie: "mandatodo_session=invalid" })).status, 401);
        const cookie = await login();
        const payload = jwt.decode(cookie.split("=")[1]);
        const expired = jwt.sign({ jti: payload.jti }, secret, { subject: "1", issuer: "mandatodo", audience: "mandatodo-web", expiresIn: -1 });
        assert.equal((await request("/sesion", { cookie: `mandatodo_session=${expired}` })).status, 401);
        assert.equal((await request("/sesion", { cookie: `${cookie}; ${cookie}` })).status, 401);
    });
});

test("inactivar usuario o cambiarlo a un rol no soportado revoca acceso", async () => {
    await fixture(async ({ request, login, user }) => {
        const cookie = await login();
        user.activo = 0;
        assert.equal((await request("/sesion", { cookie })).status, 401);
        user.activo = 1;
        user.rol = "desconocido";
        assert.equal((await request("/sesion", { cookie })).status, 401);
    });
});

test('chofer puede iniciar y recuperar sesión real', async () => {
    await fixture(async ({ user, login, request }) => {
        user.rol = 'chofer';
        const cookie = await login();
        const response = await request('/sesion', { cookie });
        assert.equal(response.status, 200);
        assert.equal((await response.json()).data.usuario.rol, 'chofer');
    });
});

test("cuenta inexistente y contraseña incorrecta tienen el mismo error", async () => {
    await fixture(async ({ request, user }) => {
        const missing = await request("/sesion", { method: "POST", body: { email: "ausente@example.invalid", password } });
        const wrong = await request("/sesion", { method: "POST", body: { email: user.email, password: "incorrecta" } });
        assert.equal(missing.status, 401);
        assert.equal(wrong.status, 401);
        assert.deepEqual(await missing.json(), await wrong.json());
    });
});

test("validación de formato, campos extras y JSON inválido", async () => {
    await fixture(async ({ request, user }) => {
        for (const body of [{ email: 5, password }, { email: user.email, password, rol: "admin" }, { email: user.email, password: {} }]) {
            assert.equal((await request("/sesion", { method: "POST", body })).status, 400);
        }
        assert.equal((await request("/sesion", { method: "POST", rawBody: "{" })).status, 400);
    });
});

test("origin externo no puede iniciar ni cerrar sesión", async () => {
    await fixture(async ({ request, login, user }) => {
        assert.equal((await request("/sesion", { method: "POST", requestOrigin: "http://otro.invalid", body: { email: user.email, password } })).status, 403);
        const cookie = await login();
        assert.equal((await request("/sesion", { method: "DELETE", cookie, requestOrigin: "http://otro.invalid" })).status, 403);
        assert.equal((await request("/sesion", { cookie })).status, 200);
    });
});

test("límite de intentos evita seguir verificando contraseñas", async () => {
    await fixture(async ({ request }) => {
        for (let i = 0; i < 10; i++) assert.equal((await request("/sesion", { method: "POST", body: { email: 5 } })).status, 400);
        const response = await request("/sesion", { method: "POST", body: { email: 5 } });
        assert.equal(response.status, 429);
        assert.equal(response.headers.get("retry-after"), "900");
    });
});

test("fallo de almacenamiento no crea cookie de éxito ni filtra SQL", async () => {
    await fixture(async ({ request, user, store }) => {
        store.createSession = async () => { throw new Error("secret SQL"); };
        const response = await request("/sesion", { method: "POST", body: { email: user.email, password } });
        assert.equal(response.status, 503);
        assert.equal(response.headers.get("set-cookie"), null);
        assert.equal((await response.json()).error.code, "SERVICE_UNAVAILABLE");
    });
});

test("secreto corto deja auth no disponible y cookie HTTPS lleva Secure", async () => {
    await fixture(async ({ request }) => { assert.equal((await request("/sesion")).status, 503); }, { secret: "short" });
    await fixture(async ({ request, user }) => {
        const response = await request("/sesion", { method: "POST", body: { email: user.email, password } });
        assert.match(response.headers.get("set-cookie"), /Secure/);
    }, { secureCookies: true });
});
