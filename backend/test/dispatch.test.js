const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { once } = require('node:events');
const { createDispatch, requireReviewed } = require('../dispatch');

test('preparar/despachar requiere pedido completo y confirmación vigente', () => {
    const order = { calle: 'Calle sintética', altura: '123', localidad: 'Localidad sintética', provincia: 'Provincia sintética', codigoPostal: '1000', nombre: 'Nombre sintético', apellido: 'Apellido sintético', dni: '80000001', telefono: '1100000001', email: 'fixture@example.invalid', confirmation: { lat: -34, lng: -58 } };
    assert.doesNotThrow(() => requireReviewed(order));
    assert.throws(() => requireReviewed({ ...order, confirmation: null }), { code: 'LOCATION_UNCONFIRMED' });
    assert.throws(() => requireReviewed({ ...order, dni: null }), { code: 'INCOMPLETE_ORDER' });
    assert.throws(() => requireReviewed({ ...order, altura: '0' }), { code: 'INCOMPLETE_ORDER' });
});

test('API operativa rechaza chofer/anónimo; vista chofer usa identidad de sesión y oculta ajenos', async () => {
    const app = express(); app.use(express.json());
    let mutations = 0;
    app.use(createDispatch({ authenticate(req, res, next) {
        if (!req.get('Test-Role')) return res.sendStatus(401);
        req.user = { id: 7, rol: req.get('Test-Role') }; next();
    }, store: {
        async drivers() { return { enabled: true, drivers: [] }; },
        async operation() { return {}; },
        async mutate() { mutations++; return {}; },
        async assigned(userId) { assert.equal(userId, 7); return { data: [] }; },
        async driverDetail(id, userId) { assert.equal(userId, 7); return id === 1 ? { id } : null; },
    } }));
    app.use((error, req, res, next) => { if (res.headersSent) return next(error); res.status(error.status || 500).json({ code: error.code }); });
    const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
    async function request(path, role, body) { return fetch(`http://127.0.0.1:${server.address().port}${path}`, { method: body ? 'POST' : 'GET', headers: { ...(role ? { 'Test-Role': role } : {}), 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); }
    try {
        assert.equal((await request('/choferes')).status, 401);
        assert.equal((await request('/choferes', 'chofer')).status, 403);
        for (const action of ['asignar', 'preparar', 'despachar']) assert.equal((await request(`/pedidos/1/${action}`, 'chofer', {})).status, 403);
        assert.equal(mutations, 0);
        for (const role of ['admin', 'operador']) assert.equal((await request('/pedidos/1/asignar', role, { choferId: 2 })).status, 200);
        for (const body of [{}, { choferId: '2' }, { choferId: -1 }, { choferId: 2, estado: 'en_camino' }]) assert.equal((await request('/pedidos/1/asignar', 'operador', body)).status, 422);
        assert.equal((await request('/pedidos/1/despachar', 'operador', { estado: 'entregado' })).status, 422);
        assert.equal((await request('/chofer/pedidos?choferId=99', 'chofer')).status, 200);
        assert.equal((await request('/chofer/pedidos/2', 'chofer')).status, 404);
        assert.equal((await request('/chofer/pedidos/1', 'chofer')).status, 200);
        assert.equal((await request('/chofer/pedidos', 'operador')).status, 403);
        assert.equal((await request('/chofer/pedidos?vista=cancelado', 'chofer')).status, 400);
        assert.equal((await request('/chofer/pedidos?vista=entregado', 'chofer')).status, 200);
    } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
});
