const { conflicto, noAutorizado, noEncontrado } = require('../lib/errors');
const { validarPropio } = require('../services/EntregaService');
const { validarTransicion } = require('../services/EstadoPedidoService');
const { recargoPorIntentos } = require('../lib/importes');

function createEntregaRepository(db) {
    async function transaccion(id, usuarioId, ejecutar) {
        const c = await db.getConnection();
        try {
            await c.beginTransaction();
            const [[pedido]] = await c.query(`SELECT p.id,p.estado,p.chofer_id,p.importe_base,p.recargo_total,p.importe_total,p.intentos_fallidos,d.estado_validacion
                FROM pedidos p LEFT JOIN direcciones d ON d.pedido_id=p.id WHERE p.id=? FOR UPDATE`, [id]);
            validarPropio(pedido, usuarioId);
            const [[usuario]] = await c.query('SELECT id,rol,activo FROM usuarios WHERE id=? FOR UPDATE', [usuarioId]);
            if (!usuario?.activo || usuario.rol !== 'CHOFER') throw noAutorizado();
            const resultado = await ejecutar(c, pedido);
            await c.commit();
            return resultado;
        } catch (e) { await c.rollback(); throw e; }
        finally { c.release(); }
    }
    return {
        registrar(id, usuarioId, datos, validar) {
            return transaccion(id, usuarioId, async (c, pedido) => {
                const prefijo = `Entrega [${datos.operacion_id}] `;
                const detalle = prefijo + (datos.resultado === 'ENTREGADO' ? 'ENTREGADO' : `FALLIDA: ${datos.motivo}`);
                const [[anterior]] = await c.query(`SELECT id,observaciones FROM historial_estados
                    WHERE pedido_id=? AND usuario_id=? AND LEFT(observaciones,?)=?`, [id, usuarioId, prefijo.length, prefijo]);
                if (anterior) {
                    if (anterior.observaciones !== detalle) throw conflicto('Ese intento ya fue registrado con otros datos.');
                    return { id, estado: pedido.estado, repetido: true };
                }
                // Otro envío de confirmación no repite un cambio ya realizado por el mismo chofer.
                if (pedido.estado === 'ENTREGADO' && datos.resultado === 'ENTREGADO') return { id, estado: pedido.estado, repetido: true };
                validar(pedido, usuarioId, datos.resultado);
                const estado = datos.resultado === 'ENTREGADO' ? 'ENTREGADO' : 'EN PREPARACIÓN';
                if (datos.resultado === 'FALLIDA') {
                    const intentos = Number(pedido.intentos_fallidos || 0) + 1;
                    const recargo = recargoPorIntentos(pedido.importe_base, intentos);
                    await c.query(`UPDATE pedidos SET estado=?,intentos_fallidos=?,recargo_total=?,
                        proxima_visita=DATE_ADD(DATE(UTC_TIMESTAMP()-INTERVAL 3 HOUR),INTERVAL 1 DAY) WHERE id=?`, [estado,intentos,recargo,id]);
                } else await c.query('UPDATE pedidos SET estado=? WHERE id=?', [estado, id]);
                await c.query(`INSERT INTO historial_estados (pedido_id,estado_anterior,estado_nuevo,usuario_id,observaciones)
                    VALUES (?,?,?,?,?)`, [id, pedido.estado, estado, usuarioId, detalle]);
                return { id, estado, repetido: false };
            });
        },
        pago(id, usuarioId, datos, validar) {
            return transaccion(id, usuarioId, async (c, pedido) => {
                validar(pedido, usuarioId);
                const [[pago]] = await c.query('SELECT id,metodo,monto,registrado_por,fecha FROM pagos WHERE pedido_id=?', [id]);
                if (pago) {
                    if (pago.metodo !== datos.metodo) throw conflicto('El pedido ya tiene un pago registrado. No se modificó.');
                    return { ...pago, estado_pedido: pedido.estado, repetido: true };
                }
                if (pedido.estado === 'PAGADO') throw conflicto('El pedido ya figura pagado. Revisá el registro existente con administración.');
                if (pedido.importe_total == null) throw conflicto('El pedido no tiene importe cargado. Contactá al operador.');
                const monto = String(pedido.importe_total);
                const efectivo = datos.metodo === 'EFECTIVO';
                if (efectivo) validarTransicion({ estadoActual:pedido.estado, estadoNuevo:'PAGADO',direccion:pedido });
                const [r] = await c.query('INSERT INTO pagos (pedido_id,metodo,monto,registrado_por) VALUES (?,?,?,?)',
                    [id, datos.metodo, monto, usuarioId]);
                if (efectivo) await c.query('UPDATE pedidos SET estado=? WHERE id=?',['PAGADO',id]);
                await c.query(`INSERT INTO historial_estados (pedido_id,estado_anterior,estado_nuevo,usuario_id,observaciones)
                    VALUES (?,?,?,?,?)`, [id, pedido.estado, efectivo ? 'PAGADO' : pedido.estado, usuarioId,
                    efectivo ? 'Cobro en efectivo confirmado por el chofer.' : 'Transferencia informada. Pendiente de acreditación por administrador.']);
                return { id: r.insertId, metodo: datos.metodo, monto, estado_pedido:efectivo ? 'PAGADO' : pedido.estado, repetido: false };
            });
        },
        async acreditar(id, usuarioId) {
            const c = await db.getConnection();
            try {
                await c.beginTransaction();
                const [[pedido]] = await c.query('SELECT id,estado FROM pedidos WHERE id=? FOR UPDATE',[id]);
                const [[usuario]] = await c.query('SELECT id,rol,activo FROM usuarios WHERE id=? FOR UPDATE',[usuarioId]);
                if (!usuario?.activo || usuario.rol !== 'ADMINISTRADOR') throw noAutorizado();
                if (!pedido) throw noEncontrado();
                const [[pago]] = await c.query('SELECT id,metodo,monto FROM pagos WHERE pedido_id=? FOR UPDATE',[id]);
                if (!pago || pago.metodo !== 'TRANSFERENCIA') throw conflicto('El pedido no tiene una transferencia informada para acreditar.');
                if (pedido.estado === 'PAGADO') { await c.commit(); return { id,estado:'PAGADO',repetido:true }; }
                validarTransicion({ estadoActual:pedido.estado,estadoNuevo:'PAGADO',direccion:pedido });
                await c.query('UPDATE pedidos SET estado=? WHERE id=?',['PAGADO',id]);
                await c.query(`INSERT INTO historial_estados (pedido_id,estado_anterior,estado_nuevo,usuario_id,observaciones)
                    VALUES (?,?,?,?,?)`,[id,pedido.estado,'PAGADO',usuarioId,'Transferencia acreditada por administrador.']);
                await c.commit();
                return { id,estado:'PAGADO',repetido:false };
            } catch(e) { await c.rollback();throw e; }
            finally { c.release(); }
        },
        async entregados(usuarioId) {
            const [filas] = await db.query(`SELECT p.id,p.codigo,p.estado,p.importe_base,p.recargo_total,p.importe_total,p.proxima_visita,c.nombre AS cliente_nombre,
                d.calle,d.altura,d.localidad,pa.metodo AS pago_metodo,pa.monto AS pago_monto,
                (SELECT COUNT(*) FROM comprobantes_pago cp WHERE cp.pago_id=pa.id) AS comprobantes_cantidad,
                (SELECT MAX(h.fecha) FROM historial_estados h WHERE h.pedido_id=p.id
                  AND h.estado_anterior='EN ENVÍO' AND h.estado_nuevo='ENTREGADO') AS entregado_fecha
                FROM pedidos p JOIN clientes c ON c.id=p.cliente_id
                LEFT JOIN direcciones d ON d.pedido_id=p.id LEFT JOIN pagos pa ON pa.pedido_id=p.id
                WHERE p.chofer_id=? AND p.estado IN ('ENTREGADO','PAGADO') ORDER BY p.id DESC`, [usuarioId]);
            return filas;
        },
        async historial(id, validar) {
            const [[pedido]] = await db.query('SELECT id,chofer_id FROM pedidos WHERE id=?', [id]);
            validar(pedido);
            // Comprobar nuevamente dueño en la consulta evita filtrar datos si se reasigna entre lecturas.
            const [filas] = await db.query(`SELECT h.id,h.estado_anterior,h.estado_nuevo,h.observaciones,h.fecha,
                u.nombre AS usuario_nombre FROM historial_estados h JOIN pedidos p ON p.id=h.pedido_id
                LEFT JOIN usuarios u ON u.id=h.usuario_id
                WHERE h.pedido_id=? AND p.chofer_id <=> ? ORDER BY h.fecha DESC,h.id DESC`, [id, pedido.chofer_id]);
            return filas;
        },
    };
}
module.exports = { createEntregaRepository };
