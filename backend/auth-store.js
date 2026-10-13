function createAuthStore(pool) {
    return {
        async findUser(email) {
            const [rows] = await pool.execute(
                "SELECT id, nombre, email, rol, activo, password_hash FROM usuarios WHERE email = ? LIMIT 1", [email],
            );
            return rows[0] || null;
        },
        async createSession(jti, userId, expiresAt) {
            await pool.execute("INSERT INTO sesiones (jti, usuario_id, expira_en) VALUES (?, ?, ?)", [jti, userId, expiresAt]);
        },
        async findSession(jti) {
            const [rows] = await pool.execute(
                `SELECT s.jti, u.id, u.nombre, u.email, u.rol FROM sesiones s
                 JOIN usuarios u ON u.id = s.usuario_id
                 WHERE s.jti = ? AND s.revocada_en IS NULL AND s.expira_en > UTC_TIMESTAMP() AND u.activo = 1`, [jti],
            );
            return rows[0] || null;
        },
        async revokeSession(jti) {
            await pool.execute("UPDATE sesiones SET revocada_en = UTC_TIMESTAMP() WHERE jti = ? AND revocada_en IS NULL", [jti]);
        },
    };
}

module.exports = { createAuthStore };
