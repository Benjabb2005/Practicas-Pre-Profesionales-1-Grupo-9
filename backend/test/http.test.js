const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const app = require("../app");

let server;
let baseUrl;

before(async () => {
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    if (!server) return;
    await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
        server.closeAllConnections();
    });
});

test("GET / responde por HTTP sin necesitar MySQL", async () => {
    const response = await fetch(baseUrl, { signal: AbortSignal.timeout(3000) });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.match(await response.text(), /MandáTodo/);
});

test("una ruta inexistente no comunica éxito", async () => {
    const response = await fetch(`${baseUrl}/ruta-inexistente`, { signal: AbortSignal.timeout(3000) });
    assert.equal(response.status, 404);
});
