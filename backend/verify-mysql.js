// Verificación opt-in: ejecutar solo con npm run test:mysql, fuera del descubrimiento node --test.
const { randomBytes } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { createConnection } = require("mysql2/promise");
const { loadCliConfig } = require("./cli-config");
const { backupDatabase, restoreTestDatabase } = require("./backup");
const { createDatabase } = require("./database");
const assert = require("node:assert/strict");

async function main() {
    const config = loadCliConfig();
    const password = process.env.TEST_DB_ROOT_PASSWORD || process.env.MYSQL_ROOT_PASSWORD;
    if (!password) throw new Error("Falta configuración de root para crear una base aislada.");
    const databaseName = `mandatodo_test_${new Date().toISOString().slice(0, 10).replaceAll("-", "")}_${randomBytes(4).toString("hex")}`;
    const root = await createConnection({ host: config.DB_HOST, port: Number(config.DB_PORT), user: "root", password, connectTimeout: 3000 });
    try { await root.query(`CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4`); }
    finally { await root.end(); }
    console.log(`Base de prueba aislada: ${databaseName}. Se conserva con datos sintéticos; no se toca la base de la aplicación.`);
    const result = spawnSync(process.execPath, ["--test", "test/integration.test.js"], {
        cwd: __dirname, stdio: "inherit", env: { ...process.env, DB_HOST: config.DB_HOST, DB_PORT: config.DB_PORT,
            DB_USER: "root", DB_PASSWORD: password, TEST_DB_NAME: databaseName },
    });
    if (result.error || result.status !== 0) { process.exitCode = 1; return; }
    const backup = backupDatabase(databaseName);
    const restoreName = databaseName.replace("mandatodo_test_", "mandatodo_restore_test_");
    const admin = await createConnection({ host: config.DB_HOST, port: Number(config.DB_PORT), user: "root", password, connectTimeout: 3000 });
    try { await admin.query(`CREATE DATABASE \`${restoreName}\` CHARACTER SET utf8mb4`); }
    finally { await admin.end(); }
    restoreTestDatabase(backup.file, restoreName);
    const source = createDatabase({ ...config, DB_USER: "root", DB_PASSWORD: password, DB_NAME: databaseName });
    const restored = createDatabase({ ...config, DB_USER: "root", DB_PASSWORD: password, DB_NAME: restoreName });
    try {
        for (const table of ["clientes", "direcciones", "pedidos", "historial_geolocalizacion", "historial_estados", "usuarios", "sesiones", "schema_migrations"]) {
            const [originalRows] = await source.pool.query(`SELECT * FROM \`${table}\` ORDER BY 1`);
            const [restoredRows] = await restored.pool.query(`SELECT * FROM \`${table}\` ORDER BY 1`);
            assert.deepEqual(restoredRows, originalRows, `Restauración conserva ${table}`);
        }
        console.log(`Respaldo/restauración verificados en ${restoreName}: las 8 tablas conservan estructura consultable y todos sus registros.`);
    } finally { await Promise.all([source.close(), restored.close()]); }
}

main().catch(() => {
    console.error("No se pudo verificar MySQL aislado. Comprobá conexión y configuración local; no se imprimen credenciales.");
    process.exitCode = 1;
});
