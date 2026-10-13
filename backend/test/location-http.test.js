const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const { createOrders } = require("../orders");

test("API de ubicación exige autenticación/rol y valida confirmación; candidato nunca confirma", async () => {
    let confirmations = 0, attempts = 0;
    const version = "a".repeat(64);
    const app = express(); app.use(express.json());
    app.use(createOrders({ authenticate(req, res, next) {
        if (!req.get("Test-Role")) return res.sendStatus(401);
        req.user = { id: 1, rol: req.get("Test-Role") }; next();
    }, store: {
        async detail(id) { return id === 1 ? { id, version } : null; },
        async recordGeocode() { attempts++; },
        async confirm() { confirmations++; return { confirmation: { version } }; },
    }, geocode: async () => ({ status: "zero_results", candidates: [] }) }));
    app.use((error, req, res, next) => { if (res.headersSent) return next(error); res.status(error.status || 500).json({ code: error.code }); });
    const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
    async function request(path, role, body = {}) {
        return fetch(`http://127.0.0.1:${server.address().port}/pedidos/${path}`, { method: "POST", headers: { "Content-Type": "application/json", ...(role ? { "Test-Role": role } : {}) }, body: JSON.stringify(body) });
    }
    try {
        for (const path of ["1/ubicacion/candidatos", "1/ubicacion/confirmacion"]) {
            assert.equal((await request(path)).status, 401);
            assert.equal((await request(path, "chofer")).status, 403);
        }
        for (const role of ["admin", "operador"]) assert.equal((await request("1/ubicacion/candidatos", role)).status, 200);
        assert.equal(attempts, 2); assert.equal(confirmations, 0);
        const previewAddress = { direccionOriginal: '', calle: 'Calle sintética', altura: '123', pisoDepto: '', localidad: 'Localidad sintética', provincia: 'Provincia sintética', codigoPostal: '1000' };
        async function preview(body, role = 'operador') {
            return fetch(`http://127.0.0.1:${server.address().port}/ubicacion/candidatos`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(role ? { 'Test-Role': role } : {}) }, body: JSON.stringify(body) });
        }
        assert.equal((await preview({ direccion: previewAddress }, '')).status, 401);
        assert.equal((await preview({ direccion: previewAddress }, 'chofer')).status, 403);
        const previewResponse = await preview({ direccion: previewAddress });
        assert.equal(previewResponse.status, 200);
        assert.equal((await previewResponse.json()).data.version.length, 64);
        assert.equal(attempts, 2, 'La vista previa no persiste pedidos ni intentos ligados a otro pedido.');
        assert.equal((await preview({ direccion: { ...previewAddress, altura: '0' } })).status, 422);
        assert.equal((await preview({ direccion: { ...previewAddress, calle: 'x'.repeat(151) } })).status, 422);
        assert.equal((await preview({ direccion: previewAddress, cliente: {} })).status, 400);
        assert.equal((await request("2/ubicacion/candidatos", "admin")).status, 404);
        assert.equal((await request("bad/ubicacion/candidatos", "admin")).status, 400);
        const valid = { version, lat: -34, lng: -58, observation: "Revisión sintética" };
        for (const invalid of [{ ...valid, lat: null }, { ...valid, lat: 91 }, { ...valid, lng: "-58" }, { ...valid, observation: " " }, { ...valid, confirmado: true }, { ...valid, version: "old" }]) assert.equal((await request("1/ubicacion/confirmacion", "operador", invalid)).status, 422);
        for (const role of ["admin", "operador"]) assert.equal((await request("1/ubicacion/confirmacion", role, valid)).status, 200);
        assert.equal(confirmations, 2);
        assert.equal((await request("1/despacho", "admin")).status, 404, "No se habilita un despacho sin reglas acordadas.");
    } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
});
