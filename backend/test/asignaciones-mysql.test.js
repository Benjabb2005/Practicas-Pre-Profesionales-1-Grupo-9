const { test } = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const { createAsignacionRepository } = require('../src/repositories/AsignacionRepository');
const { validarAsignacion } = require('../src/services/AsignacionService');

// Opt-in: nunca corre sobre la base de desarrollo ni sobre datos del cliente.
test('MySQL real: persistencia, historial, concurrencia, aislamiento y rollback', {
    skip: process.env.ASIGNACIONES_MYSQL !== '1',
}, async () => {
    assert.equal(process.env.DB_NAME, 'mandatodo_test_asignaciones');
    const db = mysql.createPool({ host: process.env.DB_HOST, user: process.env.DB_USER,
        password: process.env.DB_PASSWORD, database: process.env.DB_NAME, connectionLimit: 4 });
    const lote = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const ids = [];
    let clienteId;
    let pedidoId;
    try {
        for (const rol of ['OPERADOR', 'CHOFER', 'CHOFER']) {
            const [r] = await db.query('INSERT INTO usuarios (nombre,email,password_hash,rol) VALUES (?,?,?,?)',
                ['Fixture de integración', `${rol}-${ids.length}-${lote}@example.invalid`, 'no-es-una-credencial', rol]);
            ids.push(r.insertId);
        }
        const [cliente] = await db.query('INSERT INTO clientes (nombre) VALUES (?)', ['Cliente sintético de integración']);
        clienteId = cliente.insertId;
        const [pedido] = await db.query('INSERT INTO pedidos (cliente_id,estado) VALUES (?,?)', [cliente.insertId, 'EN STOCK']);
        pedidoId = pedido.insertId;
        await db.query('INSERT INTO direcciones (pedido_id,calle,altura,localidad,provincia,estado_validacion) VALUES (?,?,?,?,?,?)',
            [pedido.insertId, 'Calle de prueba', '123', 'Localidad de prueba', 'Buenos Aires', 'CONFIRMADA']);
        const repo = createAsignacionRepository(db);
        const id = pedido.insertId;
        // Dos intentos iguales concurrentes: una sola asignación y un historial.
        await Promise.all([repo.asignar(id, ids[1], ids[0], validarAsignacion), repo.asignar(id, ids[1], ids[0], validarAsignacion)]);
        let [[fila]] = await db.query('SELECT estado,chofer_id FROM pedidos WHERE id=?', [id]);
        assert.equal(fila.chofer_id, ids[1]);
        assert.equal(fila.estado, 'EN STOCK');
        const [[historial]] = await db.query('SELECT COUNT(*) AS cantidad FROM historial_estados WHERE pedido_id=?', [id]);
        assert.equal(historial.cantidad, 1);
        assert.equal((await repo.propios(ids[1])).length, 0);
        // Inyectar fallo justo antes de insertar historial tras UPDATE real.
        const fallando = createAsignacionRepository({ async getConnection() {
            const c = await db.getConnection();
            return {
                beginTransaction: () => c.beginTransaction(), commit: () => c.commit(),
                rollback: () => c.rollback(), release: () => c.release(),
                query(sql, valores) {
                    if (sql.includes('INSERT INTO historial_estados')) throw new Error('fallo inyectado');
                    return c.query(sql, valores);
                },
            };
        } });
        await assert.rejects(() => fallando.asignar(id, ids[2], ids[0], validarAsignacion), /fallo inyectado/);
        [[fila]] = await db.query('SELECT chofer_id FROM pedidos WHERE id=?', [id]);
        assert.equal(fila.chofer_id, ids[1]);
        await repo.asignar(id, ids[2], ids[0], validarAsignacion);
        await repo.asignar(id, null, ids[0], validarAsignacion);
        await repo.asignar(id, ids[1], ids[0], validarAsignacion);
        // Fixture de despacho: sólo en esta base de prueba, no es una API de negocio.
        await db.query('UPDATE pedidos SET estado=? WHERE id=?', ['EN ENVÍO', id]);
        assert.equal((await repo.propios(ids[1])).some(p => p.id === id), true);
        assert.equal(await repo.propio(id, ids[2]), null);
        await assert.rejects(() => repo.asignar(id, ids[2], ids[0], validarAsignacion), e => e.codigo === 'CONFLICTO');
        await db.query('UPDATE direcciones SET estado_validacion=? WHERE pedido_id=?', ['VALIDA', id]);
        assert.equal(await repo.propio(id, ids[1]), null);
    } finally {
        try {
            if (pedidoId) {
                await db.query('DELETE FROM historial_estados WHERE pedido_id=?', [pedidoId]);
                await db.query('DELETE FROM direcciones WHERE pedido_id=?', [pedidoId]);
                await db.query('DELETE FROM pedidos WHERE id=?', [pedidoId]);
            }
            if (clienteId) await db.query('DELETE FROM clientes WHERE id=?', [clienteId]);
            for (const id of ids) await db.query('DELETE FROM usuarios WHERE id=?', [id]);
        } finally { await db.end(); }
    }
});
