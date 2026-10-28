const { test } = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const { createEntregaRepository } = require('../src/repositories/EntregaRepository');
const { createEntregaService } = require('../src/services/EntregaService');
const { createAsignacionRepository } = require('../src/repositories/AsignacionRepository');
const { validarDespacho } = require('../src/services/AsignacionService');

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
        const [a] = await db.query('INSERT INTO usuarios(nombre,email,password_hash,rol) VALUES(?,?,?,?)',['Admin sintético',`admin-${lote}@example.invalid`,'hash-no-utilizable','ADMINISTRADOR']);
        const admin=a.insertId;
        const [cl] = await db.query('INSERT INTO clientes (nombre) VALUES (?)', ['Cliente sintético']);
        async function crear() {
            const [r] = await db.query('INSERT INTO pedidos (cliente_id,estado,chofer_id,importe_base) VALUES (?,?,?,?)', [cl.insertId, 'EN ENVÍO', chofer,'1000.00']);
            await db.query('INSERT INTO direcciones (pedido_id,estado_validacion) VALUES (?,?)', [r.insertId, 'CONFIRMADA']);
            return r.insertId;
        }
        const servicio = createEntregaService({ repositorio: createEntregaRepository(db) });
        const id = await crear();
        const fallo = { resultado: 'FALLIDA', motivo: 'No responde', operacion_id: 'c1f45a2d-7e45-4c72-9107-f12345678901' };
        await Promise.all([servicio.registrar(id, chofer, fallo), servicio.registrar(id, chofer, fallo)]);
        const [[preparado]] = await db.query('SELECT estado FROM pedidos WHERE id=?', [id]);
        assert.equal(preparado.estado, 'EN PREPARACIÓN');
        const [[costo]] = await db.query('SELECT importe_base,recargo_total,importe_total,proxima_visita FROM pedidos WHERE id=?', [id]);
        assert.equal(costo.recargo_total, '500.00');
        assert.equal(costo.importe_total, '1500.00');
        assert.ok(costo.proxima_visita);
        const [[dia]] = await db.query('SELECT DATE_ADD(DATE(UTC_TIMESTAMP()-INTERVAL 3 HOUR),INTERVAL 1 DAY) manana');
        assert.equal(costo.proxima_visita.getTime(),dia.manana.getTime());
        const manual = await createAsignacionRepository(db).cambiarEstado(id,'EN ENVÍO',chofer,validarDespacho);
        assert.equal(manual.estado,'EN ENVÍO');
        let [[hist]] = await db.query('SELECT COUNT(*) cantidad FROM historial_estados WHERE pedido_id=?', [id]);
        assert.equal(hist.cantidad, 2); // fallo y despacho manual
        await db.query('UPDATE pedidos SET estado=? WHERE id=?', ['EN ENVÍO', id]);
        await servicio.registrar(id, chofer, fallo); // respuesta perdida del intento anterior
        const [[sinRetroceso]] = await db.query('SELECT estado FROM pedidos WHERE id=?', [id]);
        assert.equal(sinRetroceso.estado, 'EN ENVÍO');
        const fallo2 = { ...fallo,operacion_id: 'c1f45a2d-7e45-4c72-9107-f12345678903' };
        await servicio.registrar(id,chofer,fallo2);
        const [[dosFallos]] = await db.query('SELECT importe_total,recargo_total,intentos_fallidos FROM pedidos WHERE id=?',[id]);
        assert.equal(dosFallos.importe_total,'2000.00');
        assert.equal(dosFallos.recargo_total,'1000.00');
        assert.equal(dosFallos.intentos_fallidos,2);
        await db.query('UPDATE pedidos SET estado=? WHERE id=?',['EN ENVÍO',id]);
        const entrega = { resultado: 'ENTREGADO', operacion_id: 'c1f45a2d-7e45-4c72-9107-f12345678902' };
        await Promise.all([servicio.registrar(id, chofer, entrega), servicio.registrar(id, chofer, entrega)]);
        await assert.rejects(() => servicio.registrar(id, chofer + 100000, entrega), e => e.statusCode === 404);
        const datosPago = { metodo: 'TRANSFERENCIA' };
        await Promise.all([servicio.pago(id, chofer, datosPago), servicio.pago(id, chofer, datosPago)]);
        await assert.rejects(() => servicio.pago(id, chofer, { ...datosPago, metodo: 'EFECTIVO' }), e => e.statusCode === 409);
        const [[pagos]] = await db.query('SELECT COUNT(*) cantidad FROM pagos WHERE pedido_id=?', [id]);
        assert.equal(pagos.cantidad, 1);
        [[hist]] = await db.query('SELECT COUNT(*) cantidad FROM historial_estados WHERE pedido_id=?', [id]);
        assert.equal(hist.cantidad, 5); // dos fallos, despacho manual, entrega y pago
        const historial = await servicio.historial(id, { id: chofer, rol: 'CHOFER' });
        assert.equal(historial.length, 5);
        assert.ok(historial.every(h => h.fecha && h.usuario_nombre === 'Chofer sintético'));
        assert.ok((await servicio.entregados(chofer)).some(p => p.id === id && p.pago_metodo === 'TRANSFERENCIA'));
        const [[final]] = await db.query('SELECT estado FROM pedidos WHERE id=?', [id]);
        assert.equal(final.estado, 'ENTREGADO');
        const [[pagoReal]] = await db.query('SELECT monto FROM pagos WHERE pedido_id=?',[id]);
        assert.equal(pagoReal.monto,'2000.00');
        await assert.rejects(()=>servicio.acreditar(id,chofer),e=>e.statusCode===403);
        await Promise.all([servicio.acreditar(id,admin),servicio.acreditar(id,admin)]);
        const [[pagado]] = await db.query('SELECT estado FROM pedidos WHERE id=?',[id]);
        assert.equal(pagado.estado,'PAGADO');
        const [[acreditaciones]] = await db.query('SELECT COUNT(*) cantidad FROM historial_estados WHERE pedido_id=? AND estado_nuevo=?',[id,'PAGADO']);
        assert.equal(acreditaciones.cantidad,1);
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
        await servicio.pago(idFalla,chofer,datosPago);
        await assert.rejects(()=>fallando.acreditar(idFalla,admin),/fallo sintético/);
        const [[noAcreditado]]=await db.query('SELECT estado FROM pedidos WHERE id=?',[idFalla]);
        assert.equal(noAcreditado.estado,'ENTREGADO');
        const cash=await crear();await servicio.registrar(cash,chofer,entrega);
        await Promise.all([servicio.pago(cash,chofer,{metodo:'EFECTIVO'}),servicio.pago(cash,chofer,{metodo:'EFECTIVO'})]);
        const [[efectivo]]=await db.query('SELECT estado FROM pedidos WHERE id=?',[cash]);
        assert.equal(efectivo.estado,'PAGADO');
    } finally { await db.end(); }
    // Datos exclusivamente sintéticos en contenedor desechable; no se borra la base de desarrollo.
});
