const { test } = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const { createEntregaRepository } = require('../src/repositories/EntregaRepository');
const { createEntregaService } = require('../src/services/EntregaService');

test('MySQL entrega/pago: concurrencia, historial, aislamiento y rollback reales', {
    skip: process.env.ENTREGAS_MYSQL !== '1',
}, async () => {
    assert.equal(process.env.DB_NAME, 'mandatodo_test_entregas');
    const db = mysql.createPool({ host: process.env.DB_HOST, user: process.env.DB_USER,
        password: process.env.DB_PASSWORD, database: process.env.DB_NAME, connectionLimit: 4 });
    const lote = Date.now();
    try {
        const [u] = await db.query('INSERT INTO usuarios (nombre,email,password_hash,rol) VALUES (?,?,?,?)',
            ['Chofer sintético', `entrega-${lote}@example.invalid`, 'hash-no-utilizable', 'CHOFER']);
        const chofer = u.insertId;
        const [cl] = await db.query('INSERT INTO clientes (nombre) VALUES (?)', ['Cliente sintético']);
        async function crear() {
            const [r] = await db.query('INSERT INTO pedidos (cliente_id,estado,chofer_id) VALUES (?,?,?)', [cl.insertId, 'EN ENVÍO', chofer]);
            await db.query('INSERT INTO direcciones (pedido_id,estado_validacion) VALUES (?,?)', [r.insertId, 'CONFIRMADA']);
            return r.insertId;
        }
        const servicio = createEntregaService({ repositorio: createEntregaRepository(db) });
        const id = await crear();
        const fallo = { resultado: 'FALLIDA', motivo: 'No responde', operacion_id: 'c1f45a2d-7e45-4c72-9107-f12345678901' };
        await Promise.all([servicio.registrar(id, chofer, fallo), servicio.registrar(id, chofer, fallo)]);
        const [[preparado]] = await db.query('SELECT estado FROM pedidos WHERE id=?', [id]);
        assert.equal(preparado.estado, 'EN PREPARACIÓN');
        let [[hist]] = await db.query('SELECT COUNT(*) cantidad FROM historial_estados WHERE pedido_id=?', [id]);
        assert.equal(hist.cantidad, 1);
        await db.query('UPDATE pedidos SET estado=? WHERE id=?', ['EN ENVÍO', id]);
        await servicio.registrar(id, chofer, fallo); // respuesta perdida del intento anterior
        const [[sinRetroceso]] = await db.query('SELECT estado FROM pedidos WHERE id=?', [id]);
        assert.equal(sinRetroceso.estado, 'EN ENVÍO');
        const entrega = { resultado: 'ENTREGADO', operacion_id: 'c1f45a2d-7e45-4c72-9107-f12345678902' };
        await Promise.all([servicio.registrar(id, chofer, entrega), servicio.registrar(id, chofer, entrega)]);
        await assert.rejects(() => servicio.registrar(id, chofer + 100000, entrega), e => e.statusCode === 404);
        const datosPago = { metodo: 'TRANSFERENCIA', monto: '1350.50' };
        await Promise.all([servicio.pago(id, chofer, datosPago), servicio.pago(id, chofer, datosPago)]);
        await assert.rejects(() => servicio.pago(id, chofer, { ...datosPago, metodo: 'EFECTIVO' }), e => e.statusCode === 409);
        const [[pagos]] = await db.query('SELECT COUNT(*) cantidad FROM pagos WHERE pedido_id=?', [id]);
        assert.equal(pagos.cantidad, 1);
        [[hist]] = await db.query('SELECT COUNT(*) cantidad FROM historial_estados WHERE pedido_id=?', [id]);
        assert.equal(hist.cantidad, 3); // fallo, entrega y registro pago
        const historial = await servicio.historial(id, { id: chofer, rol: 'CHOFER' });
        assert.equal(historial.length, 3);
        assert.ok(historial.every(h => h.fecha && h.usuario_nombre === 'Chofer sintético'));
        assert.ok((await servicio.entregados(chofer)).some(p => p.id === id && p.pago_metodo === 'TRANSFERENCIA'));
        const [[final]] = await db.query('SELECT estado FROM pedidos WHERE id=?', [id]);
        assert.equal(final.estado, 'ENTREGADO');
        const fallando = createEntregaService({ repositorio: createEntregaRepository({ async getConnection() {
            const c = await db.getConnection();
            return { beginTransaction: () => c.beginTransaction(), commit: () => c.commit(), rollback: () => c.rollback(), release: () => c.release(),
                query(sql, valores) { if (sql.includes('INSERT INTO historial_estados')) throw new Error('fallo sintético'); return c.query(sql, valores); } };
        } }) });
        const idFalla = await crear();
        await assert.rejects(() => fallando.registrar(idFalla, chofer, entrega), /fallo sintético/);
        const [[revertido]] = await db.query('SELECT estado FROM pedidos WHERE id=?', [idFalla]);
        assert.equal(revertido.estado, 'EN ENVÍO');
        await servicio.registrar(idFalla, chofer, entrega);
        await assert.rejects(() => fallando.pago(idFalla, chofer, datosPago), /fallo sintético/);
        const [[sinPago]] = await db.query('SELECT COUNT(*) cantidad FROM pagos WHERE pedido_id=?', [idFalla]);
        assert.equal(sinPago.cantidad, 0);
    } finally { await db.end(); }
    // Datos exclusivamente sintéticos en contenedor desechable; no se borra la base de desarrollo.
});
