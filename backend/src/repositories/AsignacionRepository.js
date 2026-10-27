const SELECT = `SELECT p.id, p.codigo, p.estado, p.chofer_id, p.observaciones,
    p.importe_base,p.recargo_total,p.importe_total,p.proxima_visita,
    pa.metodo AS pago_metodo,pa.monto AS pago_monto,
    (SELECT COUNT(*) FROM comprobantes_pago cp WHERE cp.pago_id=pa.id) AS comprobantes_cantidad,
    c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
    u.nombre AS chofer_nombre, u.rol AS chofer_rol, u.activo AS chofer_activo, d.estado_validacion, d.calle, d.altura, d.localidad,
    d.provincia, d.piso_depto, d.entre_calles, d.codigo_postal, d.latitud, d.longitud
    FROM pedidos p JOIN clientes c ON c.id=p.cliente_id
    LEFT JOIN usuarios u ON u.id=p.chofer_id
    LEFT JOIN direcciones d ON d.pedido_id=p.id LEFT JOIN pagos pa ON pa.pedido_id=p.id`;
const PROPIOS = `p.chofer_id=? AND p.estado='EN ENVÍO' AND d.estado_validacion='CONFIRMADA'`;

function createAsignacionRepository(db) {
    return {
        async cambiarEstado(id, estadoNuevo, usuarioId, validar) {
            const conexion = await db.getConnection();
            try {
                await conexion.beginTransaction();
                const [pedidos] = await conexion.query(
                    `SELECT p.id, p.estado, p.chofer_id, d.estado_validacion
                     FROM pedidos p LEFT JOIN direcciones d ON d.pedido_id=p.id
                     WHERE p.id=? FOR UPDATE`, [id]);
                const pedido = pedidos[0];
                const [choferes] = pedido?.chofer_id == null ? [[]] : await conexion.query(
                    'SELECT id, rol, activo FROM usuarios WHERE id=? FOR UPDATE', [pedido.chofer_id]);
                validar(pedido, estadoNuevo, choferes[0]);
                await conexion.query('UPDATE pedidos SET estado=? WHERE id=?', [estadoNuevo, id]);
                await conexion.query(
                    `INSERT INTO historial_estados (pedido_id, estado_anterior, estado_nuevo, usuario_id, observaciones)
                     VALUES (?, ?, ?, ?, ?)`,
                    [id, pedido.estado, estadoNuevo, usuarioId,
                        estadoNuevo === 'EN ENVÍO' ? `Despacho con chofer #${pedido.chofer_id}` : 'Preparación del pedido']);
                const [actualizados] = await conexion.query(`${SELECT} WHERE p.id=?`, [id]);
                await conexion.commit();
                return actualizados[0];
            } catch (error) {
                await conexion.rollback();
                throw error;
            } finally { conexion.release(); }
        },
        async listar() {
            const [filas] = await db.query(`${SELECT} ORDER BY p.id DESC`);
            return filas;
        },
        async choferes() {
            const [filas] = await db.query("SELECT id, nombre FROM usuarios WHERE rol='CHOFER' AND activo=1 ORDER BY nombre");
            return filas;
        },
        async propios(usuarioId) {
            const [filas] = await db.query(`${SELECT} WHERE ${PROPIOS} ORDER BY p.id`, [usuarioId]);
            return filas;
        },
        async propio(id, usuarioId) {
            const [filas] = await db.query(`${SELECT} WHERE ${PROPIOS} AND p.id=?`, [usuarioId, id]);
            return filas[0] || null;
        },
        async asignar(id, choferId, usuarioId, validar) {
            const conexion = await db.getConnection();
            try {
                await conexion.beginTransaction();
                const [pedidos] = await conexion.query(
                    `SELECT p.id, p.estado, p.chofer_id, d.estado_validacion
                     FROM pedidos p LEFT JOIN direcciones d ON d.pedido_id=p.id
                     WHERE p.id=? FOR UPDATE`, [id]);
                const [choferes] = choferId === null ? [[]] : await conexion.query(
                    'SELECT id, rol, activo FROM usuarios WHERE id=? FOR UPDATE', [choferId]);
                const pedido = pedidos[0];
                validar(pedido, choferId, choferes[0]);
                if (pedido.chofer_id !== choferId) {
                    await conexion.query('UPDATE pedidos SET chofer_id=? WHERE id=?', [choferId, id]);
                    await conexion.query(
                        `INSERT INTO historial_estados (pedido_id, estado_anterior, estado_nuevo, usuario_id, observaciones)
                         VALUES (?, ?, ?, ?, ?)`,
                        [id, pedido.estado, pedido.estado, usuarioId,
                            `Asignación de chofer: ${pedido.chofer_id ?? 'sin asignar'} → ${choferId ?? 'sin asignar'}`]);
                }
                const [actualizados] = await conexion.query(`${SELECT} WHERE p.id=?`, [id]);
                await conexion.commit();
                return actualizados[0];
            } catch (error) {
                await conexion.rollback();
                throw error;
            } finally {
                conexion.release();
            }
        },
    };
}

module.exports = { createAsignacionRepository };
