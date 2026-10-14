// Acceso a la tabla usuarios. Solo SQL parametrizado; nunca devuelve contraseñas
// al cliente (el mapeo público lo hace el servicio).
function createUsuarioRepository(db) {
    return {
        async buscarPorEmail(email) {
            const [filas] = await db.query("SELECT * FROM usuarios WHERE email = ? LIMIT 1", [email]);
            return filas[0] || null;
        },

        async buscarPorId(id) {
            const [filas] = await db.query("SELECT * FROM usuarios WHERE id = ? LIMIT 1", [id]);
            return filas[0] || null;
        },

        async listar() {
            const [filas] = await db.query(
                "SELECT id, nombre, email, rol, activo, created_at FROM usuarios ORDER BY id"
            );
            return filas;
        },

        async crear({ nombre, email, passwordHash, rol, activo = 1 }) {
            const [resultado] = await db.query(
                "INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, ?, ?)",
                [nombre, email, passwordHash, rol, activo]
            );
            return resultado.insertId;
        },

        async actualizar(id, campos) {
            const asignaciones = [];
            const valores = [];
            for (const [columna, valor] of Object.entries(campos)) {
                asignaciones.push(`${columna} = ?`);
                valores.push(valor);
            }
            valores.push(id);
            await db.query(`UPDATE usuarios SET ${asignaciones.join(", ")} WHERE id = ?`, valores);
        },

        async existeEmail(email, exceptoId = null) {
            const [filas] = await db.query(
                "SELECT id FROM usuarios WHERE email = ? AND id <> ? LIMIT 1",
                [email, exceptoId ?? 0]
            );
            return filas.length > 0;
        },
    };
}

module.exports = { createUsuarioRepository };
