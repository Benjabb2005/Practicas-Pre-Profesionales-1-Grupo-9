const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createExportacionRepository } = require('../src/repositories/ExportacionRepository');
const { createExportacionesRouter } = require('../src/routes/exportaciones.routes');
const { createAuthMiddleware } = require('../src/middleware/auth');
const { errorHandler } = require('../src/middleware/errorHandler');

function conexionFalsa({ pedido = { id: 1, direccion_id: 2 }, fallarHistorial = false } = {}) {
    const consultas = [], pasos = [];
    const c = {
        async query(sql, params) {
            assert.ok(/^(SELECT|SET TRANSACTION)/.test(sql.trim()), 'exportar no debe escribir');
            consultas.push({ sql, params });
            if (sql.includes('FROM pedidos p')) return [[pedido].filter(Boolean)];
            if (sql.includes('FROM historial_estados')) {
                if (fallarHistorial) throw new Error('fallo simulado');
                return [[{ id: 1, observaciones: 'Asignación sin cambio de estado' }]];
            }
            if (sql.includes('FROM historial_geolocalizacion')) return [[{ id: 2, accion_operador: 'CONFIRMO' }]];
            return [[]];
        },
        async beginTransaction() { pasos.push('begin'); },
        async commit() { pasos.push('commit'); },
        async rollback() { pasos.push('rollback'); },
        release() { pasos.push('release'); },
    };
    return { db: { getConnection: async () => c }, consultas, pasos };
}

test('exportación: fotografía consistente, sin paginado ni escrituras, acceso acotado en SQL', async () => {
    const { db, consultas, pasos } = conexionFalsa();
    const r = await createExportacionRepository(db).obtener(1, { id: 3, rol: 'CHOFER' });
    assert.equal(r.historial.length, 1);
    assert.equal(r.geolocalizacion[0].accion_operador, 'CONFIRMO');
    assert.ok(Number.isFinite(Date.parse(r.exportado_en)));
    assert.deepEqual(pasos, ['begin', 'commit', 'release']);
    assert.deepEqual(consultas[1].params, [3, 'CHOFER', 1]);
    assert.match(consultas[1].sql, /acceso.activo=1/);
    assert.match(consultas[1].sql, /p.chofer_id=acceso.id/);
    assert.ok(consultas.every(q => !q.sql.includes('LIMIT')));
    assert.ok(consultas.every(q => !/password|archivo_path|ruta_archivo/i.test(q.sql)));
});

test('pedido inexistente o no autorizado no consulta historiales y libera conexión', async () => {
    const { db, consultas, pasos } = conexionFalsa({ pedido: null });
    await assert.rejects(() => createExportacionRepository(db).obtener(1, { id: 3, rol: 'CHOFER' }), e => e.statusCode === 404);
    assert.equal(consultas.length, 2);
    assert.deepEqual(pasos, ['begin', 'rollback', 'release']);
});

test('fallo de lectura aborta la exportación, sin devolver un historial parcial', async () => {
    const { db, pasos } = conexionFalsa({ fallarHistorial: true });
    await assert.rejects(() => createExportacionRepository(db).obtener(1, { id: 3, rol: 'OPERADOR' }), /fallo simulado/);
    assert.deepEqual(pasos, ['begin', 'rollback', 'release']);
});

test('sin dirección entrega datos e historial, sin inventar geolocalización', async () => {
    const { db } = conexionFalsa({ pedido: { id: 1, direccion_id: null } });
    const datos = await createExportacionRepository(db).obtener(1, { id: 3, rol: 'OPERADOR' });
    assert.deepEqual(datos.geolocalizacion, []);
});

test('HTTP exportación: sesión, rol, ID inválido y datos sin caché', async () => {
    const app = express();
    const llamadas = [];
    app.use('/api/exportaciones', createExportacionesRouter({
        auth: createAuthMiddleware({ config: { jwt: { secret: 'secreto-sintetico-solo-pruebas' } } }),
        exportacionRepository: { obtener: async (id, usuario) => { llamadas.push({ id, usuario }); return { pedido: { id }, historial: [], geolocalizacion: [] }; } },
    }));
    app.use(errorHandler);
    const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}/api/exportaciones/pedidos/`;
    async function pedir(id, rol) {
        const token = rol ? jwt.sign({ sub: 2, rol }, 'secreto-sintetico-solo-pruebas') : null;
        return fetch(base + id, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(3000) });
    }
    try {
        assert.equal((await pedir(1)).status, 401);
        assert.equal((await pedir(1, 'INVENTADO')).status, 403);
        assert.equal((await pedir('invalido', 'OPERADOR')).status, 400);
        assert.equal((await pedir(-1, 'OPERADOR')).status, 400);
        assert.equal(llamadas.length, 0);
        for (const rol of ['ADMINISTRADOR', 'OPERADOR', 'CHOFER']) {
            const r = await pedir(1, rol);
            assert.equal(r.status, 200);
            assert.equal(r.headers.get('cache-control'), 'no-store');
            assert.equal((await r.json()).pedido.id, 1);
        }
        assert.deepEqual(llamadas.map(l => l.usuario.rol), ['ADMINISTRADOR', 'OPERADOR', 'CHOFER']);
    } finally {
        await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    }
});
