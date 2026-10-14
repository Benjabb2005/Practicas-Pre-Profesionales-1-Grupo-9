// Acceso a pedidos/direcciones para el cambio de estado. La transición la decide
// el servicio; acá solo se lee el pedido con su dirección y se registra el cambio.
function createEstadoPedidoRepository(db) {
    return {
        async obtenerPedidoConDireccion(pedidoId) {
            const [filas] = await db.query(
                `SELECT p.id, p.estado, p.direccion_validada, d.estado_validacion
                 FROM pedidos p
                 LEFT JOIN direcciones d ON d.pedido_id = p.id
                 WHERE p.id = ?`,
                [pedidoId]
            );
            return filas[0] || null;
        },

        // Cambio de estado + historial en una sola transacción.
        async registrarCambio({ pedidoId, estadoAnterior, estadoNuevo, usuarioId, observaciones }) {
            const conexion = await db.getConnection();
            try {
                await conexion.beginTransaction();
                await conexion.query("UPDATE pedidos SET estado = ? WHERE id = ?", [estadoNuevo, pedidoId]);
                await conexion.query(
                    `INSERT INTO historial_estados (pedido_id, estado_anterior, estado_nuevo, usuario_id, observaciones)
                     VALUES (?, ?, ?, ?, ?)`,
                    [pedidoId, estadoAnterior, estadoNuevo, usuarioId ?? null, observaciones ?? null]
                );
                await conexion.commit();
            } catch (error) {
                await conexion.rollback();
                throw error;
            } finally {
                conexion.release();
            }
        },
    };
}

module.exports = { createEstadoPedidoRepository };
