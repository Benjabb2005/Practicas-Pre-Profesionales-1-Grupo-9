const express = require('express');
const { createOrderStore } = require('./orders');
const { validAddress } = require('./georef');

function issue(status, code, message) { return Object.assign(new Error(message), { status, code, fields: {} }); }
const beforeDeparture = ['pendiente_validacion', 'requiere_revision', 'direccion_validada', 'listo_despacho', 'en_preparacion'];

function requireReviewed(order) {
    if (!validAddress(order) || !['nombre', 'apellido', 'dni', 'telefono', 'email'].every((field) => String(order[field] || '').trim())) throw issue(422, 'INCOMPLETE_ORDER', 'El pedido tiene datos incompletos y no puede prepararse ni despacharse.');
    if (!order.confirmation || !Number.isFinite(order.confirmation.lat) || !Number.isFinite(order.confirmation.lng)) throw issue(409, 'LOCATION_UNCONFIRMED', 'Revisá y confirmá la ubicación actual antes de continuar.');
}

function createDispatchStore(pool) {
    const orders = createOrderStore(pool);
    async function ready() {
        const [rows] = await pool.query("SHOW COLUMNS FROM pedidos LIKE 'chofer_id'");
        return rows.length === 1;
    }
    async function requireSchema() { if (!await ready()) throw issue(503, 'DISPATCH_UNAVAILABLE', 'La asignación y el despacho todavía no están activados en este entorno.'); }
    async function describe(id, connection = pool) {
        const [rows] = await connection.execute('SELECT p.chofer_id AS choferId, u.nombre AS choferNombre FROM pedidos p LEFT JOIN usuarios u ON u.id = p.chofer_id WHERE p.id = ?', [id]);
        return rows[0] || null;
    }
    return {
        async drivers() {
            const enabled = await ready();
            if (!enabled) return { enabled: false, drivers: [] };
            const [drivers] = await pool.query("SELECT id, nombre FROM usuarios WHERE rol = 'chofer' AND activo = 1 ORDER BY nombre, id");
            return { enabled: true, drivers };
        },
        async operation(id) { await requireSchema(); const result = await describe(id); if (!result) throw issue(404, 'ORDER_NOT_FOUND', 'El pedido no existe.'); return result; },
        async mutate(id, action, input, user) {
            await requireSchema();
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                const [rows] = await connection.execute('SELECT id, direccion_id, cliente_id, chofer_id FROM pedidos WHERE id = ? FOR UPDATE', [id]);
                if (!rows.length) throw issue(404, 'ORDER_NOT_FOUND', 'El pedido no existe.');
                const stored = rows[0];
                await connection.execute('SELECT id FROM direcciones WHERE id = ? FOR UPDATE', [stored.direccion_id]);
                await connection.execute('SELECT id FROM clientes WHERE id = ? FOR SHARE', [stored.cliente_id]);
                const order = await orders.detail(id, connection);
                let driverId = stored.chofer_id, nextState = order.estado;
                if (action === 'asignar') {
                    if (!beforeDeparture.includes(order.estado)) throw issue(409, 'ORDER_DEPARTED', 'Solo se puede cambiar el chofer antes de la salida.');
                    driverId = input.choferId;
                } else {
                    requireReviewed(order);
                    if (action === 'preparar') {
                        if (!beforeDeparture.includes(order.estado)) throw issue(409, 'INVALID_TRANSITION', 'Este pedido no puede pasar a preparación desde su estado actual.');
                        nextState = 'en_preparacion';
                    } else {
                        if (!['en_preparacion', 'en_camino'].includes(order.estado)) throw issue(409, 'INVALID_TRANSITION', 'Primero pasá el pedido a En preparación.');
                        if (!driverId) throw issue(409, 'DRIVER_REQUIRED', 'Asigná un chofer antes de despachar.');
                        nextState = 'en_camino';
                    }
                }
                if (driverId !== null) {
                    const [drivers] = await connection.execute("SELECT id FROM usuarios WHERE id = ? AND rol = 'chofer' AND activo = 1 FOR SHARE", [driverId]);
                    if (!drivers.length) throw issue(422, 'INVALID_DRIVER', 'Seleccioná un chofer activo.');
                }
                if (driverId !== stored.chofer_id || nextState !== order.estado) {
                    await connection.execute('UPDATE pedidos SET chofer_id = ?, estado = ? WHERE id = ?', [driverId, nextState, id]);
                    await connection.execute('INSERT INTO historial_estados (pedido_id, estado_anterior, estado_nuevo, observaciones, usuario) VALUES (?, ?, ?, ?, ?)', [id, order.estado, nextState, JSON.stringify({ accion: action, choferAnterior: stored.chofer_id, choferNuevo: driverId }), `usuario:${user.id}`]);
                }
                const result = { ...await orders.detail(id, connection), ...await describe(id, connection) };
                await connection.commit(); return result;
            } catch (error) { await connection.rollback(); throw error; }
            finally { connection.release(); }
        },
        async assigned(userId, page = 1, state = 'en_camino') {
            await requireSchema();
            const [counts] = await pool.execute("SELECT estado, COUNT(*) AS total FROM pedidos WHERE chofer_id = ? AND estado IN ('en_camino', 'entregado', 'fallido') GROUP BY estado", [userId]);
            const count = (value) => Number(counts.find((item) => item.estado === value)?.total || 0);
            const summary = { pendientes: count('en_camino'), entregados: count('entregado'), fallidos: count('fallido') };
            summary.total = summary.pendientes + summary.entregados + summary.fallidos;
            const [rows] = await pool.query('SELECT id FROM pedidos WHERE chofer_id = ? AND estado = ? ORDER BY created_at, id LIMIT 21 OFFSET ?', [userId, state, (page - 1) * 20]);
            const data = [];
            for (const row of rows.slice(0, 20)) { const result = await this.driverDetail(row.id, userId, state); if (result) data.push(result); }
            return { data, hasMore: rows.length > 20, page, summary };
        },
        async driverDetail(id, userId, state) {
            await requireSchema();
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                const [rows] = await connection.execute("SELECT id, estado FROM pedidos WHERE id = ? AND chofer_id = ? AND estado IN ('en_camino', 'entregado', 'fallido') FOR SHARE", [id, userId]);
                if (!rows.length || (state && rows[0].estado !== state)) { await connection.commit(); return null; }
                const order = await orders.detail(id, connection);
                await connection.commit();
                return { id: order.id, codigo: order.codigo, estado: order.estado, nombre: order.nombre, apellido: order.apellido, telefono: order.telefono, calle: order.calle, altura: order.altura, pisoDepto: order.pisoDepto, localidad: order.localidad, provincia: order.provincia, codigoPostal: order.codigoPostal, observaciones: order.observaciones, confirmation: order.confirmation ? { lat: order.confirmation.lat, lng: order.confirmation.lng } : null };
            } catch (error) { await connection.rollback(); throw error; }
            finally { connection.release(); }
        },
    };
}

function createDispatch({ store, authenticate }) {
    const router = express.Router(); router.use(authenticate);
    const staff = (req, res, next) => ['admin', 'operador'].includes(req.user.rol) ? next() : next(issue(403, 'FORBIDDEN', 'No tenés permiso para esta operación.'));
    const driver = (req, res, next) => req.user.rol === 'chofer' ? next() : next(issue(403, 'FORBIDDEN', 'Esta operación es exclusiva de chofer.'));
    const id = (value) => { if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) throw issue(400, 'INVALID_ID', 'El identificador no es válido.'); return Number(value); };
    router.get('/choferes', staff, async (req, res, next) => { try { res.json({ data: await store.drivers() }); } catch (error) { next(error); } });
    router.get('/pedidos/:id/operacion', staff, async (req, res, next) => { try { res.json({ data: await store.operation(id(req.params.id)) }); } catch (error) { next(error); } });
    for (const action of ['asignar', 'preparar', 'despachar']) router.post(`/pedidos/:id/${action}`, staff, async (req, res, next) => {
        try {
            const body = req.body;
            if (!body || Array.isArray(body) || typeof body !== 'object' || Object.keys(body).some((key) => action !== 'asignar' || key !== 'choferId') || (action === 'asignar' && body.choferId !== null && (!Number.isSafeInteger(body.choferId) || body.choferId <= 0))) throw issue(422, 'INVALID_OPERATION', 'La operación contiene datos inválidos.');
            res.json({ data: await store.mutate(id(req.params.id), action, body, req.user) });
        } catch (error) { next(error); }
    });
    router.get('/chofer/pedidos', driver, async (req, res, next) => { try {
        const page = Number(req.query.page || 1); if (!Number.isSafeInteger(page) || page < 1 || page > 100000) throw issue(400, 'INVALID_PAGE', 'La página no es válida.');
        const state = req.query.vista || 'en_camino';
        if (!['en_camino', 'entregado', 'fallido'].includes(state)) throw issue(400, 'INVALID_STATE', 'La vista de envíos no es válida.');
        res.json({ data: await store.assigned(req.user.id, page, state) });
    } catch (error) { next(error); } });
    router.get('/chofer/pedidos/:id', driver, async (req, res, next) => { try {
        const order = await store.driverDetail(id(req.params.id), req.user.id); if (!order) throw issue(404, 'ORDER_NOT_FOUND', 'El pedido no está disponible.'); res.json({ data: order });
    } catch (error) { next(error); } });
    return router;
}

module.exports = { createDispatchStore, createDispatch, requireReviewed };
