// Acceso a pedidos, direcciones e historial de geolocalización. La lógica de negocio
// (borradores, invalidación al cambiar dirección, bloqueo de despacho) vive en los
// servicios; acá solo hay SQL parametrizado y transacciones cortas.
const SELECT_DETALLE = `
    SELECT p.id, p.codigo, p.estado, p.canal_origen, p.direccion_validada, p.observaciones, p.cliente_id,
           p.created_at, p.updated_at,
           c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.email AS cliente_email,
           c.dni AS cliente_dni, c.tipo AS cliente_tipo,
           d.id AS direccion_id, d.direccion_original, d.calle, d.altura, d.piso_depto,
           d.entre_calles, d.localidad, d.provincia, d.codigo_postal,
           d.latitud, d.longitud, d.nivel_confianza, d.estado_validacion
    FROM pedidos p
    LEFT JOIN clientes c ON c.id = p.cliente_id
    LEFT JOIN direcciones d ON d.pedido_id = p.id`;

// Búsqueda de cliente para el listado: nombre, DNI, teléfono o email. Si el
// texto trae dígitos, también se busca por DNI/teléfono sin puntos ni guiones.
function condicionesCliente(cliente) {
    const patron = `%${cliente}%`;
    const condiciones = [
        "c.nombre LIKE ?",
        "c.dni LIKE ?",
        "c.telefono LIKE ?",
        "c.email LIKE ?",
    ];
    const valores = [patron, patron, patron, patron];
    const digitos = String(cliente).replace(/\D/g, "");
    if (digitos) {
        condiciones.push("c.dni LIKE ?", "c.telefono LIKE ?");
        valores.push(`%${digitos}%`, `%${digitos}%`);
    }
    return { condiciones, valores };
}

function createPedidoRepository(db) {
    return {
        async crear({ codigo, clienteId, canalOrigen, estado, observaciones, creadoPor, direccion }) {
            const conexion = await db.getConnection();
            try {
                await conexion.beginTransaction();
                const [pedido] = await conexion.query(
                    `INSERT INTO pedidos (codigo, cliente_id, canal_origen, estado, direccion_validada, observaciones, creado_por)
                     VALUES (?, ?, ?, ?, 0, ?, ?)`,
                    [codigo ?? null, clienteId, canalOrigen ?? null, estado, observaciones ?? null, creadoPor ?? null]
                );
                await conexion.query(
                    `INSERT INTO direcciones
                        (pedido_id, direccion_original, calle, altura, piso_depto, entre_calles, localidad, provincia, codigo_postal, estado_validacion)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        pedido.insertId,
                        direccion.direccion_original ?? null,
                        direccion.calle ?? null,
                        direccion.altura ?? null,
                        direccion.piso_depto ?? null,
                        direccion.entre_calles ?? null,
                        direccion.localidad ?? null,
                        direccion.provincia ?? null,
                        direccion.codigo_postal ?? null,
                        direccion.estado_validacion ?? "PENDIENTE",
                    ]
                );
                await conexion.commit();
                return pedido.insertId;
            } catch (error) {
                await conexion.rollback();
                throw error;
            } finally {
                conexion.release();
            }
        },

        // Filtros del listado: estado del pedido, estado de validación de la
        // dirección, texto de cliente y rango de fechas inclusivo por día.
        async listar({ estado, estadoValidacion, cliente, fechaDesde, fechaHasta } = {}) {
            const condiciones = [];
            const valores = [];
            if (estado) {
                condiciones.push("p.estado = ?");
                valores.push(estado);
            }
            if (estadoValidacion) {
                condiciones.push("d.estado_validacion = ?");
                valores.push(estadoValidacion);
            }
            if (cliente) {
                const busqueda = condicionesCliente(cliente);
                condiciones.push(`(${busqueda.condiciones.join(" OR ")})`);
                valores.push(...busqueda.valores);
            }
            if (fechaDesde) {
                condiciones.push("p.created_at >= ?");
                valores.push(fechaDesde);
            }
            if (fechaHasta) {
                // El día "hasta" se incluye completo: se compara contra el
                // comienzo del día siguiente, sin sumar horas a mano.
                condiciones.push("p.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
                valores.push(fechaHasta);
            }
            const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
            const [filas] = await db.query(
                `${SELECT_DETALLE}
                 ${where}
                 ORDER BY p.created_at DESC, p.id DESC`,
                valores
            );
            return filas;
        },

        async obtenerDetalle(pedidoId) {
            const [filas] = await db.query(`${SELECT_DETALLE} WHERE p.id = ?`, [pedidoId]);
            const pedido = filas[0];
            if (!pedido) return null;

            const [intentos] = pedido.direccion_id
                ? await db.query(
                    `SELECT id, direccion_enviada, resultado, latitud, longitud, nivel_confianza,
                            accion_operador, usuario_id, fecha
                     FROM historial_geolocalizacion
                     WHERE direccion_id = ?
                     ORDER BY id DESC`,
                    [pedido.direccion_id]
                )
                : [[]];

            return { ...pedido, intentos };
        },

        // Candidatos para detectar pedidos duplicados: mismo cliente y creados dentro
        // de la ventana configurada. La comparación normalizada se hace en el servicio
        // porque depende de reglas de texto que conviene mantener fuera del SQL.
        async buscarCandidatosDuplicados({ clienteId, ventanaHoras, exceptoId = null }) {
            if (!clienteId) return [];
            const [filas] = await db.query(
                `SELECT p.id, p.codigo, p.estado, p.created_at, d.direccion_original,
                        d.calle, d.altura, d.localidad, d.provincia
                 FROM pedidos p
                 JOIN direcciones d ON d.pedido_id = p.id
                 WHERE p.cliente_id = ?
                   AND p.created_at >= NOW() - INTERVAL ? HOUR
                   AND p.id <> ?
                 ORDER BY p.created_at DESC, p.id DESC`,
                [clienteId, ventanaHoras, exceptoId ?? 0]
            );
            return filas;
        },

        async actualizarDireccion(pedidoId, direccion, { invalidar, descartarCoordenadas } = {}) {
            const conexion = await db.getConnection();
            try {
                await conexion.beginTransaction();
                const asignaciones = [
                    "direccion_original = ?",
                    "calle = ?",
                    "altura = ?",
                    "piso_depto = ?",
                    "entre_calles = ?",
                    "localidad = ?",
                    "provincia = ?",
                    "codigo_postal = ?",
                    "estado_validacion = ?",
                ];
                const valores = [
                    direccion.direccion_original ?? null,
                    direccion.calle ?? null,
                    direccion.altura ?? null,
                    direccion.piso_depto ?? null,
                    direccion.entre_calles ?? null,
                    direccion.localidad ?? null,
                    direccion.provincia ?? null,
                    direccion.codigo_postal ?? null,
                    direccion.estado_validacion ?? "PENDIENTE",
                ];
                if (descartarCoordenadas) {
                    // Las coordenadas pertenecen a la versión anterior de la dirección:
                    // al cambiarla hay que geocodificar y confirmar de nuevo (D09/D10).
                    asignaciones.push("latitud = NULL", "longitud = NULL", "nivel_confianza = NULL");
                }
                valores.push(pedidoId);
                await conexion.query(`UPDATE direcciones SET ${asignaciones.join(", ")} WHERE pedido_id = ?`, valores);
                if (invalidar) {
                    await conexion.query("UPDATE pedidos SET direccion_validada = 0 WHERE id = ?", [pedidoId]);
                }
                await conexion.commit();
            } catch (error) {
                await conexion.rollback();
                throw error;
            } finally {
                conexion.release();
            }
        },

        // Guarda el resultado de un intento de geocodificación y su historial en una transacción.
        async registrarGeocodificacion({ pedidoId, direccionId, direccionEnviada, resultado, latitud, longitud, nivelConfianza, usuarioId, accionOperador }) {
            const conexion = await db.getConnection();
            try {
                await conexion.beginTransaction();
                await conexion.query(
                    `UPDATE direcciones SET latitud = ?, longitud = ?, nivel_confianza = ? WHERE id = ?`,
                    [latitud, longitud, nivelConfianza, direccionId]
                );
                await conexion.query(
                    `INSERT INTO historial_geolocalizacion
                        (direccion_id, usuario_id, direccion_enviada, resultado, latitud, longitud, nivel_confianza, accion_operador)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [direccionId, usuarioId ?? null, direccionEnviada, resultado, latitud, longitud, nivelConfianza, accionOperador ?? null]
                );
                await conexion.commit();
            } catch (error) {
                await conexion.rollback();
                throw error;
            } finally {
                conexion.release();
            }
        },

        async registrarAccionGeolocalizacion({ direccionId, usuarioId, accionOperador }) {
            await db.query(
                `UPDATE historial_geolocalizacion
                 SET accion_operador = ?, usuario_id = ?
                 WHERE direccion_id = ? AND accion_operador IS NULL
                 ORDER BY id DESC LIMIT 1`,
                [accionOperador, usuarioId ?? null, direccionId]
            );
        },

        // Confirmación humana: única vía para dejar la dirección en CONFIRMADA y habilitar despacho.
        async confirmarDireccion({ pedidoId, direccionId, direccionEnviada, latitud, longitud, nivelConfianza, usuarioId }) {
            const conexion = await db.getConnection();
            try {
                await conexion.beginTransaction();
                await conexion.query("UPDATE direcciones SET estado_validacion = 'CONFIRMADA' WHERE id = ?", [direccionId]);
                await conexion.query("UPDATE pedidos SET direccion_validada = 1 WHERE id = ?", [pedidoId]);
                await conexion.query(
                    `INSERT INTO historial_geolocalizacion
                        (direccion_id, usuario_id, direccion_enviada, resultado, latitud, longitud, nivel_confianza, accion_operador)
                     VALUES (?, ?, ?, 'OK', ?, ?, ?, 'CONFIRMO')`,
                    [direccionId, usuarioId ?? null, direccionEnviada, latitud, longitud, nivelConfianza]
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

module.exports = { createPedidoRepository };
