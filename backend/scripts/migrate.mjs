// Runner de migraciones versionadas del MVP1 (SQL plano, sin dependencias nuevas).
// Uso desde backend/:  npm run migrate  ·  npm run migrate:dry
// Seguridad: si la base ya tiene tablas sin historial de migraciones (por ejemplo,
// una base heredada del init.sql), aborta en vez de tocar un esquema con datos.
import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const migracionesDir = fileURLToPath(new URL("../../database/migrations/", import.meta.url));
const dryRun = process.argv.includes("--dry-run");

function dbConfig() {
    const faltantes = ["DB_HOST", "DB_USER", "DB_NAME"].filter((clave) => !process.env[clave]);
    if (faltantes.length) {
        console.error(`Faltan variables de entorno para migrar: ${faltantes.join(", ")}.`);
        process.exit(1);
    }
    return {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD ?? "",
        database: process.env.DB_NAME,
        multipleStatements: true,
    };
}

async function main() {
    const connection = await mysql.createConnection(dbConfig());
    try {
        await connection.query(
            `CREATE TABLE IF NOT EXISTS schema_migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                archivo VARCHAR(255) NOT NULL UNIQUE,
                aplicada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
        );

        const [filas] = await connection.query("SELECT archivo FROM schema_migrations");
        const aplicadas = new Set(filas.map((fila) => fila.archivo));

        if (aplicadas.size === 0) {
            const [tablas] = await connection.query(
                "SELECT table_name AS nombre FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name <> 'schema_migrations'"
            );
            if (tablas.length) {
                console.error("La base ya tiene tablas y no registra migraciones. Parece un esquema heredado (init.sql).");
                console.error("No se aplica nada automáticamente para no corromper datos. Hacé un backup, revisá docs/tareas.md (T02) y coordiná la migración.");
                process.exit(1);
            }
        }

        const archivos = readdirSync(migracionesDir).filter((archivo) => archivo.endsWith(".sql")).sort();
        const pendientes = archivos.filter((archivo) => !aplicadas.has(archivo));

        if (!pendientes.length) {
            console.log("No hay migraciones pendientes.");
            return;
        }

        if (dryRun) {
            console.log(`Dry-run: se aplicarían ${pendientes.length} migración(es): ${pendientes.join(", ")}`);
            return;
        }

        for (const archivo of pendientes) {
            const sql = readFileSync(join(migracionesDir, archivo), "utf8");
            console.log(`Aplicando ${archivo}...`);
            await connection.query(sql);
            await connection.query("INSERT INTO schema_migrations (archivo) VALUES (?)", [archivo]);
        }
        console.log(`Migraciones aplicadas: ${pendientes.join(", ")}`);
    } finally {
        await connection.end();
    }
}

main().catch((error) => {
    console.error(`Migración fallida: ${error.code || error.message}`);
    process.exit(1);
});
