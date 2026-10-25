const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const jwt = require('jsonwebtoken');
const { validarAsignacion, createAsignacionService } = require('../src/services/AsignacionService');
const { createAsignacionRepository } = require('../src/repositories/AsignacionRepository');
const createApp = require('../app');

const base = { id: 10, estado: 'EN STOCK', chofer_id: null, estado_validacion: 'CONFIRMADA' };
const chofer = { id: 3, rol: 'CHOFER', activo: 1 };

test('listado: informa habilitación y motivos coherentes con las reglas del servidor', async () => {
    const filas = [base, { ...base, id: 11, estado_validacion: 'VALIDA', chofer_id: 3 },
        { ...base, id: 12, estado: 'EN ENVÍO', chofer_id: 3 }];
    const servicio = createAsignacionService({ repositorio: { listar: async () => filas } });
    const [habilitado, sinConfirmar, despachado] = await servicio.listar();
    assert.equal(habilitado.puede_asignar, true);
    assert.equal(habilitado.motivo_bloqueo, null);
    assert.equal(habilitado.puede_quitar, false);
    assert.equal(sinConfirmar.puede_asignar, false);
    assert.match(sinConfirmar.motivo_bloqueo, /Confirmá/);
    assert.equal(sinConfirmar.puede_quitar, true);
    assert.equal(despachado.puede_asignar, false);
    assert.equal(despachado.puede_quitar, false);
    assert.match(despachado.motivo_bloqueo, /antes del despacho/);
});

test('asignación: acepta dirección confirmada y chofer activo sin adelantar estado', () => {
    validarAsignacion(base, 3, chofer);
    assert.equal(base.estado, 'EN STOCK');
});
test('asignación: rechaza direcciones pendientes, advertidas o cambiadas', () => {
    for (const estado_validacion of ['PENDIENTE', 'CON_ADVERTENCIAS', 'VALIDA', null]) {
        assert.throws(() => validarAsignacion({ ...base, estado_validacion }, 3, chofer), e => e.codigo === 'CONFLICTO');
    }
});
test('asignación: rechaza chofer inexistente, inactivo o usuario de otro rol', () => {
    for (const usuario of [null, { ...chofer, activo: 0 }, { ...chofer, rol: 'OPERADOR' }]) {
        assert.throws(() => validarAsignacion(base, 3, usuario), e => e.codigo === 'DATOS_INVALIDOS');
    }
});
test('asignación: no modifica pedidos despachados o finalizados', () => {
    for (const estado of ['EN ENVÍO', 'ENTREGADO', 'PAGADO']) {
        assert.throws(() => validarAsignacion({ ...base, estado }, null), e => e.codigo === 'CONFLICTO');
    }
});
test('asignación: permite retirar chofer si la dirección dejó de estar confirmada', () => {
    validarAsignacion({ ...base, estado_validacion: 'VALIDA', chofer_id: 3 }, null);
    assert.throws(() => validarAsignacion(null, 3, chofer), e => e.codigo === 'NO_ENCONTRADO');
});

function dbTransaccion({ actual = base, fallaHistorial = false } = {}) {
    const llamadas = [];
    const conexion = {
        async beginTransaction() { llamadas.push('begin'); },
        async commit() { llamadas.push('commit'); },
        async rollback() { llamadas.push('rollback'); },
        release() { llamadas.push('release'); },
        async query(sql) {
            llamadas.push(sql);
            if (sql.includes('FOR UPDATE') && sql.includes('FROM pedidos')) return [[actual]];
            if (sql.includes('FROM usuarios')) return [[chofer]];
            if (sql.includes('INSERT INTO historial') && fallaHistorial) throw new Error('fallo simulado');
            return [[actual]];
        },
    };
    return { llamadas, async getConnection() { return conexion; } };
}
test('asignación e historial se confirman juntos bajo bloqueo; libera conexión', async () => {
    const db = dbTransaccion();
    await createAsignacionRepository(db).asignar(10, 3, 1, validarAsignacion);
    assert.ok(db.llamadas.some(q => q.includes('FOR UPDATE')));
    assert.ok(db.llamadas.some(q => q.startsWith('UPDATE pedidos')));
    assert.ok(db.llamadas.some(q => q.includes('INSERT INTO historial')));
    assert.deepEqual(db.llamadas.slice(-2), ['commit', 'release']);
});
test('si falla historial se solicita rollback y no commit', async () => {
    const db = dbTransaccion({ fallaHistorial: true });
    await assert.rejects(() => createAsignacionRepository(db).asignar(10, 3, 1, validarAsignacion));
    assert.ok(!db.llamadas.includes('commit'));
    assert.deepEqual(db.llamadas.slice(-2), ['rollback', 'release']);
});
test('repetir misma asignación no agrega historial', async () => {
    const db = dbTransaccion({ actual: { ...base, chofer_id: 3 } });
    await createAsignacionRepository(db).asignar(10, 3, 1, validarAsignacion);
    assert.ok(!db.llamadas.some(q => q.startsWith('UPDATE') || q.includes('INSERT')));
});

test('HTTP: permisos, validación de cuerpo y aislamiento por identidad del chofer', async () => {
    const filas = [
        { ...base, estado: 'EN ENVÍO', chofer_id: 3 },
        { ...base, id: 11, estado: 'EN ENVÍO', chofer_id: 4 },
    ];
    const consultas = [];
    const db = {
        getConnection: () => dbTransaccion().getConnection(),
        async query(sql, valores = []) {
            consultas.push({ sql, valores });
            if (sql.includes('p.chofer_id=?')) {
                return [filas.filter(p => p.chofer_id === Number(valores[0]) && (valores.length === 1 || p.id === valores[1]))];
            }
            return [[]];
        },
    };
    const app = createApp({ db, config: { jwt: { secret: 'secreto-test' }, geocode: {} } });
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    async function pedir(path, rol, method = 'GET', body) {
        const token = rol ? jwt.sign({ sub: 3, rol }, 'secreto-test') : null;
        return fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
            method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
            body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(3000),
        });
    }
    try {
        assert.equal((await pedir('/asignaciones')).status, 401);
        assert.equal((await pedir('/asignaciones', 'CHOFER')).status, 403);
        assert.equal((await pedir('/asignaciones/choferes', 'OPERADOR')).status, 200);
        assert.equal((await pedir('/chofer/pedidos', 'OPERADOR')).status, 403);
        const propios = await pedir('/chofer/pedidos?chofer_id=4', 'CHOFER');
        assert.deepEqual((await propios.json()).pedidos.map(p => p.id), [10]);
        assert.equal((await pedir('/chofer/pedidos/11', 'CHOFER')).status, 404);
        assert.equal((await pedir('/chofer/pedidos/10', 'CHOFER')).status, 200);
        for (const body of [{}, { chofer_id: '3' }, { chofer_id: -1 }, { chofer_id: 3, usuario_id: 4 }]) {
            assert.equal((await pedir('/asignaciones/10', 'OPERADOR', 'PUT', body)).status, 400);
        }
        assert.equal((await pedir('/asignaciones/10', 'OPERADOR', 'PUT', { chofer_id: 3 })).status, 200);
        assert.equal((await pedir('/asignaciones/10', 'ADMINISTRADOR', 'PUT', { chofer_id: null })).status, 200);
        const consulta = consultas.find(q => q.sql.includes('p.chofer_id=?'));
        assert.ok(consulta.sql.includes("p.estado='EN ENVÍO'"));
        assert.ok(consulta.sql.includes("d.estado_validacion='CONFIRMADA'"));
    } finally {
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    }
});
