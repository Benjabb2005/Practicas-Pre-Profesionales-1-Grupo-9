// Acceso a la tabla clientes para el alta y la búsqueda desde el formulario de
// carga. Solo SQL parametrizado; no devuelve contraseñas ni datos sensibles.
function createClienteRepository(db) {
    return {
        async listar({ busqueda } = {}) {
            if (busqueda) {
                const patron = `%${busqueda}%`;
                // La búsqueda libre cubre nombre, DNI, email, teléfono y código de
                // importación. Además se busca por los dígitos del texto para que
                // "20.123.456" encuentre el DNI normalizado "20123456".
                const digitos = busqueda.replace(/\D/g, "");
                const condiciones = [
                    "nombre LIKE ?",
                    "dni LIKE ?",
                    "email LIKE ?",
                    "telefono LIKE ?",
                    "codigo_origen LIKE ?",
                ];
                const valores = [patron, patron, patron, patron, patron];
                if (digitos) {
                    condiciones.push("dni LIKE ?", "telefono LIKE ?");
                    valores.push(`%${digitos}%`, `%${digitos}%`);
                }
                const [filas] = await db.query(
                    `SELECT id, codigo_origen, nombre, dni, telefono, email, tipo, domicilio
                     FROM clientes
                     WHERE ${condiciones.join(" OR ")}
                     ORDER BY nombre, id`,
                    valores
                );
                return filas;
            }
            const [filas] = await db.query(
                `SELECT id, codigo_origen, nombre, dni, telefono, email, tipo, domicilio
                 FROM clientes ORDER BY nombre, id`
            );
            return filas;
        },

        async buscarPorId(id) {
            const [filas] = await db.query("SELECT * FROM clientes WHERE id = ? LIMIT 1", [id]);
            return filas[0] || null;
        },

        // Alta manual: codigo_origen queda NULL (reservado a la importación). El DNI
        // ya llega normalizado a solo dígitos; NULL permite varios clientes sin DNI.
        async crear({ nombre, dni, telefono, email, tipo, domicilio }) {
            const [resultado] = await db.query(
                `INSERT INTO clientes (codigo_origen, nombre, dni, telefono, email, tipo, domicilio)
                 VALUES (NULL, ?, ?, ?, ?, ?, ?)`,
                [nombre, dni ?? null, telefono ?? null, email ?? null, tipo || "particular", domicilio ?? null]
            );
            return resultado.insertId;
        },

        // Actualización completa de los campos editables. El servicio ya validó
        // y normalizó los datos antes de llegar acá.
        async actualizar(id, { nombre, dni, telefono, email, tipo, domicilio }) {
            await db.query(
                `UPDATE clientes
                 SET nombre = ?, dni = ?, telefono = ?, email = ?, tipo = ?, domicilio = ?
                 WHERE id = ?`,
                [nombre, dni, telefono, email, tipo, domicilio, id]
            );
            return id;
        },

        // La FK pedidos.cliente_id usa ON DELETE RESTRICT. El servicio consulta
        // primero para devolver un conflicto claro antes de intentar el DELETE.
        async tienePedidos(id) {
            const [filas] = await db.query(
                "SELECT 1 FROM pedidos WHERE cliente_id = ? LIMIT 1",
                [id]
            );
            return filas.length > 0;
        },

        async eliminar(id) {
            const [resultado] = await db.query("DELETE FROM clientes WHERE id = ?", [id]);
            return resultado.affectedRows;
        },

        async buscarPorDni(dni) {
            const [filas] = await db.query(
                "SELECT id, nombre, dni, telefono, email FROM clientes WHERE dni = ? LIMIT 1",
                [dni]
            );
            return filas[0] || null;
        },

        // Coincidencias por teléfono o email con otro cliente: se avisan, no se fusionan.
        async buscarCoincidencias({ telefono, email, exceptoId = null }) {
            const condiciones = [];
            const valores = [];
            if (telefono) {
                condiciones.push("telefono = ?");
                valores.push(telefono);
            }
            if (email) {
                condiciones.push("email = ?");
                valores.push(email);
            }
            if (!condiciones.length) return [];
            valores.push(exceptoId ?? 0);
            const [filas] = await db.query(
                `SELECT id, nombre, dni, telefono, email FROM clientes
                 WHERE (${condiciones.join(" OR ")}) AND id <> ? LIMIT 5`,
                valores
            );
            return filas;
        },
    };
}

module.exports = { createClienteRepository };
