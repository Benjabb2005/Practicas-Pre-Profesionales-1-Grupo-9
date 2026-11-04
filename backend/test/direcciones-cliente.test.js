const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const express = require('express');
const jwt = require('jsonwebtoken');
const { direccionReutilizable, direccionesUnicas } = require('../src/lib/direccionesCliente');
const { createClienteService } = require('../src/services/ClienteService');
const { createClientesRouter } = require('../src/routes/clientes.routes');
const { createAuthMiddleware } = require('../src/middleware/auth');
const { errorHandler } = require('../src/middleware/errorHandler');
const direccion = { calle: 'Av. Prueba', altura: '1.234', localidad: 'CABA', provincia: 'CABA', piso_depto: '1 A', entre_calles: 'Primera y Segunda' };

test('compara campos normalizados, conserva original y no copia confirmación', () => {
    const original = { ...direccion, direccion_original: 'Texto original', estado_validacion: 'CONFIRMADA', latitud: -34, longitud: -58 };
    const d = direccionReutilizable(original);
    assert.equal(d.clave, direccionReutilizable({ ...direccion, calle: ' avenida prueba ', altura: '1234', provincia: 'Ciudad Autónoma de Buenos Aires' }).clave);
    assert.equal(d.direccion_original, 'Texto original');
    assert.equal(d.latitud, undefined); assert.equal(d.estado_validacion, undefined);
    assert.equal(original.calle, 'Av. Prueba');
});

test('piso/depto y referencias diferentes no se fusionan; repetidas conservan primer original', () => {
    const lista = direccionesUnicas([
        { ...direccion, direccion_original: 'Primera original' },
        { ...direccion, direccion_original: 'Otra escritura' },
        { ...direccion, piso_depto: '2 B' }, { ...direccion, entre_calles: 'Tercera y Cuarta' },
    ]);
    assert.equal(lista.length, 3); assert.equal(lista[0].direccion_original, 'Primera original');
    assert.equal(direccionesUnicas([{}]).length, 0);
});

test('cliente inexistente no permite leer una lista de direcciones', async () => {
    const servicio = createClienteService({ clientes: { buscarPorId: async () => null, direcciones: () => assert.fail() } });
    await assert.rejects(() => servicio.direcciones(55), e => e.statusCode === 404);
});

test('HTTP: sólo admin/operador, ID válido, cliente sin direcciones y sin caché', async () => {
    const app = express(), llamadas = [];
    app.use('/api/clientes', createClientesRouter({
        auth: createAuthMiddleware({ config: { jwt: { secret: 'fixture-direcciones-cliente' } } }),
        clienteService: { direcciones: async id => { llamadas.push(id); return []; } },
    })); app.use(errorHandler);
    const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
    async function pedir(id, rol) {
        const token = rol ? jwt.sign({ sub: 1, rol }, 'fixture-direcciones-cliente') : null;
        return fetch(`http://127.0.0.1:${server.address().port}/api/clientes/${id}/direcciones`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(3000) });
    }
    try {
        assert.equal((await pedir(1)).status, 401);
        assert.equal((await pedir(1, 'CHOFER')).status, 403);
        assert.equal((await pedir('invalido', 'OPERADOR')).status, 400);
        assert.equal(llamadas.length, 0);
        for (const rol of ['ADMINISTRADOR', 'OPERADOR']) {
            const r = await pedir(1, rol); assert.equal(r.status, 200);
            assert.equal(r.headers.get('cache-control'), 'no-store');
            assert.deepEqual(await r.json(), { direcciones: [] });
        }
        assert.deepEqual(llamadas, [1, 1]);
    } finally { await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
});
