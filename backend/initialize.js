const { createDatabase } = require('./database');
const { migrate } = require('./migrate');
const { createUser, validateAccount } = require('./create-user');
const { randomBytes } = require('node:crypto');
const { existsSync, writeFileSync } = require('node:fs');

// Solo instalación nueva. Una base existente pendiente requiere migración manual con respaldo.
async function initialize(pool, env, migration = migrate) {
    const report = await migration(pool);
    const pending = report.migrations.some((item) => item.status === 'pending');
    if (report.baseline === 'existing' && pending) throw new Error('La base existente requiere migración manual con respaldo.');
    const account = { nombre: env.INITIAL_ADMIN_NAME, email: env.INITIAL_ADMIN_EMAIL, password: env.INITIAL_ADMIN_PASSWORD, rol: 'admin' };
    if (report.baseline === 'new') {
        validateAccount(account); // Antes de cualquier DDL: configuración incompleta no deja una instalación parcial.
        await migration(pool, { apply: true });
    }
    const [users] = await pool.query('SELECT COUNT(*) AS total FROM usuarios');
    if (users[0].total > 0) return { status: 'existing', adminCreated: false };
    // También permite completar instalación si se interrumpió justo antes de crear la primera cuenta.
    validateAccount(account);
    await createUser(pool, account);
    return { status: 'ready', adminCreated: true };
}

async function main() {
    const database = createDatabase();
    try {
        const result = await initialize(database.pool, process.env);
        if (!process.env.SESSION_SECRET && process.env.SESSION_SECRET_FILE && !existsSync(process.env.SESSION_SECRET_FILE)) {
            writeFileSync(process.env.SESSION_SECRET_FILE, randomBytes(48).toString('hex'), { flag: 'wx', mode: 0o600 });
        }
        console.log(result.adminCreated ? 'Base completa y primer administrador preparados.' : 'Base actual conservada; no se modificaron cuentas.');
    } finally { await database.close(); }
}
if (require.main === module) main().catch(() => {
    console.error('Instalación detenida. Revisá INITIAL_ADMIN_NAME/EMAIL/PASSWORD (12 a 128 caracteres), conexión y migraciones pendientes. No se imprimen credenciales; no borres el volumen.');
    process.exitCode = 1;
});
module.exports = { initialize };
