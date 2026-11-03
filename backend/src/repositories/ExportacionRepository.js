const { noEncontrado } = require('../lib/errors');

function createExportacionRepository(db) {
    return {
        async obtener(id, usuario) {
            const c = await db.getConnection();
            try {
                // La foto de datos e historiales debe corresponder a una misma
                // lectura, incluso si un operador trabaja mientras se descarga.
                await c.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
                await c.beginTransaction();
                const [[pedido]] = await c.query(`SELECT p.id,p.codigo,p.estado,p.canal_origen,p.observaciones,
                    p.created_at,p.updated_at,p.chofer_id,p.importe_base,p.recargo_total,p.importe_total,
                    p.intentos_fallidos,p.proxima_visita,
                    cl.nombre AS cliente_nombre,cl.dni AS cliente_dni,cl.telefono AS cliente_telefono,
                    cl.email AS cliente_email,cl.tipo AS cliente_tipo,
                    ch.nombre AS chofer_nombre,cr.nombre AS creado_por_nombre,
                    d.id AS direccion_id,d.direccion_original,d.calle,d.altura,d.piso_depto,d.entre_calles,
                    d.localidad,d.provincia,d.codigo_postal,d.latitud,d.longitud,d.nivel_confianza,d.estado_validacion,
                    pa.metodo AS pago_metodo,pa.monto AS pago_monto,pa.fecha AS pago_fecha,
                    (SELECT COUNT(*) FROM comprobantes_pago cp WHERE cp.pago_id=pa.id) AS comprobantes_cantidad,
                    pagador.nombre AS pago_registrado_por
                    FROM pedidos p
                    JOIN usuarios acceso ON acceso.id=? AND acceso.activo=1 AND acceso.rol=?
                    JOIN clientes cl ON cl.id=p.cliente_id
                    LEFT JOIN usuarios ch ON ch.id=p.chofer_id
                    LEFT JOIN usuarios cr ON cr.id=p.creado_por
                    LEFT JOIN direcciones d ON d.pedido_id=p.id
                    LEFT JOIN pagos pa ON pa.pedido_id=p.id
                    LEFT JOIN usuarios pagador ON pagador.id=pa.registrado_por
                    WHERE p.id=? AND (acceso.rol IN ('ADMINISTRADOR','OPERADOR')
                        OR (acceso.rol='CHOFER' AND p.chofer_id=acceso.id))`, [usuario.id, usuario.rol, id]);
                if (!pedido) throw noEncontrado('El pedido no está disponible para exportar.');
                const [historial] = await c.query(`SELECT h.id,h.fecha,h.estado_anterior,h.estado_nuevo,
                    h.observaciones,u.nombre AS usuario_nombre FROM historial_estados h
                    LEFT JOIN usuarios u ON u.id=h.usuario_id WHERE h.pedido_id=? ORDER BY h.fecha,h.id`, [id]);
                const [geolocalizacion] = pedido.direccion_id == null ? [[]] : await c.query(`SELECT h.id,h.fecha,
                    h.direccion_enviada,h.resultado,h.latitud,h.longitud,h.nivel_confianza,h.accion_operador,
                    u.nombre AS usuario_nombre FROM historial_geolocalizacion h
                    LEFT JOIN usuarios u ON u.id=h.usuario_id WHERE h.direccion_id=? ORDER BY h.fecha,h.id`, [pedido.direccion_id]);
                await c.commit();
                return { pedido, historial, geolocalizacion, exportado_en: new Date().toISOString() };
            } catch (error) {
                await c.rollback();
                throw error;
            } finally { c.release(); }
        },
    };
}

module.exports = { createExportacionRepository };
