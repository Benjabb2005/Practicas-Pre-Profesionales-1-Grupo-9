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
    };
}

module.exports = { createClienteRepository };
