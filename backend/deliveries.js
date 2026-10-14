const express = require('express');
const { createHash } = require('node:crypto');
const reasons = ['cliente_ausente', 'rechazado', 'direccion_incorrecta', 'sin_acceso', 'otro'];
const issue = (status, code, message) => Object.assign(new Error(message), { status, code, fields: {} });
function validateKey(key) {
    if (typeof key !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(key)) throw issue(422, 'INVALID_DELIVERY_KEY', 'La solicitud necesita una clave válida para evitar duplicados.');
}
function validateResult(body, key) {
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((field) => !['resultado', 'receptor', 'motivo', 'observacion', 'metodoPago'].includes(field))) throw issue(422, 'INVALID_DELIVERY', 'Los datos del resultado no son válidos.');
    validateKey(key);
    const text = (field, max) => {
        if (body[field] !== undefined && (typeof body[field] !== 'string' || body[field].length > max)) throw issue(422, 'INVALID_DELIVERY', 'Revisá los datos del resultado.');
        return (body[field] || '').trim();
    };
    const receptor = text('receptor', 150), motivo = text('motivo', 50), observacion = text('observacion', 1000), metodoPago = text('metodoPago', 30);
    if (body.resultado === 'entregado') {
        if (!receptor || motivo) throw issue(422, 'RECEIVER_REQUIRED', 'Indicá el nombre de quien recibió el pedido.');
        if (!['efectivo', 'transferencia'].includes(metodoPago)) throw issue(422, 'PAYMENT_METHOD_REQUIRED', 'Seleccioná efectivo o transferencia como método de pago.');
    }
    else if (body.resultado === 'fallido') { if (!reasons.includes(motivo) || receptor || metodoPago) throw issue(422, 'FAILURE_REASON_REQUIRED', 'Seleccioná el motivo del intento fallido.'); }
    else throw issue(422, 'INVALID_DELIVERY', 'Seleccioná entrega o intento fallido.');
    return { resultado: body.resultado, receptor, motivo, observacion, metodoPago };
}
function createDeliveryStore(pool) {
    async function records(id, connection) {
        const [rows] = await connection.execute("SELECT h.id, h.observaciones, h.usuario, h.created_at, u.nombre AS responsable_nombre FROM historial_estados h LEFT JOIN usuarios u ON h.usuario = CONCAT('usuario:', u.id) WHERE h.pedido_id = ? ORDER BY h.id DESC", [id]);
        return rows.flatMap((row) => {
            let data; try { data = JSON.parse(row.observaciones); } catch { return []; }
            return ['resultado_entrega', 'reintento'].includes(data?.accion) ? [{ id: row.id, fecha: row.created_at, responsable: row.usuario, responsableNombre: row.responsable_nombre, ...data }] : [];
        });
    }
    async function operate(id, user, work) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [rows] = await connection.execute('SELECT id, estado, chofer_id FROM pedidos WHERE id = ? FOR UPDATE', [id]);
            if (!['admin', 'operador', 'chofer'].includes(user.rol)) throw issue(403, 'FORBIDDEN', 'No tenés permiso para esta operación.');
            if (!rows.length || (user.rol === 'chofer' && rows[0].chofer_id !== user.id)) throw issue(404, 'ORDER_NOT_FOUND', 'El pedido no está disponible.');
            const result = await work(rows[0], connection);
            await connection.commit(); return result;
        } catch (error) { await connection.rollback(); throw error; }
        finally { connection.release(); }
    }
    async function event(id, order, next, data, user, connection) {
        await connection.execute('UPDATE pedidos SET estado = ? WHERE id = ?', [next, id]);
        await connection.execute('INSERT INTO historial_estados (pedido_id, estado_anterior, estado_nuevo, observaciones, usuario) VALUES (?, ?, ?, ?, ?)', [id, order.estado, next, JSON.stringify(data), `usuario:${user.id}`]);
        return { id, estado: next, replayed: false };
    }
    return {
        history(id, user) { return operate(id, user, async (_order, connection) => (await records(id, connection)).map(({ hash, clave, ...record }) => record)); },
        finish(id, body, key, user) {
            const data = validateResult(body, key);
            const hash = createHash('sha256').update(JSON.stringify({ ...data, responsable: user.id })).digest('hex');
            return operate(id, user, async (order, connection) => {
                const previous = (await records(id, connection)).find((record) => record.clave === key);
                if (previous) {
                    if (previous.hash !== hash) throw issue(409, 'DELIVERY_CONFLICT', 'Esta solicitud ya se registró con otros datos.');
                    return { id, estado: order.estado, replayed: true };
                }
                if (order.estado !== 'en_camino') throw issue(409, 'INVALID_TRANSITION', 'Solo se puede registrar el resultado de un pedido En envío.');
                return event(id, order, data.resultado, { accion: 'resultado_entrega', ...data, choferId: order.chofer_id, clave: key, hash }, user, connection);
            });
        },
        retry(id, user, key) {
            if (!['admin', 'operador'].includes(user.rol)) throw issue(403, 'FORBIDDEN', 'Solo administrador u operador pueden preparar un reintento.');
            validateKey(key);
            return operate(id, user, async (order, connection) => {
                const previous = (await records(id, connection)).find((record) => record.clave === key);
                if (previous) {
                    if (previous.accion !== 'reintento' || previous.responsable !== `usuario:${user.id}`) throw issue(409, 'DELIVERY_CONFLICT', 'Esta solicitud ya se usó para otro registro.');
                    return { id, estado: order.estado, replayed: true };
                }
                if (order.estado !== 'fallido') throw issue(409, 'INVALID_TRANSITION', 'Solo un pedido Fallido puede volver a preparación para reintentar.');
                await connection.execute('UPDATE pedidos SET chofer_id = NULL WHERE id = ?', [id]);
                return event(id, order, 'en_preparacion', { accion: 'reintento', choferAnterior: order.chofer_id, clave: key }, user, connection);
            });
        },
    };
}
function createDeliveries({ store, authenticate }) {
    const router = express.Router(); router.use(authenticate);
    const id = (value) => { if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw issue(400, 'INVALID_ID', 'El identificador no es válido.'); return Number(value); };
    router.get('/pedidos/:id/entregas', async (req, res, next) => { try { res.json({ data: await store.history(id(req.params.id), req.user) }); } catch (error) { next(error); } });
    router.post('/pedidos/:id/resultado', async (req, res, next) => { try { res.json({ data: await store.finish(id(req.params.id), req.body, req.get('Idempotency-Key'), req.user) }); } catch (error) { next(error); } });
    router.post('/pedidos/:id/reintentar', async (req, res, next) => { try {
        if (!req.body || Array.isArray(req.body) || typeof req.body !== 'object' || Object.keys(req.body).length) throw issue(422, 'INVALID_RETRY', 'El reintento no admite cambios de datos.');
        res.json({ data: await store.retry(id(req.params.id), req.user, req.get('Idempotency-Key')) });
    } catch (error) { next(error); } });
    return router;
}
module.exports = { createDeliveries, createDeliveryStore, validateResult };
