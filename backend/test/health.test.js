const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { createApp } = require("../app");

async function withServer(options, check) {
    const server = createApp(options).listen(0, "127.0.0.1");
    await once(server, "listening");
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    try {
        await check(baseUrl);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
            server.closeAllConnections();
        });
    }
}

function get(url) {
    return fetch(url, { signal: AbortSignal.timeout(3000) });
}

test("liveness sigue disponible aunque la base falle y no consulta MySQL", async () => {
    let calls = 0;
    await withServer({ checkDatabase: async () => { calls++; throw new Error("private"); } }, async (url) => {
        const response = await get(`${url}/health/live`);
        assert.equal(response.status, 200);
        assert.equal(calls, 0);
        assert.equal(response.headers.get("cache-control"), "no-store");
        assert.deepEqual(await response.json(), { data: { status: "ok" } });
    });
});

test("readiness sin una conexión configurada devuelve 503", async () => {
    await withServer({}, async (url) => {
        const response = await get(`${url}/health/ready`);
        assert.equal(response.status, 503);
        assert.equal((await response.json()).error.code, "DATABASE_UNAVAILABLE");
    });
});

test("readiness comprueba la base en cada petición y detecta caída/recuperación", async () => {
    let available = true;
    let calls = 0;
    await withServer({ checkDatabase: async () => { calls++; return available; } }, async (url) => {
        assert.equal((await get(`${url}/health/ready`)).status, 200);
        available = false;
        assert.equal((await get(`${url}/health/ready`)).status, 503);
        available = true;
        const response = await get(`${url}/health/ready`);
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("cache-control"), "no-store");
        assert.equal((await response.json()).data.scope, "database");
        assert.equal(calls, 3);
    });
});

test("readiness no filtra mensajes SQL, credenciales ni stack", async () => {
    await withServer({ checkDatabase: async () => { throw new Error("SQL secret-host secret-password"); } }, async (url) => {
        const response = await get(`${url}/health/ready`);
        assert.equal(response.status, 503);
        assert.deepEqual(await response.json(), {
            error: { code: "DATABASE_UNAVAILABLE", message: "La base de datos no está disponible.", fields: {} },
        });
    });
});

test("readiness tiene tiempo límite si una comprobación queda pendiente", async () => {
    await withServer({ checkDatabase: () => new Promise(() => {}), readinessTimeoutMs: 30 }, async (url) => {
        const response = await get(`${url}/health/ready`);
        assert.equal(response.status, 503);
        assert.equal((await response.json()).error.code, "DATABASE_UNAVAILABLE");
    });
});
