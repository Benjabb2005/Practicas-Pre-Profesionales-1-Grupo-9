// Acceso a la tabla clientes para el alta y la búsqueda desde el formulario de
// carga. Solo SQL parametrizado; no devuelve contraseñas ni datos sensibles.
function createClienteRepository(db) {
    return {
        async listar({ busqueda } = {}) {
            if (busqueda) {
                const patron = `%${busqueda}%`;
                const [filas] = await db.query(
                    `SELECT id, codigo_origen, nombre, dni, telefono, email, tipo, domicilio
                     FROM clientes
                     WHERE nombre LIKE ? OR email LIKE ? OR telefono LIKE ? OR codigo_origen LIKE ?
                     ORDER BY nombre LIMIT 50`,
                    [patron, patron, patron, patron]
                );
                return filas;
            }
            const [filas] = await db.query(
                `SELECT id, codigo_origen, nombre, dni, telefono, email, tipo, domicilio
                 FROM clientes ORDER BY nombre LIMIT 200`
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
